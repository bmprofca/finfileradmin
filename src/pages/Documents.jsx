import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import { PageContentSkeleton } from '../components/SkeletonComponent';

const formatFileSize = (size) => {
  const bytes = Number(size) || 0;
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentExtension = (document) => {
  const source = document.file_name || document.file_url || '';
  const cleanSource = source.split('?')[0].split('#')[0];
  return cleanSource.includes('.') ? cleanSource.split('.').pop().toLowerCase() : '';
};

const getDocumentIcon = (document) => {
  const ext = getDocumentExtension(document);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext)) return <Image size={18} className="text-blue-500" />;
  if (ext === 'pdf') return <FileText size={18} className="text-red-500" />;
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={18} className="text-green-500" />;
  return <File size={18} className="text-gray-500" />;
};

export default function Documents() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const type = state?.type || '';
  const id = state?.id || '';
  const initialTitle = state?.title || 'Documents';
  const initialSubtitle = state?.subtitle || '';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  const fetchDocuments = useCallback(async ({ force = false } = {}) => {
    if (!type || !id) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (type === 'firm') {
      params.append('firm_id', id);
    } else if (type === 'order') {
      params.append('order_id', id);
    } else {
      params.append(`${type}_id`, id);
    }
    params.append('page_no', currentPage);
    params.append('limit', itemsPerPage);

    const queryString = params.toString();
    if (activeFetchRef.current === queryString) {
      setRefreshing(false);
      return;
    }
    if (!force && lastFetchRef.current === queryString) return;

    lastFetchRef.current = queryString;
    activeFetchRef.current = queryString;
    setLoading(true);
    
    try {
      const response = await apiCall(`/api/admin/documents/list?${queryString}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data.documents || []);
        setTotalItems(data.pagination?.total_records || data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch documents.');
      }
    } catch (error) {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === queryString) {
        activeFetchRef.current = null;
      }
    }
  }, [type, id, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments({ force: true });
  };

  const columns = [
    {
      key: 'name',
      label: 'Document',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            {getDocumentIcon(row)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
              {row.name || row.document_name || 'Document'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'document_id',
      label: 'Document ID',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.document_id || '-'}
        </span>
      ),
    },
    {
      key: 'related_id',
      label: 'Related ID',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.firm_id || row.order_id || row.id || '-'}
        </span>
      ),
    },
    {
      key: 'username',
      label: 'Uploaded By',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.username || '-'}
        </span>
      ),
    },
    {
      key: 'file_name',
      label: 'File Name',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 break-all">
          {row.file_name || '-'}
        </span>
      ),
    },
    {
      key: 'size',
      label: 'Size',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatFileSize(row.size)}
        </span>
      ),
    },
  ];

  const getActions = (document) => {
    const actions = [];
    if (document.file_url) {
      actions.push({
        label: 'View',
        icon: <ExternalLink size={12} />,
        onClick: () => window.open(document.file_url, '_blank'),
        className: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40',
      });
      actions.push({
        label: 'Download',
        icon: <Download size={12} />,
        onClick: () => {
          let downloadUrl = document.file_url;
          if (downloadUrl && downloadUrl.includes('backblazeb2.com')) {
            const disposition = `attachment; filename="${document.file_name || 'document'}"`;
            const separator = downloadUrl.includes('?') ? '&' : '?';
            downloadUrl = `${downloadUrl}${separator}b2ContentDisposition=${encodeURIComponent(disposition)}`;
          }
          
          const a = window.document.createElement('a');
          a.href = downloadUrl;
          a.download = document.file_name || 'document';
          // Using _blank prevents the current page from being replaced if the browser decides to navigate
          a.target = '_blank';
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
        },
        className: 'text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40',
      });
    }
    return actions;
  };

  return (
    <ManagementHub
      title={initialTitle}
      description={initialSubtitle}
      accent="emerald"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>
      }
    >
      <div className="space-y-4 mt-2">
        {loading ? (
          <PageContentSkeleton viewMode="table" rows={5} columns={3} />
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800 shadow-sm">
            <FileText className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={56} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No documents found</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <ManagementTable
              columns={columns}
              rows={documents}
              rowKey={(row) => row.document_id || row.file_url}
              accent="emerald"
              getActions={getActions}
            />
          </div>
        )}

        {!loading && totalItems > 0 && (
          <PaginationComponent
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            availableLimits={[10, 20, 50, 100]}
          />
        )}
      </div>
    </ManagementHub>
  );
}

