import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, User, CreditCard,
  CheckCircle, XCircle, Clock, AlertCircle,
  Banknote, Calendar, Hash, RefreshCw, Filter,
  Building2, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';
import SelectField from '../components/common/SelectField';
import apiCall from '../utils/apiCall';
import { ConstantOptions } from '../contexts/ConstantOptionsContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

// ─── Status Badges ────────────────────────────────────────────────────────────

const WITHDRAWAL_STATUS_MAP = {
  'completed': {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    icon: CheckCircle,
    label: 'Completed'
  },
  'pending': {
    color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    icon: Clock,
    label: 'Pending'
  },
  'cancelled': {
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    icon: XCircle,
    label: 'Cancelled'
  },
};

const WithdrawalStatusBadge = ({ status }) => {
  const cfg = WITHDRAWAL_STATUS_MAP[status?.toLowerCase()] || WITHDRAWAL_STATUS_MAP['pending'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
};

// ─── Info Item ────────────────────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="text-blue-500 dark:text-blue-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className={`text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</div>
    </div>
  </div>
);

// ─── Filter Select Component ────────────────────────────────────────────────

const FilterSelect = ({ options, value, onChange, placeholder, icon: Icon }) => {
  const selectedOption = useMemo(() => options.find((opt) => opt.value === value) || null, [options, value]);

  return (
    <div className="relative">
      <SelectField
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : null)}
        options={options}
        placeholder={placeholder}
        isClearable
        styles={Icon ? { control: (base) => ({ ...base, paddingLeft: '1.75rem' }) } : {}}
      />
      {Icon && (
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
      )}
    </div>
  );
};

