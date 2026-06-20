import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Image,
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';

const TABS = [
  { key: 'images', label: 'Images', icon: Image },
  { key: 'pdf', label: 'PDF', icon: FileText },
  { key: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { key: 'others', label: 'Others', icon: File },
];

const getDocumentName = (document) => document.document_name || document.name || document.title || 'Document';

const getDocumentExtension = (document) => {
  const source = document.file_name || document.file_url || '';
  const cleanSource = source.split('?')[0].split('#')[0];
  return cleanSource.includes('.') ? cleanSource.split('.').pop().toLowerCase() : '';
};

const getDocumentType = (document) => {
  const ext = getDocumentExtension(document);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext)) return 'images';
  if (ext === 'pdf') return 'pdf';
  if (['csv', 'tsv'].includes(ext)) return 'csv';
  return 'others';
};

const formatFileSize = (size) => {
  const bytes = Number(size) || 0;
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const groupDocuments = (documents) => TABS.reduce((groups, tab) => {
  groups[tab.key] = documents.filter((document) => getDocumentType(document) === tab.key);
  return groups;
}, {});

const DocumentCard = ({ document, type }) => {
  const name = getDocumentName(document);
  const url = document.file_url;
  const ext = getDocumentExtension(document).toUpperCase() || 'FILE';

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {type === 'images' && url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block aspect-video bg-gray-100 dark:bg-gray-900">
          <img src={url} alt={name} className="h-full w-full object-cover" />
        </a>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {type === 'pdf' ? <FileText size={28} /> : type === 'csv' ? <FileSpreadsheet size={28} /> : <File size={28} />}
          </div>
        </div>
      )}

      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</p>
          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {document.file_name || 'No file name'} · {formatFileSize(document.size)} · {ext}
          </p>
        </div>
        {url && (
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              <ExternalLink size={14} /> View
            </a>
            <a
              href={url}
              download={document.file_name}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Download"
            >
              <Download size={15} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Documents() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const documents = useMemo(() => Array.isArray(state?.documents) ? state.documents : [], [state]);
  const title = state?.title || 'Documents';
  const subtitle = state?.subtitle || `${documents.length} uploaded document${documents.length === 1 ? '' : 's'}`;
  const groupedDocuments = useMemo(() => groupDocuments(documents), [documents]);
  const firstNonEmptyTab = TABS.find((tab) => groupedDocuments[tab.key].length > 0)?.key || 'images';
  const [activeTab, setActiveTab] = useState(firstNonEmptyTab);
  const activeDocuments = groupedDocuments[activeTab] || [];

  return (
    <ManagementHub
      title={title}
      description={subtitle}
      accent="emerald"
      actions={<>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </>}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive
                      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon size={15} />
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {groupedDocuments[key].length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
            <FileText className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={56} />
            <p className="text-gray-500 dark:text-gray-400">No documents found</p>
          </div>
        ) : activeDocuments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">No {TABS.find((tab) => tab.key === activeTab)?.label.toLowerCase()} documents found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activeDocuments.map((document) => (
              <DocumentCard
                key={document.document_id || document.id || document.file_url || document.file_name}
                document={document}
                type={activeTab}
              />
            ))}
          </div>
        )}
      </div>
    </ManagementHub>
  );
}
