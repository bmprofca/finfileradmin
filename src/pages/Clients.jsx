import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Added
import {
  Search, X, Eye, User, Phone, Mail,
  Plus, Trash2, Edit, CheckCircle, XCircle, Users, Calendar
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
import apiCall, { uploadFile } from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ClientStatusBadge = ({ status }) => {
  const isActive = status === 1 || status === true || status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}>
      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {isActive ? 'Active' : 'Inactive'}
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
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

const ClientAvatar = ({ client, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const cls = sizes[size] || sizes.md;
  if (client.image) {
    return <img src={client.image} alt={client.full_name} className={`${cls} rounded-sm object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-sm bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {client.full_name?.charAt(0)?.toUpperCase() || <User size={16} />}
    </div>
  );
};

// ─── Client Form Modal ────────────────────────────────────────────────────────

const ClientFormModal = ({ client, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!client;
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    username: client?.username || '',
    first_name: client?.first_name || '',
    middle_name: client?.middle_name || '',
    last_name: client?.last_name || '',
    email: client?.email || '',
    mobile: client?.mobile || '',
    status: client?.status ?? true,
    image: client?.image || '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setStatus = (val) => setForm((f) => ({ ...f, status: val }));

  const uploadImageFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    uploadImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    if (isUploading) return;
    uploadImageFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const createPayload = { ...form };
    delete createPayload.username;
    onSubmit(isEdit ? form : createPayload);
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm dark:text-gray-100';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Client' : 'Create Client'}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="client-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-sm bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 dark:hover:bg-violet-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
        </button>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Account Information */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Account Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEdit && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Username</label>
                <input
                  disabled
                  value={form.username}
                  className={`${inputCls} opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800`}
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Username is generated by the backend and cannot be changed.</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Account Status</label>
              <div className="flex gap-3">
                {[{ label: 'Active', value: true }, { label: 'Inactive', value: false }].map(({ label, value }) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`flex-1 py-2.5 rounded-sm border text-sm font-semibold transition-all ${form.status === value
                      ? value === true
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        {/* Personal Details */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">First Name *</label>
              <input required value={form.first_name} onChange={set('first_name')} placeholder="First name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Middle Name</label>
              <input value={form.middle_name} onChange={set('middle_name')} placeholder="Middle name (optional)" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Last Name *</label>
              <input required value={form.last_name} onChange={set('last_name')} placeholder="Last name" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} placeholder="client@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Mobile *</label>
              <input required value={form.mobile} onChange={set('mobile')} placeholder="e.g. +91 9876543210" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        {/* Profile Image */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Profile Image</h4>
          <label
            htmlFor="client-image-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className={`mt-2 flex cursor-pointer justify-center rounded-sm border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-within:ring-4 focus-within:ring-violet-500/10 ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="text-center flex flex-col items-center">
              {form.image && !isUploading ? (
                <div className="mb-4">
                  <img src={form.image} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto" />
                </div>
              ) : (
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-violet-600 dark:text-violet-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {isUploading ? 'Uploading image...' : form.image ? 'Change profile image' : 'Upload a profile image'}
                </span>
                <input id="client-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click anywhere or drag and drop. PNG, JPG, GIF up to 5MB</p>
            </div>
          </label>
        </div>

      </form>
    </Modal>
  );
};

// ─── Client Card (Card View) ──────────────────────────────────────────────────

const ClientManagementCard = ({ client, index, onView, onEdit, onDelete }) => (
  <ManagementCard
    key={client.username}
    delay={index * 0.05}
    accent="violet"
    eyebrow={`@${client.username}`}
    title={client.full_name}
    subtitle={client.email}
    icon={<ClientAvatar client={client} size="sm" />}
    badge={<ClientStatusBadge status={client.status} />}
    onClick={() => onView(client)}
    hoverable
    actions={[
      { label: 'View Profile', icon: <User size={12} />, onClick: () => onView(client), className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300' },
      { label: 'Edit Client', icon: <Edit size={12} />, onClick: () => onEdit(client), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300' },
      { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => onDelete(client), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
    ]}
    menuId={`client-card-${client.username}`}
  >
    <div className="mt-1">
      {client.mobile && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Phone size={10} className="text-gray-400 dark:text-gray-500" /> {client.mobile}
        </p>
      )}
    </div>
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Clients() {
  const navigate = useNavigate(); // Added
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [clients, setClients] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchClients = async ({ force = false } = {}) => {
    const requestKey = `${currentPage}|${itemsPerPage}|${searchTerm}`;
    if (activeFetchRef.current === requestKey) {
      setRefreshing(false);
      return;
    }
    if (!force && lastFetchRef.current === requestKey) return;

    lastFetchRef.current = requestKey;
    activeFetchRef.current = requestKey;
    setLoading(true);
    try {
      const response = await apiCall(`/api/admin/clients/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setClients(data.data.clients);
        setTotalItems(data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch clients.');
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
    fetchClients();
  }, [currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClients({ force: true });
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleViewProfile = (client) => {
    navigate(`/clients/${client.username}`);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall(`/api/admin/clients/delete/${clientToDelete.username}`, 'DELETE');
      const json = await response.json();
      if (json.success) {
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
        fetchClients({ force: true });
      } else {
        toast.error(json.message || 'Failed to delete client.');
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
      const isEdit = !!editingClient;
      const endpoint = isEdit
        ? `/api/admin/clients/update/${editingClient.username}`
        : '/api/admin/clients/create';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();

      if (json.success) {
        setIsFormModalOpen(false);
        fetchClients({ force: true });
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
      key: 'full_name', label: 'Client', render: (row) => (
        <div className="flex items-center gap-2">
          <ClientAvatar client={row} size="sm" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.full_name}</span>
        </div>
      ),
    },
    { key: 'username', label: 'Username', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">@{row.username}</span> },
    { key: 'first_name', label: 'First Name', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.first_name || '—'}</span> },
    { key: 'middle_name', label: 'Middle Name', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.middle_name || '—'}</span> },
    { key: 'last_name', label: 'Last Name', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.last_name || '—'}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.email || '—'}</span> },
    { key: 'mobile', label: 'Mobile', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.mobile || '—'}</span> },
    {
      key: 'create_date', label: 'Joined', render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {row.create_date ? new Date(row.create_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <ClientStatusBadge status={row.status} /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Client Management"
      description="Manage clients, their profiles, and account status."
      accent="violet"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} /> Add Client
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
                placeholder="Search clients by name, email, username, or mobile..."
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
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> client{totalItems !== 1 ? 's' : ''}
              {searchTerm && <span className="ml-1 text-violet-600 dark:text-violet-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <PageContentSkeleton viewMode={viewMode} rows={6} columns={6} />
        )}

        {/* Empty State */}
        {!loading && clients.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50">
            <Users className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No clients found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No clients registered yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all"
              >
                <Plus size={16} /> Add First Client
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && clients.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-sm bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={clients}
                  rowKey="username"
                  onRowClick={(row) => navigate(`/clients/${row.username}`)}
                  getActions={(row) => [
                    {
                      label: 'View Profile',
                      icon: <User size={12} />,
                      onClick: () => navigate(`/clients/${row.username}`),
                      className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300'
                    },
                    {
                      label: 'Edit Client',
                      icon: <Edit size={12} />,
                      onClick: () => handleEdit(row),
                      className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300'
                    },
                    {
                      label: 'Delete',
                      icon: <Trash2 size={12} />,
                      onClick: () => handleDeleteRequest(row),
                      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300'
                    },
                  ]}
                  accent="violet"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {clients.map((client, index) => (
                      <ClientManagementCard
                        key={client.username}
                        client={client}
                        index={index}
                        onView={() => navigate(`/clients/${client.username}`)}
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

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <ClientFormModal
            client={editingClient}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && clientToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete Client"
            icon={Trash2}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-100">{clientToDelete.full_name}</span>
              {' '}(@{clientToDelete.username})? This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
