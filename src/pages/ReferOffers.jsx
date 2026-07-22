import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Plus, CheckCircle, XCircle,
  Search, X, Edit, Trash2, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SelectField from '../components/common/SelectField';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { apiCall } from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const filterSelectStyles = {
  control: (provided, state, theme) => {
    const isDark = theme === 'dark';
    return {
      ...provided,
      minHeight: '42px',
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      borderColor: state.isFocused ? '#10b981' : (isDark ? '#374151' : '#e5e7eb'),
      boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#10b981' : (isDark ? '#4b5563' : '#d1d5db'),
      },
    };
  },
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatDateForInput = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
};

// ─── Form Modal ───────────────────────────────────────────────────────────────

const ReferOfferFormModal = ({ offer, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!offer;
  const [form, setForm] = useState({
    offer_name: offer?.offer_name || '',
    offer_code: offer?.offer_code || '',
    referrer_bonus_type: offer?.referrer_bonus_type || 'fixed',
    referrer_bonus_value: offer?.referrer_bonus_value || '',
    referee_bonus_type: offer?.referee_bonus_type || 'fixed',
    referee_bonus_value: offer?.referee_bonus_value || '',
    max_bonus_amount: offer?.max_bonus_amount || '',
    min_order_amount: offer?.min_order_amount || '',
    effective_from: formatDateForInput(offer?.effective_from),
    effective_to: formatDateForInput(offer?.effective_to),
    description: offer?.description || '',
    status: offer?.status ?? true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name) => (opt) => {
      setForm(prev => ({ ...prev, [name]: opt ? opt.value : 'fixed' }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    
    // Convert numbers
    payload.referrer_bonus_value = payload.referrer_bonus_value ? Number(payload.referrer_bonus_value) : 0;
    payload.referee_bonus_value = payload.referee_bonus_value ? Number(payload.referee_bonus_value) : 0;
    
    payload.max_bonus_amount = payload.max_bonus_amount ? Number(payload.max_bonus_amount) : null;
    payload.min_order_amount = payload.min_order_amount ? Number(payload.min_order_amount) : null;
    
    // Convert empty date to null
    if (!payload.effective_to) payload.effective_to = null;

    onSubmit(payload);
  };

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm dark:text-gray-100";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? "Edit Referral Offer" : "Create Referral Offer"}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      footer={
        <>
            <button onClick={onClose} type="button" className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              form="offer-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Offer' : 'Create Offer')}
            </button>
        </>
      }
    >
      <form id="offer-form" onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Offer Name *</label>
                <input required name="offer_name" value={form.offer_name} onChange={handleChange} placeholder="e.g. Refer & Earn ₹100" className={inputCls} />
            </div>
            
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Offer Code *</label>
                <input required name="offer_code" value={form.offer_code} onChange={handleChange} placeholder="e.g. SUMMER24" className={inputCls} />
            </div>
            <div className="flex flex-col justify-end">
                 <div className="flex items-center gap-3 py-2.5">
                    <input
                        type="checkbox"
                        id="offer-status"
                        name="status"
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        checked={form.status}
                        onChange={handleChange}
                    />
                    <label htmlFor="offer-status" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Active Status</label>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700 relative z-20">
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Referrer Bonus Type</label>
                <SelectField
                    options={[{ value: 'fixed', label: 'Fixed Amount (₹)' }, { value: 'percentage', label: 'Percentage (%)' }]}
                    value={[{ value: 'fixed', label: 'Fixed Amount (₹)' }, { value: 'percentage', label: 'Percentage (%)' }].find(o => o.value === form.referrer_bonus_type) || { value: 'fixed', label: 'Fixed Amount (₹)' }}
                    onChange={handleSelectChange('referrer_bonus_type')}
                    isClearable={false}
                />
            </div>
             <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Referrer Bonus Value *</label>
                <input type="number" step="0.01" min="0" required name="referrer_bonus_value" value={form.referrer_bonus_value} onChange={handleChange} placeholder="0.00" className={inputCls} />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Referee Bonus Type</label>
                <SelectField
                    options={[{ value: 'fixed', label: 'Fixed Amount (₹)' }, { value: 'percentage', label: 'Percentage (%)' }]}
                    value={[{ value: 'fixed', label: 'Fixed Amount (₹)' }, { value: 'percentage', label: 'Percentage (%)' }].find(o => o.value === form.referee_bonus_type) || { value: 'fixed', label: 'Fixed Amount (₹)' }}
                    onChange={handleSelectChange('referee_bonus_type')}
                    isClearable={false}
                />
            </div>
             <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Referee Bonus Value *</label>
                <input type="number" step="0.01" min="0" required name="referee_bonus_value" value={form.referee_bonus_value} onChange={handleChange} placeholder="0.00" className={inputCls} />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Max Bonus Amount</label>
                <input type="number" step="0.01" min="0" name="max_bonus_amount" value={form.max_bonus_amount} onChange={handleChange} placeholder="e.g. 500 (Optional)" className={inputCls} />
            </div>
             <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Min Order Amount</label>
                <input type="number" step="0.01" min="0" name="min_order_amount" value={form.min_order_amount} onChange={handleChange} placeholder="e.g. 1000 (Optional)" className={inputCls} />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
             <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Effective From *</label>
                <input type="datetime-local" required name="effective_from" value={form.effective_from} onChange={handleChange} className={inputCls} />
            </div>
             <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Effective To</label>
                <input type="datetime-local" name="effective_to" value={form.effective_to} onChange={handleChange} className={inputCls} />
                <p className="text-[10px] text-gray-500 mt-1">Leave empty for no expiry</p>
            </div>
        </div>

        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
            <textarea name="description" rows="3" value={form.description} onChange={handleChange} placeholder="Terms and conditions, details..." className={`${inputCls} resize-none`} />
        </div>
      </form>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReferOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalOffers, setTotalOffers] = useState(0);
  
  const activeFetchRef = useRef(null);

  // Debounce search input — 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOffers = useCallback(async ({ silent = false } = {}) => {
    const params = new URLSearchParams({
      page_no: currentPage,
      limit: itemsPerPage,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

    const requestKey = params.toString();
    if (activeFetchRef.current === requestKey) {
      setRefreshing(false);
      return;
    }

    activeFetchRef.current = requestKey;
    silent ? setRefreshing(true) : setLoading(true);
    
    try {
      const response = await apiCall(`/api/admin/refer-offers/list?${params.toString()}`);
      const json = await response.json();
      if (json.success) {
        setOffers(json.data || []);
        setTotalOffers(json.pagination?.total || 0);
      } else {
        toast.error(json.message || 'Failed to fetch refer offers.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleEdit = (offer) => { setEditingOffer(offer); setIsFormModalOpen(true); };
  const handleCreateNew = () => { setEditingOffer(null); setIsFormModalOpen(true); };
  const handleRefresh = () => fetchOffers({ silent: true });
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  const handleDeleteClick = (id) => {
      setOfferToDelete(id);
      setIsDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
      if (!offerToDelete) return;
      try {
          const response = await apiCall(`/api/admin/refer-offers/delete/${offerToDelete}`, 'DELETE');
          const json = await response.json();
          if (json.success) {
              toast.success('Offer deleted successfully');
              fetchOffers({ silent: true });
          } else {
              toast.error(json.message || 'Failed to delete offer');
          }
      } catch {
          toast.error('Error deleting offer');
      } finally {
          setIsDeleteModalOpen(false);
          setOfferToDelete(null);
      }
  }

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const isEdit = !!editingOffer;
      const endpoint = isEdit
        ? `/api/admin/refer-offers/update/${editingOffer.refer_offer_id}`
        : '/api/admin/refer-offers/create';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();
      if (json.success) {
        toast.success(isEdit ? 'Offer updated successfully' : 'Offer created successfully');
        setIsFormModalOpen(false);
        fetchOffers({ silent: true });
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch || (statusFilter && statusFilter !== 'all');

  // ─── Table Columns ───────────────────────────────────────────────────────────

  const formatBonus = (type, value) => {
      if (type === 'percentage') return `${value}%`;
      return `₹${value}`;
  }

  const tableColumns = [
    {
      key: 'name', label: 'Offer', render: (row) => (
        <div>
            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.offer_name}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium tracking-wide bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-emerald-100 dark:border-emerald-800/50">
                {row.offer_code}
            </div>
        </div>
      ),
    },
    { key: 'referrer_bonus', label: 'Referrer Bonus', render: (row) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatBonus(row.referrer_bonus_type, row.referrer_bonus_value)}</span> },
    { key: 'referee_bonus', label: 'Referee Bonus', render: (row) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatBonus(row.referee_bonus_type, row.referee_bonus_value)}</span> },
    { key: 'dates', label: 'Validity', render: (row) => (
        <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <div>From: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDateTime(row.effective_from)}</span></div>
            <div className="mt-0.5">To: <span className="font-medium text-gray-700 dark:text-gray-300">{row.effective_to ? formatDateTime(row.effective_to) : 'No Expiry'}</span></div>
        </div>
    )},
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <ManagementHub
      title="Refer Offers"
      description="Manage the referral offers and bonuses for users."
      accent="emerald"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={16} /> <span className='hidden md:block'>Create Offer</span>
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search by name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 h-[42px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm dark:text-gray-100"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-start md:items-center lg:items-center flex-col md:flex-row lg:flex-row gap-2">
            
            {/* Status filter */}
            <div className="min-w-[160px] w-full md:w-auto z-10 relative">
              <SelectField
                value={STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter) || STATUS_FILTER_OPTIONS[0]}
                onChange={(selected) => setStatusFilter(selected?.value || 'all')}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All Status"
                isClearable={false}
                styles={filterSelectStyles}
              />
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            {/* Count */}
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden xl:block">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalOffers}</span> offers
            </p>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton rows={6} columns={6} />}

        {/* Empty state */}
        {!loading && offers.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50">
            <Gift className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No refer offers found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first refer offer to get started.'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && offers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">
            <ManagementTable
              columns={tableColumns}
              rows={offers}
              rowKey="refer_offer_id"
              getActions={(row) => [
                { label: 'Edit Offer', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => handleDeleteClick(row.refer_offer_id), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' }
              ]}
              accent="emerald"
            />
          </motion.div>
        )}

        {!loading && totalOffers > 0 && (
          <PaginationComponent
            currentPage={currentPage}
            totalItems={totalOffers}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            availableLimits={[10, 20, 50, 100]}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <ReferOfferFormModal
            offer={editingOffer}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
      
      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        icon={Trash2}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="p-5">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this offer? This action cannot be undone.</p>
        </div>
      </Modal>
    </ManagementHub>
  );
}