// ─── Update Status Modal ──────────────────────────────────────────────────────
const UpdateStatusModal = ({ withdrawal, onClose, onUpdate }) => {
  const [status, setStatus] = useState(withdrawal.status || 'pending');
  const [remark, setRemark] = useState(withdrawal.remark || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiCall(`/api/admin/withdrawals/${withdrawal.withdrawal_id}/status`, 'PUT', {
        status,
        remark
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Withdrawal status updated');
        onUpdate();
        onClose();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Error updating status');
    } finally {
      setSaving(false);
    }
  };

  const formId = 'update-status-form';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Update Withdrawal Status"
      icon={RefreshCw}
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form={formId}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Updating...' : 'Update Status'}
        </button>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <SelectField
            value={{ value: status, label: status.charAt(0).toUpperCase() + status.slice(1) }}
            onChange={(selected) => setStatus(selected ? selected.value : 'pending')}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
            rows="3"
            placeholder="E.g., Payment sent via NEFT"
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

// ─── View Details Modal ───────────────────────────────────────────────────────
const ViewDetailsModal = ({ withdrawalId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiCall(`/api/admin/withdrawals/details/${withdrawalId}`, 'GET');
        const data = await res.json();
        if (data.success) {
          setDetails(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch details');
          onClose();
        }
      } catch (err) {
        toast.error('Error fetching details');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [withdrawalId, onClose]);

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Withdrawal Details" icon={Banknote} size="2xl">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading details...</p>
        </div>
      </Modal>
    );
  }

  if (!details) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Withdrawal Details" icon={Banknote} size="3xl" contentClassName="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b dark:border-gray-700">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Banknote size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{formatAmount(details.amount)}</h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 break-all">ID: {details.withdrawal_id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <WithdrawalStatusBadge status={details.status} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
              {details.payment_method === 'bank' ? <Building2 size={9} /> : <Smartphone size={9} />}
              <span className="capitalize">{details.payment_method}</span>
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <User className="text-blue-500" size={15} /> User Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoItem icon={User} label="Username" value={`@${details.username}`} />
          <InfoItem icon={Hash} label="User Type" value={details.user_type} />
        </div>
      </div>

      {/* Payment Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Banknote className="text-blue-500" size={15} /> Payment Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {details.payment_method === 'bank' ? (
            <>
              <InfoItem icon={User} label="Account Holder" value={details.account_holder_name} />
              <InfoItem icon={Building2} label="Bank Name" value={details.bank_name} />
              <InfoItem icon={Hash} label="Account Number" value={details.account_number} mono />
              <InfoItem icon={Hash} label="IFSC Code" value={details.ifsc_code} mono />
            </>
          ) : (
            <InfoItem icon={Smartphone} label="UPI ID" value={details.upi_id} />
          )}
          {details.transaction_id && (
             <InfoItem icon={Hash} label="Transaction ID" value={details.transaction_id} mono />
          )}
        </div>
      </div>

      {/* Processing Info */}
      <div>
         <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="text-blue-500" size={15} /> Processing Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoItem icon={Calendar} label="Created On" value={formatDate(details.create_date)} />
          <InfoItem icon={Calendar} label="Processed On" value={formatDate(details.processed_date)} />
          <InfoItem icon={User} label="Processed By" value={details.processed_by || '—'} />
          <div className="col-span-1 sm:col-span-2">
             <InfoItem icon={AlertCircle} label="Remark" value={details.remark || '—'} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Withdrawals() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [withdrawalToUpdate, setWithdrawalToUpdate] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const paymentMethodOptions = [
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
  ];

  const userTypeOptions = [
    { value: 'client', label: 'Client' },
    { value: 'staff', label: 'Staff' },
    { value: 'ca', label: 'CA' },
  ];

  // ── Build query params ──────────────────────────────────────────────────────
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('page_no', currentPage);
    params.append('limit', itemsPerPage);

    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter) params.append('status', statusFilter);
    if (paymentMethodFilter) params.append('payment_method', paymentMethodFilter);
    if (userTypeFilter) params.append('user_type', userTypeFilter);

    // Date filter
    if (dateFilter) {
      if (dateFilter.date) {
        params.append('from_date', dateFilter.date);
        params.append('to_date', dateFilter.date);
      } else if (dateFilter.from_date && dateFilter.to_date) {
        params.append('from_date', dateFilter.from_date);
        params.append('to_date', dateFilter.to_date);
      }
    }

    return params.toString();
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchWithdrawals = async ({ force = false } = {}) => {
    const queryString = buildQueryParams();
    const requestKey = queryString;

    if (activeFetchRef.current === requestKey) { setRefreshing(false); return; }
    if (!force && lastFetchRef.current === requestKey) return;

    lastFetchRef.current = requestKey;
    activeFetchRef.current = requestKey;
    setLoading(true);

    try {
      const response = await apiCall(
        `/api/admin/withdrawals/list?${queryString}`,
        'GET'
      );
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.data.withdrawals || []);
        setTotalItems(data.data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch withdrawals.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  };

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, searchTerm, statusFilter, paymentMethodFilter, userTypeFilter, dateFilter, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWithdrawals({ force: true });
  };

  const handleView = (withdrawal) => {
    setSelectedWithdrawalId(withdrawal.withdrawal_id);
    setIsViewModalOpen(true);
  };

  const handleUpdateClick = (withdrawal) => {
    setWithdrawalToUpdate(withdrawal);
  };

  const clearAllFilters = () => {
    setStatusFilter(null);
    setPaymentMethodFilter(null);
    setUserTypeFilter(null);
    setDateFilter(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || paymentMethodFilter || userTypeFilter || dateFilter || searchTerm;

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'withdrawal_id',
      label: 'Request ID',
      render: (row) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Banknote size={13} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-mono font-semibold text-gray-800 dark:text-gray-100 text-sm truncate max-w-[150px]" title={row.withdrawal_id}>{row.withdrawal_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-2 truncate max-w-[150px]">
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate max-w-[150px]" title={`@${row.username}`}>@{row.username}</p>
          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {row.user_type}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
          {formatAmount(row.amount)}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 capitalize">
          {row.payment_method === 'bank' ? <Building2 size={12} className="text-gray-400"/> : <Smartphone size={12} className="text-gray-400"/>}
          {row.payment_method}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <WithdrawalStatusBadge status={row.status} />,
    },
    {
      key: 'create_date',
      label: 'Requested On',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {formatDate(row.create_date)}
        </span>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Withdrawals"
      description="Manage and process user withdrawal requests."
      accent="blue"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col lg:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm items-stretch lg:items-center"
          >
            {/* Search and View Switcher */}
            <div className="flex items-center gap-3 w-full lg:max-w-[260px] xl:max-w-xs flex-shrink-0">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:flex-1">
              <div className="flex-1 min-w-[120px] max-w-[180px] lg:max-w-none">
                <FilterSelect
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                  placeholder="All Status"
                  icon={Filter}
                />
              </div>
              <div className="flex-1 min-w-[120px] max-w-[180px] lg:max-w-none">
                <FilterSelect
                  options={paymentMethodOptions}
                  value={paymentMethodFilter}
                  onChange={(val) => { setPaymentMethodFilter(val); setCurrentPage(1); }}
                  placeholder="All Methods"
                  icon={Building2}
                />
              </div>
              <div className="flex-1 min-w-[120px] max-w-[180px] lg:max-w-none">
                <FilterSelect
                  options={userTypeOptions}
                  value={userTypeFilter}
                  onChange={(val) => { setUserTypeFilter(val); setCurrentPage(1); }}
                  placeholder="User Type"
                  icon={User}
                />
              </div>
              <div className="flex-1 min-w-[180px] max-w-[260px] lg:max-w-none">
                <AdvancedDateFilter
                  value={dateFilter}
                  onChange={(val) => { setDateFilter(val); setCurrentPage(1); }}
                  placeholder="Select Date"
                  tabOptions={['date', 'month', 'range']}
                  showDateStepper
                  buttonClassName="h-full min-h-[42px] w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-100 transition-colors"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors whitespace-nowrap min-h-[42px] flex-shrink-0"
                >
                  <X size={14} /> Clear All
                </button>
              )}
            </div>

        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton rows={6} columns={6} />}

        {/* Empty State */}
        {!loading && withdrawals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50"
          >
            <Banknote className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No withdrawals found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'No withdrawal requests yet'}
            </p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && withdrawals.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50"
            >
              <ManagementTable
                columns={columns}
                rows={withdrawals}
                rowKey="withdrawal_id"
                onRowClick={(row) => handleView(row)}
                getActions={(row) => {
                  const actions = [
                    {
                      label: 'View Details',
                      icon: <Eye size={12} />,
                      onClick: () => handleView(row),
                      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300'
                    }
                  ];
                  if (row.status === 'pending') {
                    actions.push({
                      label: 'Update Status',
                      icon: <RefreshCw size={12} />,
                      onClick: () => handleUpdateClick(row),
                      className: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 dark:text-amber-400 dark:hover:text-amber-300'
                    });
                  }
                  return actions;
                }}
                accent="blue"
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

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedWithdrawalId && (
          <ViewDetailsModal
            withdrawalId={selectedWithdrawalId}
            onClose={() => { setIsViewModalOpen(false); setSelectedWithdrawalId(null); }}
          />
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {withdrawalToUpdate && (
          <UpdateStatusModal
            withdrawal={withdrawalToUpdate}
            onClose={() => setWithdrawalToUpdate(null)}
            onUpdate={() => fetchWithdrawals({ force: true })}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
