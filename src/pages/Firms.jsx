import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Eye, User, Building2,
  Plus, Trash2, Edit, FileText, Hash, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import SelectField from '../components/common/SelectField';
import apiCall from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIRM_TYPES = [
  'Private Limited',
  'Public Limited',
  'Partnership',
  'Proprietorship',
  'LLP',
  'OPC',
  'Trust',
  'Society',
  'Other',
];

const FirmTypeBadge = ({ type }) => {
  const colorMap = {
    'Private Limited': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'Public Limited': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    'Partnership': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    'Proprietorship': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    'LLP': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    'OPC': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  };
  const cls = colorMap[type] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Building2 size={10} />
      {type || 'Unknown'}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-sm border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="dark:text-gray-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value || '—'}</div>
    </div>
  </div>
);

// ─── Firm Avatar ──────────────────────────────────────────────────────────────

const FirmAvatar = ({ firm, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const cls = sizes[size] || sizes.md;
  const initials = firm.name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className={`${cls} rounded-sm bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {initials.length > 1 ? initials : <Building2 size={16} />}
    </div>
  );
};

// ─── View Firm Modal ──────────────────────────────────────────────────────────

const ViewFirmModal = ({ firm, onClose, onEdit, onDelete, onDocuments }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Firm Details"
    icon={Building2}
    size="2xl"
    contentClassName="p-5 space-y-4"
    footer={
      <>
        <button
          onClick={() => onDelete(firm)}
          className="px-5 py-2.5 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
        >
          <Trash2 size={16} /> Delete
        </button>
        <button
          onClick={() => onEdit(firm)}
          className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <Edit size={16} /> Edit Firm
        </button>
      </>
    }
  >
    {/* Avatar + Name */}
    <div className="flex items-start justify-between gap-4 pb-4 border-b dark:border-gray-700">
      <div className="flex items-center gap-4">
        <FirmAvatar firm={firm} size="lg" />
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{firm.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Client: {firm.client_name}</p>
          <div className="mt-1.5 flex gap-2 items-center">
            <FirmTypeBadge type={firm.type} />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          onClose();
          onDocuments(firm);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
      >
        <FileText size={15} /> Documents
      </button>
    </div>

    {/* Firm Info */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Building2 className="text-violet-500 dark:text-violet-400" size={15} /> Firm & Tax Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem icon={Building2} label="Firm Name" value={firm.name} />
        <InfoItem icon={Building2} label="Firm Type" value={firm.type} />
        <InfoItem icon={FileText} label="PAN Number" value={firm.pan_no} />
        <InfoItem icon={FileText} label="GST Number" value={firm.gst_no} />
        <InfoItem icon={FileText} label="VAT Number" value={firm.vat_no} />
        <InfoItem icon={FileText} label="TAN Number" value={firm.tan_no} />
        <InfoItem icon={User} label="Client" value={firm.client_name} />
        <InfoItem icon={Hash} label="Firm ID" value={firm.firm_id} />
      </div>
    </div>
  </Modal>
);

// ─── Firm Documents Modal ───────────────────────────────────────────────────────

// ─── Firm Form Modal ──────────────────────────────────────────────────────────

const FirmFormModal = ({ firm, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!firm;
  const [form, setForm] = useState({
    username: firm?.client_username || firm?.username || '',
    name: firm?.name || '',
    type: firm?.type || '',
    pan_no: firm?.pan_no || '',
    gst_no: firm?.gst_no || '',
    vat_no: firm?.vat_no || '',
    tan_no: firm?.tan_no || '',
  });

  const [clientOptions, setClientOptions] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = async (search, page, isLoadMore = false) => {
    setIsLoadingClients(true);
    try {
      const res = await apiCall(`/api/admin/clients/list?page_no=${page}&limit=20&search=${search}`, 'GET');
      const data = await res.json();
      if (data.success) {
        const newOptions = data.data.clients.map(c => ({
          value: c.username,
          label: `${c.full_name} (${c.username})`,
          client: c
        }));
        setClientOptions(prev => isLoadMore ? [...prev, ...newOptions] : newOptions);
        setClientTotalPages(data.pagination.total_pages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    if (!isEdit) {
      const delayFn = setTimeout(() => {
        fetchClients(clientSearch, 1, false);
      }, 300);
      return () => clearTimeout(delayFn);
    }
  }, [clientSearch, isEdit]);

  const handleMenuScrollToBottom = () => {
    if (clientPage < clientTotalPages && !isLoadingClients) {
      const nextPage = clientPage + 1;
      setClientPage(nextPage);
      fetchClients(clientSearch, nextPage, true);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm dark:text-gray-100';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Firm' : 'Create Firm'}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="firm-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Firm' : 'Create Firm'}
        </button>
      }
    >
      <form id="firm-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Account / Client Linking */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Client Linking</h4>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Client Username *</label>
            {isEdit ? (
              <input
                disabled
                value={firm?.client_name || form.username}
                className={`${inputCls} bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70`}
              />
            ) : (
              <>
                <SelectField
                  options={clientOptions}
                  isLoading={isLoadingClients}
                  onInputChange={(val, { action }) => {
                    if (action === 'input-change') {
                      setClientSearch(val);
                      setClientPage(1);
                    }
                  }}
                  onMenuScrollToBottom={handleMenuScrollToBottom}
                  onChange={(option) => {
                    setForm(f => ({ ...f, username: option ? option.value : '' }));
                    setSelectedClient(option ? option.client : null);
                  }}
                  value={clientOptions.find(o => o.value === form.username) || null}
                  placeholder="Search and select client..."
                  isClearable
                />
                {selectedClient && (
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{selectedClient.full_name}</span>
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300 space-y-0.5 ml-5">
                      <p>Email: {selectedClient.email || 'N/A'}</p>
                      <p>Mobile: {selectedClient.mobile || 'N/A'}</p>
                    </div>
                  </div>
                )}
                {!selectedClient && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Search and select the client this firm belongs to.</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />

        {/* Firm Details */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Firm Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Firm Name *</label>
              <input required value={form.name} onChange={set('name')} placeholder="e.g. OneSaaS Private Limited" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Firm Type *</label>
              <SelectField
                options={FIRM_TYPES.map(t => ({ value: t, label: t }))}
                value={form.type ? { value: form.type, label: form.type } : null}
                onChange={(option) => setForm(f => ({ ...f, type: option ? option.value : '' }))}
                placeholder="Select firm type…"
              />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />

        {/* Tax Identifiers */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Tax Identifiers</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">PAN Number</label>
              <input value={form.pan_no} onChange={set('pan_no')} placeholder="e.g. AABCO1234A" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">GST Number</label>
              <input value={form.gst_no} onChange={set('gst_no')} placeholder="e.g. 19AABCO1234A1Z5" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">VAT Number</label>
              <input value={form.vat_no} onChange={set('vat_no')} placeholder="e.g. VAT123456" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">TAN Number</label>
              <input value={form.tan_no} onChange={set('tan_no')} placeholder="e.g. CALK12345A" className={inputCls} />
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
};

// ─── Firm Card (Card View) ────────────────────────────────────────────────────

const FirmManagementCard = ({ firm, index, onView, onEdit, onDelete, onDocuments }) => (
  <ManagementCard
    key={firm.firm_id}
    delay={index * 0.05}
    accent="violet"
    eyebrow={firm.client_name}
    title={firm.name}
    subtitle={firm.pan_no ? `PAN: ${firm.pan_no}` : 'No PAN on file'}
    icon={<FirmAvatar firm={firm} size="sm" />}
    badge={
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
        <FileText size={10} /> {firm.documents?.length || 0}
      </span>
    }
    onClick={() => onView(firm)}
    hoverable
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(firm), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
      { label: 'Documents', icon: <FileText size={12} />, onClick: () => onDocuments(firm), className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300' },
      { label: 'Edit Firm', icon: <Edit size={12} />, onClick: () => onEdit(firm), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
      { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => onDelete(firm), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
    ]}
    menuId={`firm-card-${firm.firm_id}`}
    footer={
      <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar size={10} className="text-violet-400" /> {firm.create_date ? new Date(firm.create_date).toLocaleDateString() : '—'}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDocuments(firm);
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/20"
        >
          <FileText size={12} /> Documents
        </button>
      </div>
    }
  >
    <div className="mt-1 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        <FirmTypeBadge type={firm.type} />
      </div>
      {firm.gst_no && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <FileText size={10} className="text-gray-400 dark:text-gray-500" /> GST: {firm.gst_no}
        </p>
      )}
    </div>
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Firms() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [firms, setFirms] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFirm, setSelectedFirm] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [firmToDelete, setFirmToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // ── Build query params ──────────────────────────────────────────────────────
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('page_no', currentPage);
    params.append('limit', itemsPerPage);
    if (searchTerm) params.append('search', searchTerm);
    return params.toString();
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchFirms = async ({ force = false } = {}) => {
    const queryString = buildQueryParams();
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
      const response = await apiCall(`/api/admin/firms/list?${queryString}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setFirms(data.data.firms);
        setTotalItems(data.pagination?.total_records || data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch firms.');
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
  };

  useEffect(() => {
    fetchFirms();
  }, [currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = () => { setRefreshing(true); fetchFirms({ force: true }); };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (firm) => { setSelectedFirm(firm); setIsViewModalOpen(true); };
  const handleEdit = (firm) => { setEditingFirm(firm); setIsFormModalOpen(true); setIsViewModalOpen(false); };
  const handleCreateNew = () => { setEditingFirm(null); setIsFormModalOpen(true); };
  const handleDeleteRequest = (firm) => { setFirmToDelete(firm); setIsDeleteModalOpen(true); setIsViewModalOpen(false); };
  const handleViewDocuments = (firm) => {
    setIsViewModalOpen(false);
    navigate('/documents', {
      state: {
        documents: firm.documents || [],
        title: `Documents - ${firm.name || firm.firm_id}`,
        subtitle: `${firm.client_name || 'Client'} · Firm ${firm.firm_id || ''}`,
        type: 'firm',
        id: firm.firm_id,
      },
    });
  };

  const confirmDelete = async () => {
    if (!firmToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall(`/api/admin/firms/delete/${firmToDelete.firm_id}`, 'DELETE');
      const json = await response.json();
      if (json.success) {
        setIsDeleteModalOpen(false);
        setFirmToDelete(null);
        fetchFirms({ force: true });
      } else {
        toast.error(json.message || 'Failed to delete firm.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const isEdit = !!editingFirm;
      const endpoint = isEdit ? `/api/admin/firms/update/${editingFirm.firm_id}` : '/api/admin/firms/create';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();
      if (json.success) {
        setIsFormModalOpen(false);
        fetchFirms({ force: true });
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
      key: 'name', label: 'Firm', render: (row) => (
        <div className="flex items-center gap-2">
          <FirmAvatar firm={row} size="sm" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.name}</span>
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (row) => <FirmTypeBadge type={row.type} /> },
    { key: 'client_name', label: 'Client', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.client_name || '—'}</span> },
    { key: 'pan_no', label: 'PAN', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{row.pan_no || '—'}</span> },
    { key: 'gst_no', label: 'GST', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{row.gst_no || '—'}</span> },
    { key: 'vat_no', label: 'VAT', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{row.vat_no || '—'}</span> },
    { key: 'tan_no', label: 'TAN', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{row.tan_no || '—'}</span> },
    {
      key: 'documents', label: 'Documents', render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleViewDocuments(row);
          }}
          className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 text-sm font-medium flex items-center gap-1"
        >
          <FileText size={14} /> Documents
        </button>
      )
    },
    { key: 'create_date', label: 'Created', render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.create_date ? new Date(row.create_date).toLocaleDateString() : '—'}</span> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Firm Management"
      description="Manage client firms, their profiles, and tax identifiers."
      accent="violet"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} /> Add Firm
        </Button>
      }
    >
      <div className="space-y-3 mt-2">

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-sm border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search firms by name, PAN, GST, client…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> firm{totalItems !== 1 ? 's' : ''}
              {searchTerm && <span className="ml-1 text-violet-600 dark:text-violet-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={6} columns={7} />}

        {/* Empty State */}
        {!loading && firms.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50">
            <Building2 className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No firms found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No firms registered yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all"
              >
                <Plus size={16} /> Add First Firm
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && firms.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-sm bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={firms}
                  rowKey="firm_id"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
                    { label: 'Documents', icon: <FileText size={12} />, onClick: () => handleViewDocuments(row), className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300' },
                    { label: 'Edit Firm', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                    { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => handleDeleteRequest(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
                  ]}
                  accent="violet"
                />
              )}

              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {firms.map((firm, index) => (
                      <FirmManagementCard
                        key={firm.firm_id}
                        firm={firm}
                        index={index}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                        onDocuments={handleViewDocuments}
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
        {isViewModalOpen && selectedFirm && (
          <ViewFirmModal
            firm={selectedFirm}
            onClose={() => { setIsViewModalOpen(false); setSelectedFirm(null); }}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onDocuments={handleViewDocuments}
          />
        )}
      </AnimatePresence>

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <FirmFormModal
            firm={editingFirm}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && firmToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete Firm"
            icon={Trash2}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Firm'}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-100">{firmToDelete.name}</span>?
              {' '}This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </ManagementHub>
  );
}

