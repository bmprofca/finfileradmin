import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, Plus, Trash2, Edit, FileText,
  Calendar, Globe, Clock, Link2 as PathIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight, ListOrdered, List as ListIcon,
  Heading2, Paintbrush, ImagePlus, Link2, Code2, Quote, Undo2, Redo2,
} from 'lucide-react';

import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import apiCall, { uploadFile } from '../utils/apiCall';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

const TEXT_COLORS = ['#1f2937', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777'];

const EDITOR_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextStyle,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Link.configure({ openOnClick: false }),
  ImageExt,
];

const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s/-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// Minimal, dependency-free renderer for a Tiptap/ProseMirror JSON doc → HTML,
// covering the node/mark types produced by our editor (StarterKit + Underline,
// TextStyle/Color, TextAlign, Link, Image). Avoids needing the @tiptap/html package.
const escapeHtml = (s = '') =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderMarks = (text, marks = []) =>
  marks.reduce((html, mark) => {
    switch (mark.type) {
      case 'bold': return `<strong>${html}</strong>`;
      case 'italic': return `<em>${html}</em>`;
      case 'underline': return `<u>${html}</u>`;
      case 'code': return `<code>${html}</code>`;
      case 'link': {
        const href = escapeHtml(mark.attrs?.href || '#');
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }
      case 'textStyle': {
        const color = mark.attrs?.color;
        return color ? `<span style="color:${escapeHtml(color)}">${html}</span>` : html;
      }
      default: return html;
    }
  }, escapeHtml(text));

const attrStyle = (attrs = {}) => (attrs.textAlign ? ` style="text-align:${escapeHtml(attrs.textAlign)}"` : '');

const renderNode = (node) => {
  if (!node) return '';
  if (node.type === 'text') return renderMarks(node.text || '', node.marks);

  const children = Array.isArray(node.content) ? node.content.map(renderNode).join('') : '';

  switch (node.type) {
    case 'doc': return children;
    case 'paragraph': return `<p${attrStyle(node.attrs)}>${children || '<br/>'}</p>`;
    case 'heading': {
      const level = node.attrs?.level || 2;
      return `<h${level}${attrStyle(node.attrs)}>${children}</h${level}>`;
    }
    case 'bulletList': return `<ul>${children}</ul>`;
    case 'orderedList': return `<ol>${children}</ol>`;
    case 'listItem': return `<li>${children}</li>`;
    case 'blockquote': return `<blockquote>${children}</blockquote>`;
    case 'codeBlock': return `<pre><code>${children}</code></pre>`;
    case 'hardBreak': return '<br/>';
    case 'horizontalRule': return '<hr/>';
    case 'image': {
      const src = escapeHtml(node.attrs?.src || '');
      const alt = escapeHtml(node.attrs?.alt || '');
      return `<img src="${src}" alt="${alt}" />`;
    }
    default: return children;
  }
};

// Render a ProseMirror/Tiptap JSON doc to HTML for read-only display (view modal, excerpts).
const docToHtml = (doc) => {
  if (!doc) return '';
  let node = doc;
  if (typeof doc === 'string') {
    // Tolerate legacy/raw HTML strings or already-stringified JSON.
    try {
      node = JSON.parse(doc);
    } catch {
      return doc;
    }
  }
  try {
    return renderNode(node);
  } catch {
    return '';
  }
};

