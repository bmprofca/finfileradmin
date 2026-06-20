import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import apiCall from '../utils/apiCall';

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

  const [documentName, setDocumentName] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + (Number(file.size) || 0), 0),
    [files]
  );

  const handleFilesChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const removeFile = (indexToRemove) => {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedOrderId) {
      toast.error('Missing order ID.');
      return;
    }
    if (!documentName.trim()) {
      toast.error('Enter a document name.');
      return;
    }
    if (files.length === 0) {
      toast.error('Select at least one document.');
      return;
    }

    const formData = new FormData();
    formData.append('document_name', documentName.trim());
    files.forEach((file) => formData.append('documents[]', file));

    setSubmitting(true);
    try {
      const response = await apiCall(`/api/admin/orders/upload-document/${resolvedOrderId}`, 'POST', formData);
      const data = await response.json();
      if (data.success) {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to upload order documents:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagementHub
      title="Upload Order Documents"
      description={`${order.order_name || resolvedOrderId || 'Order'}${order.client_name ? ` · ${order.client_name}` : ''}`}
      accent="indigo"
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Order ID
                </label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  {resolvedOrderId || 'Unknown'}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Document Name
                </label>
                <input
                  required
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                  placeholder="e.g. Completion Certificate"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Documents
              </label>
              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-6 text-center transition-colors hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30">
                <Upload className="mb-2 text-indigo-500 dark:text-indigo-400" size={30} />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Choose one or more files</span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Images, PDF, CSV, or other documents</span>
                <input type="file" multiple onChange={handleFilesChange} className="sr-only" />
              </label>
            </div>

            {files.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {files.length} file{files.length === 1 ? '' : 's'} selected
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(totalSize)}</p>
                </div>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText size={16} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Upload size={16} />
                {submitting ? 'Uploading...' : 'Upload Documents'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ManagementHub>
  );
}
