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

const FILE_TYPE_MAP = {
  jpg: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  jpeg: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  png: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  gif: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  webp: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  bmp: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  svg: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  avif: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  pdf: { label: 'PDF', icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
  csv: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  tsv: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  xlsx: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  xls: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  doc: { label: 'Document', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' },
  docx: { label: 'Document', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' },
  mp4: { label: 'Video', icon: File, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
  mov: { label: 'Video', icon: File, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
  avi: { label: 'Video', icon: File, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
  mkv: { label: 'Video', icon: File, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
  mp3: { label: 'Audio', icon: File, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
  wav: { label: 'Audio', icon: File, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
  zip: { label: 'Archive', icon: File, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' },
  rar: { label: 'Archive', icon: File, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' },
};
const DEFAULT_FILE_TYPE = { label: 'File', icon: File, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' };

const getFileTypeInfo = (document) => FILE_TYPE_MAP[getDocumentExtension(document)] || DEFAULT_FILE_TYPE;

const getDocumentIcon = (document) => {
  const info = getFileTypeInfo(document);
  const Icon = info.icon;
  return <Icon size={18} className={info.color.split(' ')[0]} />;
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
      className: 'w-[48px] !max-w-[48px]',
      headerClassName: 'w-[48px]',
      render: (_row, index) => (
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Document',
      className: '!max-w-none',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
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
      key: 'file_type',
      label: 'Type',
      className: 'w-[110px] !max-w-[110px]',
      headerClassName: 'w-[110px]',
      render: (row) => {
        const info = getFileTypeInfo(row);
        const ext = getDocumentExtension(row);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${info.color}`}>
            {info.label}
            {ext && <span className="opacity-60 uppercase">.{ext}</span>}
          </span>
        );
      },
    },
    {
      key: 'username',
      label: 'Uploaded By',
      className: 'w-[140px] !max-w-[140px]',
      headerClassName: 'w-[140px]',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
          {row.username || row.create_by || '-'}
        </span>
      ),
    },
    {
      key: 'size',
      label: 'Size',
      className: 'w-[90px] !max-w-[90px]',
      headerClassName: 'w-[90px]',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {formatFileSize(row.size)}
        </span>
      ),
    },
    {
      key: 'actions_inline',
      label: 'Actions',
      className: 'w-[90px] !max-w-[90px]',
      headerClassName: 'w-[90px]',
      render: (row) => (
        <div className="flex items-center gap-0.5">
          {row.file_url && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(row.file_url, '_blank'); }}
                title="View"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <ExternalLink size={15} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(row); }}
                title="Download"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Download size={15} />
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