// Rough plain-text extraction from a Tiptap JSON doc, for card/table previews.
const docToText = (doc) => {
  if (!doc) return '';
  let node = doc;
  if (typeof doc === 'string') {
    try { node = JSON.parse(doc); } catch { return doc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
  }
  const parts = [];
  const walk = (n) => {
    if (!n) return;
    if (n.type === 'text' && n.text) parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(node);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

// ─── Helpers / Small UI bits ───────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    published: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    draft:     'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    archived:  'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  };
  const cls = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      <Globe size={10} />
      {status || 'draft'}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="dark:text-gray-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value || '—'}</div>
    </div>
  </div>
);

const BlogThumb = ({ blog, size = 'md' }) => {
  const sizes = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-full h-48' };
  const cls = sizes[size] || sizes.md;
  if (blog.thumbnail) {
    return (
      <img
        src={blog.thumbnail}
        alt={blog.title}
        className={`${cls} rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-700`}
      />
    );
  }
  return (
    <div className={`${cls} rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center text-white shrink-0`}>
      <FileText size={size === 'lg' ? 36 : 18} />
    </div>
  );
};

// ─── View Blog Modal ──────────────────────────────────────────────────────────

const ViewBlogModal = ({ blog, onClose, onEdit, onDelete }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Blog Post Details"
    icon={FileText}
    size="3xl"
    contentClassName="p-5 space-y-4"
    footer={
      <>
        <button
          onClick={() => onDelete(blog)}
          className="px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
        >
          <Trash2 size={16} /> Delete
        </button>
        <button
          onClick={() => onEdit(blog)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <Edit size={16} /> Edit Post
        </button>
      </>
    }
  >
    {/* Header */}
    <div className="pb-4 border-b dark:border-gray-700">
      <BlogThumb blog={blog} size="lg" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{blog.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">/{blog.path}</p>
        </div>
        <StatusBadge status={blog.status} />
      </div>
    </div>

    {/* Meta */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <FileText className="text-fuchsia-500 dark:text-fuchsia-400" size={15} /> Post Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem icon={PathIcon} label="Path" value={blog.path ? `/${blog.path}` : '—'} />
        <InfoItem
          icon={Calendar}
          label="Published"
          value={blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '—'}
        />
        <InfoItem
          icon={Clock}
          label="Last Updated"
          value={blog.updated_at ? new Date(blog.updated_at).toLocaleDateString() : '—'}
        />
      </div>
    </div>

    {/* Summary */}
    {blog.summary && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          {blog.summary}
        </p>
      </div>
    )}

    {/* Content Preview */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</h4>
      <div
        className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 max-h-72 overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: docToHtml(blog.content) || '<p class="text-gray-400">No content yet.</p>' }}
      />
    </div>
  </Modal>
);

// ─── Rich Text Editor (Tiptap, WordPress-style toolbar, JSON in/out) ──────────

const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed
      ${active
        ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
  >
    {children}
  </button>
);

// `value` is a Tiptap/ProseMirror JSON doc (object). onChange receives the updated JSON doc.
const RichTextEditor = ({ value, onChange }) => {
  const [showColors, setShowColors] = useState(false);
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: value && typeof value === 'object' ? value : EMPTY_DOC,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[260px] px-4 py-3 outline-none',
      },
    },
  });

  // Keep editor content in sync if `value` is reset externally (e.g. switching post)
  useEffect(() => {
    if (editor && document.activeElement?.closest('.ProseMirror') === null) {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(value && typeof value === 'object' ? value : EMPTY_DOC);
      if (current !== incoming) {
        editor.commands.setContent(value && typeof value === 'object' ? value : EMPTY_DOC, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarBtn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={15} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarBtn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListIcon size={15} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <div className="relative">
          <ToolbarBtn title="Text color" onClick={() => setShowColors((s) => !s)}>
            <Paintbrush size={15} />
          </ToolbarBtn>
          {showColors && (
            <div className="absolute z-10 top-9 left-0 flex gap-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowColors(false); }}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-full border border-white/50 shadow"
                />
              ))}
            </div>
          )}
        </div>

        <ToolbarBtn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={addLink}>
          <Link2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Image" onClick={addImage}>
          <ImagePlus size={15} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <EditorContent editor={editor} />
    </div>
  );
};

// ─── Blog Form Modal (WordPress-style editor) ────────────────────────────────

const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // yyyy-mm-dd for <input type="date">
  return d.toISOString().slice(0, 10);
};

