import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { orderId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [pageTitle, setPageTitle] = useState('Documents');
  const [pageSubtitle, setPageSubtitle] = useState('');

  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);
  const detailsFetchedRef = useRef(false);

  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  useEffect(() => {
    if (!orderId || detailsFetchedRef.current) return;
    detailsFetchedRef.current = true;
    (async () => {
      try {
        const res = await apiCall(`/api/admin/orders/details/${orderId}`, 'GET');
        const data = await res.json();
        if (data.success) {
          const o = data.data;
          setPageTitle(`Documents - ${o.order_name || orderId}`);
          setPageSubtitle(`${o.service_name || 'Order'} · ${o.client_name || o.client_username || ''}`);
        }
      } catch { /* keep defaults */ }
    })();
  }, [orderId]);

  const fetchDocuments = useCallback(async ({ force = false } = {}) => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.append('order_id', orderId);
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
  }, [orderId, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments({ force: true });
  };

  const columns = [
    {
      key: 'serial_no',
      label: '#',
      render: (_row, index) => (
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </span>
      ),
    },
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
      key: 'username',
      label: 'Uploaded By',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.username || row.create_by || '-'}
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
    {
      key: 'actions_inline',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.file_url && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(row.file_url, '_blank'); }}
                title="View"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <ExternalLink size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(row); }}
                title="Download"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Download size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleDownload = async (doc) => {
    const fileName = doc.file_name || doc.document_name || doc.name || 'document';
    const toastId = toast.loading('Downloading...');
    try {
      const res = await apiCall(`/api/admin/documents/download/${doc.document_id}?source=order`, 'GET');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      toast.dismiss(toastId);
    } catch {
      toast.error('Failed to download file', { id: toastId });
    }
  };

  return (
    <ManagementHub
      title={pageTitle}
      description={pageSubtitle}
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
          <div className="rounded-sm border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800 shadow-sm">
            <FileText className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={56} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No documents found</p>
          </div>
        ) : (
          <div className="rounded-sm bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <ManagementTable
              columns={columns}
              rows={documents}
              rowKey={(row) => row.document_id || row.file_url}
              accent="emerald"
              showActionsColumn={false}
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

