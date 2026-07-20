import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, User, Wallet as WalletIcon,
  CheckCircle, Clock, AlertCircle, RefreshCw, Filter,
  ArrowUpRight, ArrowDownRight, PlusCircle, MinusCircle, Hash, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';
import SelectField from '../components/common/SelectField';
import AsyncSelectField from '../components/common/AsyncSelectField';
import apiCall from '../utils/apiCall';

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

// ─── Info Item ────────────────────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="text-violet-500 dark:text-violet-400" />
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

// ─── Adjust Balance Modal (header button — user search) ───────────────────────
const AdjustBalanceModal = ({ onClose, onUpdate }) => {
  const [username, setUsername] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [action, setAction] = useState('add');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !amount) {
      toast.error('Username and amount are required');
      return;
    }
    setSaving(true);
    try {
      const res = await apiCall('/api/admin/transactions/adjust-balance', 'POST', {
        username,
        action,
        amount: Number(amount),
        remark
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Balance adjusted successfully');
        onUpdate();
        onClose();
      } else {
        toast.error(data.message || 'Failed to adjust balance');
      }
    } catch (err) {
      toast.error('Error adjusting balance');
    } finally {
      setSaving(false);
    }
  };

  const formId = 'adjust-balance-form';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Adjust Wallet Balance"
      icon={WalletIcon}
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form={formId}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Adjust Balance'}
        </button>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
          <AsyncSelectField
            fetchUrl="/api/admin/clients/active-users"
            dataKey="users"
            labelKey={(user) => `@${user.username} - ${user.full_name}`}
            valueKey="username"
            value={username}
            onChange={(val, opt) => {
              setUsername(val);
              setSelectedUser(opt);
            }}
            placeholder="Search username..."
          />
          {selectedUser && (
            <div className="mt-3 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex gap-3 items-center mb-2">
                <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm shrink-0">
                  {selectedUser.first_name ? selectedUser.first_name.charAt(0).toUpperCase() : selectedUser.username?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{selectedUser.full_name || `@${selectedUser.username}`}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Role</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedUser.role || 'Client'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Mobile</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedUser.mobile || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
          <SelectField
            value={{ value: action, label: action === 'add' ? 'Add Balance' : 'Remove Balance' }}
            onChange={(selected) => setAction(selected ? selected.value : 'add')}
            options={[
              { value: 'add', label: 'Add Balance' },
              { value: 'remove', label: 'Remove Balance' }
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
            }}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all dark:text-white"
            rows="3"
            placeholder="E.g., Correction for overpayment"
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

// ─── Quick Adjust Modal (three-dot row action — user pre-set) ─────────────────
const QuickAdjustModal = ({ user, onClose, onUpdate }) => {
  const [action, setAction] = useState('add');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Amount is required');
      return;
    }
    setSaving(true);
    try {
      const res = await apiCall('/api/admin/transactions/adjust-balance', 'POST', {
        username: user.username,
        action,
        amount: Number(amount),
        remark
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Balance adjusted successfully');
        onUpdate();
        onClose();
      } else {
        toast.error(data.message || 'Failed to adjust balance');
      }
    } catch (err) {
      toast.error('Error adjusting balance');
    } finally {
      setSaving(false);
    }
  };

  const formId = 'quick-adjust-form';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Adjust Wallet Balance"
      icon={WalletIcon}
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form={formId}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Adjust Balance'}
        </button>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Locked user display */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">@{user.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.user_type}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
          <SelectField
            value={{ value: action, label: action === 'add' ? 'Add Balance' : 'Remove Balance' }}
            onChange={(selected) => setAction(selected ? selected.value : 'add')}
            options={[
              { value: 'add', label: 'Add Balance' },
              { value: 'remove', label: 'Remove Balance' }
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
            }}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all dark:text-white"
            rows="3"
            placeholder="E.g., Correction for overpayment"
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

// ─── View Details Modal ───────────────────────────────────────────────────────
const ViewDetailsModal = ({ transactionId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiCall(`/api/admin/transactions/details/${transactionId}`, 'GET');
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
  }, [transactionId, onClose]);

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Transaction Details" icon={FileText} size="2xl">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading details...</p>
        </div>
      </Modal>
    );
  }

  if (!details) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Transaction Details" icon={FileText} size="3xl" contentClassName="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b dark:border-gray-700">
        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 ${details.type === 'cr' ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'}`}>
          {details.type === 'cr' ? <ArrowDownRight size={22} className="text-white" /> : <ArrowUpRight size={22} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold truncate ${details.type === 'cr' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {details.type === 'cr' ? '+' : '-'}{formatAmount(details.amount)}
          </h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 break-all">TXN ID: {details.transaction_id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
              <span className="capitalize">{details.status || 'Paid'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">
              <span className="capitalize">{details.purpose}</span>
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <User className="text-violet-500" size={15} /> User Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoItem icon={User} label="Username" value={`@${details.username}`} />
          <InfoItem icon={Hash} label="User Type" value={details.user_type} />
        </div>
      </div>

      {/* Transaction Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <WalletIcon className="text-violet-500" size={15} /> Ledger Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoItem icon={Clock} label="Date" value={formatDate(details.create_date)} />
          {details.order_id && (
            <InfoItem icon={Hash} label="Order ID" value={details.order_id} mono />
          )}
          <InfoItem icon={WalletIcon} label="Old Balance" value={details.old_balance !== null ? formatAmount(details.old_balance) : '—'} />
          <InfoItem icon={WalletIcon} label="New Balance" value={details.new_balance !== null ? formatAmount(details.new_balance) : '—'} />
          <div className="col-span-1 sm:col-span-2">
            <InfoItem icon={AlertCircle} label="Remark" value={details.remark || '—'} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Wallet() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [ledgerStats, setLedgerStats] = useState({ closing_balance: 0, total_credit: 0, total_debit: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [typeFilter, setTypeFilter] = useState(null);
  const [purposeFilter, setPurposeFilter] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isQuickAdjustModalOpen, setIsQuickAdjustModalOpen] = useState(false);
  const [adjustForUser, setAdjustForUser] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  const typeOptions = [
    { value: 'cr', label: 'Credit (In)' },
    { value: 'dr', label: 'Debit (Out)' },
  ];

  const purposeOptions = [
    { value: 'wallet', label: 'Wallet' },
    { value: 'order', label: 'Order' },
    { value: 'fee', label: 'Fee' },
    { value: 'commission', label: 'Commission' },
    { value: 'withdrawal', label: 'Withdrawal' },
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
    if (typeFilter) params.append('type', typeFilter);
    if (purposeFilter) params.append('purpose', purposeFilter);
    if (userTypeFilter) params.append('user_type', userTypeFilter);

    // Date filter
    if (dateFilter) {
      if (dateFilter.date) {
        params.append('start_date', dateFilter.date);
        params.append('end_date', dateFilter.date);
      } else if (dateFilter.from_date && dateFilter.to_date) {
        params.append('start_date', dateFilter.from_date);
        params.append('end_date', dateFilter.to_date);
      }
    }

    return params.toString();
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchLedger = async ({ force = false } = {}) => {
    const queryString = buildQueryParams();
    const requestKey = queryString;

    if (activeFetchRef.current === requestKey) { setRefreshing(false); return; }
    if (!force && lastFetchRef.current === requestKey) return;

    lastFetchRef.current = requestKey;
    activeFetchRef.current = requestKey;
    setLoading(true);

    try {
      const response = await apiCall(
        `/api/admin/transactions/ledger?${queryString}`,
        'GET'
      );
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions || []);
        setTotalItems(data.data.pagination?.total || 0);
        setLedgerStats({
          closing_balance: data.data.closing_balance || 0,
          total_credit: data.data.total_credit || 0,
          total_debit: data.data.total_debit || 0
        });
      } else {
        toast.error('Failed to fetch ledger.');
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
    fetchLedger();
  }, [currentPage, searchTerm, typeFilter, purposeFilter, userTypeFilter, dateFilter, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLedger({ force: true });
  };

  const handleView = (transaction) => {
    setSelectedTransactionId(transaction.transaction_id);
    setIsViewModalOpen(true);
  };

  const handleAdjustForUser = (row) => {
    setAdjustForUser({ username: row.username, user_type: row.user_type });
    setIsQuickAdjustModalOpen(true);
  };

  const clearAllFilters = () => {
    setTypeFilter(null);
    setPurposeFilter(null);
    setUserTypeFilter(null);
    setDateFilter(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = typeFilter || purposeFilter || userTypeFilter || dateFilter || searchTerm;

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'transaction_id',
      label: 'TXN ID',
      render: (row) => (
        <div className="flex items-center truncate max-w-[150px] gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 ${row.type === 'cr' ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'}`}>
            {row.type === 'cr' ? <ArrowDownRight size={13} className="text-white" /> : <ArrowUpRight size={13} className="text-white" />}
          </div>
          <div>
            <p className="font-mono font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.transaction_id}</p>
            <p className="text-[10px] text-gray-500 capitalize">{row.purpose}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div className="flex items-center truncate max-w-[150px] gap-2">
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap font-medium">{row.full_name}</p>
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
        <span className={`text-sm font-bold whitespace-nowrap ${row.type === 'cr' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {row.type === 'cr' ? '+' : '-'}{formatAmount(row.amount)}
        </span>
      ),
    },
    {
      key: 'remark',
      label: 'Remark',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[200px]" title={row.remark}>
          {row.remark || '—'}
        </span>
      ),
    },
    {
      key: 'create_date',
      label: 'Date',
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
      title="Wallet Ledger"
      description="View and manage user transactions and balances."
      accent="violet"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium shadow-md shadow-violet-500/20"
        >
          <WalletIcon size={16} />
          <span className="hidden md:inline"> Adjust Balance</span>
        </button>
      }
    >
      <div className="space-y-4 mt-2">
        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <WalletIcon className="text-violet-600 dark:text-violet-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Filtered Balance</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatAmount(ledgerStats.closing_balance)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <ArrowDownRight className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Credit</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(ledgerStats.total_credit)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <ArrowUpRight className="text-rose-600 dark:text-rose-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Debit</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatAmount(ledgerStats.total_debit)}</p>
              </div>
            </div>
          </div>
        )}

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
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
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
            <div className="flex-1 min-w-[120px] max-w-[160px] lg:max-w-none">
              <FilterSelect
                options={typeOptions}
                value={typeFilter}
                onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
                placeholder="All Types"
                icon={Filter}
              />
            </div>
            <div className="flex-1 min-w-[120px] max-w-[160px] lg:max-w-none">
              <FilterSelect
                options={purposeOptions}
                value={purposeFilter}
                onChange={(val) => { setPurposeFilter(val); setCurrentPage(1); }}
                placeholder="All Purposes"
                icon={Filter}
              />
            </div>
            <div className="flex-1 min-w-[120px] max-w-[160px] lg:max-w-none">
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
        {loading && <PageContentSkeleton rows={6} columns={5} />}

        {/* Empty State */}
        {!loading && transactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50"
          >
            <WalletIcon className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No transactions found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'No transactions recorded yet'}
            </p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && transactions.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50"
            >
              <ManagementTable
                columns={columns}
                rows={transactions}
                rowKey="transaction_id"
                onRowClick={(row) => handleView(row)}
                getActions={(row) => [
                  {
                    label: 'View Details',
                    icon: <Eye size={12} />,
                    onClick: () => handleView(row),
                    className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300'
                  },
                  {
                    label: 'Adjust Balance',
                    icon: <WalletIcon size={12} />,
                    onClick: () => handleAdjustForUser(row),
                    className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:hover:text-emerald-300'
                  }
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

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedTransactionId && (
          <ViewDetailsModal
            transactionId={selectedTransactionId}
            onClose={() => { setIsViewModalOpen(false); setSelectedTransactionId(null); }}
          />
        )}
      </AnimatePresence>

      {/* Adjust Balance Modal (header button) */}
      <AnimatePresence>
        {isAdjustModalOpen && (
          <AdjustBalanceModal
            onClose={() => setIsAdjustModalOpen(false)}
            onUpdate={handleRefresh}
          />
        )}
      </AnimatePresence>

      {/* Quick Adjust Modal (three-dot row action) */}
      <AnimatePresence>
        {isQuickAdjustModalOpen && adjustForUser && (
          <QuickAdjustModal
            user={adjustForUser}
            onClose={() => { setIsQuickAdjustModalOpen(false); setAdjustForUser(null); }}
            onUpdate={handleRefresh}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
