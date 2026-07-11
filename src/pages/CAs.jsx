import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Eye, User, Mail,
  Plus, Trash2, Edit, CheckCircle, XCircle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import apiCall, { uploadFile } from '../utils/apiCall';

const CAStatusBadge = ({ status }) => {
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

const CAAvatar = ({ ca, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const cls = sizes[size] || sizes.md;
  if (ca.image) {
    return <img src={ca.image} alt={ca.full_name} className={`${cls} rounded-lg object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {ca.full_name?.charAt(0)?.toUpperCase() || <User size={16} />}
    </div>
  );
};

const CAFormModal = ({ ca, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!ca;
  const [form, setForm] = useState({
    first_name: ca?.first_name || '',
    last_name: ca?.last_name || '',
    mobile: ca?.mobile || '',
    status: ca?.status ?? true,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setStatus = (val) => setForm((f) => ({ ...f, status: val }));

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
      title={isEdit ? 'Edit CA' : 'Create CA'}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="ca-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 dark:hover:bg-violet-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update CA' : 'Create CA'}
        </button>
      }
    >
      <form id="ca-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Account Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Account Status</label>
              <div className="flex gap-3">
                {[{ label: 'Active', value: true }, { label: 'Inactive', value: false }].map(({ label, value }) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${form.status === value
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

        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">First Name *</label>
              <input required value={form.first_name} onChange={set('first_name')} placeholder="First name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Last Name *</label>
              <input required value={form.last_name} onChange={set('last_name')} placeholder="Last name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Mobile *</label>
              <input required value={form.mobile} onChange={set('mobile')} placeholder="e.g. 9876543210" className={inputCls} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default function CAs() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [cas, setCas] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caToDelete, setCaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  const fetchCas = async ({ force = false } = {}) => {
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
      const response = await apiCall(`/api/admin/cas/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setCas(data.data.cas || []);
        setTotalItems(data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch CAs.');
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
    fetchCas();
  }, [currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCas({ force: true });
  };

  const handleCreateNew = () => {
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (ca) => {
    setCaToDelete(ca);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!caToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall(`/api/admin/cas/${caToDelete.username}`, 'DELETE');
      const json = await response.json();
      if (json.success) {
        toast.success('CA deleted successfully');
        setIsDeleteModalOpen(false);
        setCaToDelete(null);
        fetchCas({ force: true });
      } else {
        toast.error(json.message || 'Failed to delete CA.');
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
      const endpoint = '/api/admin/cas/create';
      const method = 'POST';

      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();

      if (json.success) {
        toast.success('CA created successfully');
        setIsFormModalOpen(false);
        fetchCas({ force: true });
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'full_name', label: 'CA Name', render: (row) => (
        <div className="flex items-center gap-2">
          <CAAvatar ca={row} size="sm" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.full_name}</span>
        </div>
      ),
    },
    { key: 'username', label: 'Username', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">@{row.username}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.email || '—'}</span> },
    { key: 'mobile', label: 'Mobile', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.mobile || '—'}</span> },
    {
      key: 'orders', label: 'Orders (Pending/Completed)', render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {row.pending_orders || 0} / {row.completed_orders || 0}
        </span>
      )
    },
    { key: 'status', label: 'Status', render: (row) => <CAStatusBadge status={row.status} /> },
  ];

  return (
    <ManagementHub
      title="CA Management"
      description="Manage Chartered Accountants."
      accent="violet"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} /><span className="hidden md:block">Add CA</span>
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 p-1 lg:p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex-1 max-w-lg items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search CAs..."
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
          </div>
        </motion.div>

        {loading && <PageContentSkeleton rows={6} columns={6} />}

        {!loading && cas.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50">
            <Users className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No CAs found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No CAs registered yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all"
              >
                <Plus size={16} /> Add First CA
              </button>
            )}
          </motion.div>
        )}

        {!loading && cas.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">
              <ManagementTable
                columns={columns}
                rows={cas}
                rowKey="username"
                onRowClick={(row) => navigate(`/cas/${row.username}`)}
                getActions={(row) => [
                  {
                    label: 'View Details',
                    icon: <User size={12} />,
                    onClick: () => navigate(`/cas/${row.username}`),
                    className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300'
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

      <AnimatePresence>
        {isFormModalOpen && (
          <CAFormModal
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && caToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete CA"
            icon={Trash2}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete CA'}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-100">{caToDelete.full_name}</span>
              {' '}(@{caToDelete.username})? This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
