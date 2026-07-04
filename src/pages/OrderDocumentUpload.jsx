import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import apiCall, { uploadFile } from '../utils/apiCall';

const formatFileSize = (size) => {
  const bytes = Number(size) || 0;
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function OrderDocumentUpload() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { state } = useLocation();
  const order = state?.order || {};
  const resolvedOrderId = orderId || order.order_id;

  const [files, setFiles] = useState([]); // Array of { url, name, originalName, size, isImage }
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + (Number(f.size) || 0), 0),
    [files]
  );

  const processFiles = async (selectedFilesList) => {
    const selectedFiles = Array.from(selectedFilesList || []);
    if (selectedFiles.length === 0) return;

    setIsUploadingFiles(true);
    const newFiles = [];

    for (const file of selectedFiles) {
      try {
        const url = await uploadFile(file);
        newFiles.push({
          url,
          name: file.name.split('.').slice(0, -1).join('.') || file.name,
          originalName: file.name,
          size: file.size,
          isImage: file.type.startsWith('image/'),
        });
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setIsUploadingFiles(false);
  };

  const handleFilesChange = (event) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploadingFiles) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isUploadingFiles) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const updateFileName = (index, newName) => {
    setFiles((current) => current.map((f, i) => (i === index ? { ...f, name: newName } : f)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedOrderId) {
      toast.error('Missing order ID.');
      return;
    }
    if (files.length === 0) {
      toast.error('Select at least one document.');
      return;
    }

    const missingName = files.some(f => !f.name.trim());
    if (missingName) {
      toast.error('Enter a document name for all files.');
      return;
    }

    const payload = files.map((f) => ({
      name: f.name.trim(),
      url: f.url
    }));

    setSubmitting(true);
    try {
      const response = await apiCall(`/api/admin/orders/upload-document/${resolvedOrderId}`, 'POST', payload);
      const data = await response.json();
      if (data.success) {
        toast.success('Documents uploaded successfully');
        navigate('/orders');
      } else {
        toast.error(data.message || 'Failed to upload documents');
      }
    } catch (error) {
      toast.error('An error occurred while uploading documents');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagementHub
      title="Upload Order Documents"
      description={`${order.order_name || resolvedOrderId || 'Order'}${order.client_name ? ` · ${order.client_name}` : ''}`}
      accent="indigo"
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
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5"
        >
          <div className="space-y-5">
            {/* Order ID display removed as per user request */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Documents
              </label>
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${isDragging
                  ? 'border-indigo-500 bg-indigo-100 dark:border-indigo-500 dark:bg-indigo-900/40'
                  : 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30'
                  } ${isUploadingFiles ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                {isUploadingFiles ? (
                  <Loader2 className="mb-2 text-indigo-500 dark:text-indigo-400 animate-spin" size={30} />
                ) : (
                  <Upload className={`mb-2 transition-transform ${isDragging ? 'scale-110 text-indigo-600 dark:text-indigo-300' : 'text-indigo-500 dark:text-indigo-400'}`} size={30} />
                )}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {isUploadingFiles ? 'Uploading files...' : isDragging ? 'Drop files here' : 'Choose one or more files'}
                </span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Images, PDF, CSV, or other documents</span>
                <input type="file" multiple onChange={handleFilesChange} disabled={isUploadingFiles} className="sr-only" />
              </label>
            </div>

            {files.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {files.length} file{files.length === 1 ? '' : 's'} selected
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(totalSize)}</p>
                </div>
                <div className="space-y-3">
                  {files.map((item, index) => (
                    <div key={`${item.originalName}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex min-w-0 flex-1 items-center gap-3 w-full">
                        {item.isImage ? (
                          <img src={item.url} alt="preview" className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-600 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0 bg-gray-50 dark:bg-gray-700">
                            <FileText size={20} className="text-indigo-500 dark:text-indigo-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-2">
                          <input
                            required
                            value={item.name}
                            onChange={(e) => updateFileName(index, e.target.value)}
                            placeholder="Document Name"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                          />
                          <div className="flex justify-between items-center pr-2">
                            <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.originalName}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(item.size)}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 self-end sm:self-center"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isUploadingFiles}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Upload size={16} />
                {submitting ? 'Submitting...' : 'Submit Documents'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ManagementHub>
  );
}