const BlogFormModal = ({ blog, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!blog;
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: blog?.title || '',
    path: blog?.path || '',
    thumbnail: blog?.thumbnail || '',
    summary: blog?.summary || '',
    status: blog?.status || 'draft',
    published_at: toDateInputValue(blog?.published_at),
    content: blog && typeof blog.content === 'object' ? blog.content : EMPTY_DOC,
  });
  const [pathTouched, setPathTouched] = useState(isEdit);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      path: pathTouched ? f.path : slugify(title),
    }));
  };

  const handlePathChange = (e) => {
    setPathTouched(true);
    setForm((f) => ({ ...f, path: slugify(e.target.value) }));
  };

  const handleContentChange = (json) => setForm((f) => ({ ...f, content: json }));

  const uploadThumbnailFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, thumbnail: url }));
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailUpload = (e) => {
    uploadThumbnailFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    if (isUploading) return;
    uploadThumbnailFile(e.dataTransfer.files?.[0]);
  };

  const buildPayload = () => {
    const payload = {
      title: form.title.trim(),
      path: form.path.trim() || slugify(form.title),
      thumbnail: form.thumbnail.trim(),
      summary: form.summary.trim(),
      content: form.content,
      status: form.status,
    };
    if (form.published_at) {
      payload.published_at = new Date(form.published_at).toISOString();
    }
    if (isEdit) payload.blog_id = blog.blog_id;
    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(buildPayload());
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-500 outline-none transition-all text-sm dark:text-gray-100';


  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Blog Post' : 'New Blog Post'}
      icon={isEdit ? Edit : Plus}
      size="4xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <div className="flex items-center gap-2 w-full justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            type="submit"
            form="blog-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Post' : 'Publish / Save'}
          </button>
        </div>
      }
    >
      <form id="blog-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Title + Path — WordPress style big title field */}
        <div>
          <input
            required
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Add title"
            className="w-full text-2xl font-bold px-3 py-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-fuchsia-500 outline-none transition-all dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 px-3">
            <span>Path:</span>
            <span className="text-gray-400">/</span>
            <input
              value={form.path}
              onChange={handlePathChange}
              placeholder="tax/gst/how-to-file-gst-returns"
              className="flex-1 bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 focus:border-fuchsia-500 outline-none text-fuchsia-600 dark:text-fuchsia-400 font-medium"
            />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Content</label>
          <RichTextEditor value={form.content} onChange={handleContentChange} />
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />

        {/* Summary */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Summary</label>
          <textarea
            value={form.summary}
            onChange={set('summary')}
            rows={3}
            placeholder="A short summary shown in listings…"
            className={inputCls}
          />
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Published Date</label>
            <input type="date" value={form.published_at} onChange={set('published_at')} className={inputCls} />
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />

        {/* Featured/Thumbnail Image */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Thumbnail Image</label>
          <label
            htmlFor="blog-thumbnail-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleThumbnailDrop}
            className={`mt-2 flex cursor-pointer justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-within:ring-4 focus-within:ring-fuchsia-500/10 ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="text-center flex flex-col items-center">
              {form.thumbnail && !isUploading ? (
                <div className="mb-4">
                  <img src={form.thumbnail} alt="Preview" className="w-full max-w-xs h-32 rounded-xl object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto" />
                </div>
              ) : (
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-fuchsia-600 dark:text-fuchsia-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                  {isUploading ? 'Uploading image...' : form.thumbnail ? 'Change thumbnail image' : 'Upload a thumbnail image'}
                </span>
                <input id="blog-thumbnail-upload" type="file" accept="image/*" className="sr-only" onChange={handleThumbnailUpload} disabled={isUploading} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click anywhere or drag and drop. PNG, JPG, GIF up to 5MB</p>
            </div>
          </label>
        </div>

      </form>
    </Modal>
  );
};

// ─── Blog Card (Card View) ─────────────────────────────────────────────────────

const BlogManagementCard = ({ blog, index, onView, onEdit, onDelete }) => (
  <ManagementCard
    key={blog.blog_id}
    delay={index * 0.05}
    accent="fuchsia"
    eyebrow={blog.path ? `/${blog.path}` : null}
    title={blog.title}
    subtitle={blog.summary || docToText(blog.content).slice(0, 60)}
    icon={<BlogThumb blog={blog} size="sm" />}
    badge={<StatusBadge status={blog.status} />}
    onClick={() => onView(blog)}
    hoverable
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(blog), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
      { label: 'Edit Post',    icon: <Edit size={12} />, onClick: () => onEdit(blog), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
      { label: 'Delete',       icon: <Trash2 size={12} />, onClick: () => onDelete(blog), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
    ]}
    menuId={`blog-card-${blog.blog_id}`}
    footer={
      <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar size={10} className="text-fuchsia-400" />
          {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '—'}
        </span>
      </div>
    }
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Blogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [blogs, setBlogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async ({ force = false } = {}) => {
    const params = new URLSearchParams();
    params.append('page_no', currentPage);
    params.append('limit', itemsPerPage);
    if (searchTerm) params.append('search', searchTerm);
    const queryString = params.toString();
    const requestKey = queryString;

    if (activeFetchRef.current === requestKey) {
      setRefreshing(false);
      return;
    }
    if (!force && lastFetchRef.current === requestKey) return;

    lastFetchRef.current = requestKey;
    activeFetchRef.current = requestKey;
    setLoading(true);
    try {
      const response = await apiCall(`/api/admin/blogs/list?${queryString}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setBlogs(data.data.blogs);
        setTotalItems(data.data?.pagination?.total_records || data.data?.pagination?.total || data.pagination?.total_records || data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch blog posts.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) {
        activeFetchRef.current = null;
      }
    }
  }, [currentPage, searchTerm, itemsPerPage]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleRefresh = () => { setRefreshing(true); fetchBlogs({ force: true }); };

  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleView          = (blog) => { setSelectedBlog(blog); setIsViewModalOpen(true); };
  const handleEdit           = (blog) => { setEditingBlog(blog); setIsFormModalOpen(true); setIsViewModalOpen(false); };
  const handleCreateNew      = () => { setEditingBlog(null); setIsFormModalOpen(true); };
  const handleDeleteRequest  = (blog) => { setBlogToDelete(blog); setIsDeleteModalOpen(true); setIsViewModalOpen(false); };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall('/api/admin/blogs/delete', 'DELETE', { blog_id: blogToDelete.blog_id });
      const json = await response.json();
      if (json.success) {
        toast.success('Blog post deleted successfully.');
        setIsDeleteModalOpen(false);
        setBlogToDelete(null);
        fetchBlogs({ force: true });
      } else {
        toast.error(json.message || 'Failed to delete blog post.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  // payload here is already a plain JSON-serializable object built in BlogFormModal
  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      const isEdit   = !!editingBlog;
      const endpoint = isEdit ? '/api/admin/blogs/update' : '/api/admin/blogs/create';
      const method   = isEdit ? 'PUT' : 'POST';
      const response = await apiCall(endpoint, method, payload);
      const json     = await response.json();
      if (json.success) {
        toast.success(isEdit ? 'Blog post updated successfully!' : 'Blog post created successfully!');
        setIsFormModalOpen(false);
        fetchBlogs({ force: true });
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'title', label: 'Post', render: (row) => (
        <div className="flex items-center gap-2">
          <BlogThumb blog={row} size="sm" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.title}</div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">/{row.path}</div>
          </div>
        </div>
      ),
    },
    { key: 'status',       label: 'Status',     render: (row) => <StatusBadge status={row.status} /> },
    { key: 'summary',      label: 'Summary',    render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 max-w-[220px] block">{row.summary || '—'}</span> },
    { key: 'published_at', label: 'Published',  render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.published_at ? new Date(row.published_at).toLocaleDateString() : '—'}</span> },
    { key: 'updated_at',   label: 'Updated',     render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}</span> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Blog Management"
      description="Create, edit, and publish blog posts for your audience."
      accent="fuchsia"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} /> New Post
        </Button>
      }
    >
      <div className="space-y-3 mt-2">

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search posts by title or path…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> post{totalItems !== 1 ? 's' : ''}
              {searchTerm && <span className="ml-1 text-fuchsia-600 dark:text-fuchsia-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="fuchsia" />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={6} columns={5} />}

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50">
            <FileText className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No blog posts found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No posts have been written yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fuchsia-600 text-white text-sm font-semibold hover:bg-fuchsia-700 transition-all"
              >
                <Plus size={16} /> Write First Post
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && blogs.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={blogs}
                  rowKey="blog_id"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { label: 'View Details', icon: <Eye size={12} />,   onClick: () => handleView(row),         className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
                    { label: 'Edit Post',    icon: <Edit size={12} />,   onClick: () => handleEdit(row),         className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                    { label: 'Delete',       icon: <Trash2 size={12} />, onClick: () => handleDeleteRequest(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
                  ]}
                  accent="fuchsia"
                />
              )}

              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {blogs.map((blog, index) => (
                      <BlogManagementCard
                        key={blog.blog_id}
                        blog={blog}
                        index={index}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                      />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
              <PaginationComponent
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onLimitChange={handleLimitChange}
                availableLimits={[10, 20, 50, 100]}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedBlog && (
          <ViewBlogModal
            blog={selectedBlog}
            onClose={() => { setIsViewModalOpen(false); setSelectedBlog(null); }}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </AnimatePresence>

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <BlogFormModal
            blog={editingBlog}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && blogToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete Blog Post"
            icon={Trash2}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Post'}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-100">{blogToDelete.title}</span>?
              {' '}This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </ManagementHub>
  );
}