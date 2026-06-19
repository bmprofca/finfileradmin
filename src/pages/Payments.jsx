import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, User, CreditCard,
  CheckCircle, XCircle, Clock, AlertCircle,
  RefreshCw, IndianRupee, Hash, Calendar, Layers,
  Building2, Wallet, TrendingUp, TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
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

// ─── Status Badges ────────────────────────────────────────────────────────────

const PAYMENT_STATUS_MAP = {
  'paid': { 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700', 
    icon: CheckCircle, 
    label: 'Paid' 
  },
  'created': { 
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700', 
    icon: Clock, 
    label: 'Pending' 
  },
  'failed': { 
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', 
    icon: XCircle, 
    label: 'Failed' 
  },
};

const PaymentStatusBadge = ({ status }) => {
  const cfg = PAYMENT_STATUS_MAP[status?.toLowerCase()] || PAYMENT_STATUS_MAP['created'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
};

// ─── Info Item ────────────────────────────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="text-emerald-500 dark:text-emerald-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className={`text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</div>
    </div>
  </div>
);

// ─── Payment Details Table inside modal ─────────────────────────────────────

const PaymentDetailsTable = ({ payments }) => {
  if (!payments?.length) return (
    <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
      <CreditCard className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
      No payment records found
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400">
            <th className="px-3 py-2.5 text-left font-semibold">#</th>
            <th className="px-3 py-2.5 text-left font-semibold">Payment ID</th>
            <th className="px-3 py-2.5 text-left font-semibold">Amount</th>
            <th className="px-3 py-2.5 text-left font-semibold">Status</th>
            <th className="px-3 py-2.5 text-left font-semibold">Type</th>
            <th className="px-3 py-2.5 text-left font-semibold">UTR</th>
            <th className="px-3 py-2.5 text-left font-semibold">Gateway</th>
            <th className="px-3 py-2.5 text-left font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {payments.map((p, idx) => (
            <tr key={p.id || p.payment_id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 font-medium">{idx + 1}</td>
              <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-300 text-[10px] break-all">
                {p.payment_id}
              </td>
              <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-100">
                {formatAmount(p.amount)}
              </td>
              <td className="px-3 py-2.5"><PaymentStatusBadge status={p.status} /></td>
              <td className="px-3 py-2.5">
                {p.is_partial ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700">
                    <Layers size={9} /> Partial
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
                    <CheckCircle size={9} /> Full
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 font-mono text-gray-500 dark:text-gray-400 text-[10px] break-all">
                {p.utr || '—'}
              </td>
              <td className="px-3 py-2.5 capitalize text-gray-600 dark:text-gray-300">
                {p.gateway || '—'}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-gray-400 text-[10px]">
                {formatDate(p.create_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── View Payment Modal ─────────────────────────────────────────────────────────

const ViewPaymentModal = ({ payment, onClose }) => {
  // Calculate totals from payments array if it exists
  const totalPaid = payment.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || payment.amount || 0;
  const paymentCount = payment.payments?.length || 0;
  const isPartial = payment.is_partial || paymentCount > 1;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Payment Details"
      icon={CreditCard}
      size="3xl"
      contentClassName="p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b dark:border-gray-700">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <CreditCard size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{payment.order_name}</h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 break-all">Order: {payment.order_id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <PaymentStatusBadge status={payment.status} />
            {isPartial && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700">
                <Layers size={9} /> Partial Payment
              </span>
            )}
            {payment.failure_reason && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
                <AlertCircle size={9} /> Failed: {payment.failure_reason}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Wallet className="text-emerald-500" size={15} /> Payment Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Amount</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-100">{formatAmount(payment.amount)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Total Paid</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(totalPaid)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Payments</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-100">{paymentCount} attempt{paymentCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Client & Order Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <User className="text-emerald-500" size={15} /> Client & Order Info
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoItem icon={User} label="Client Name" value={payment.client_name} />
          <InfoItem icon={Hash} label="Username" value={`@${payment.username}`} mono />
          <InfoItem icon={Hash} label="Order ID" value={payment.order_id} mono />
          <InfoItem icon={Calendar} label="Created On" value={formatDate(payment.create_date)} />
          {payment.razorpay_order_id && (
            <InfoItem icon={Hash} label="Razorpay Order ID" value={payment.razorpay_order_id} mono />
          )}
          {payment.utr && (
            <InfoItem icon={Hash} label="UTR" value={payment.utr} mono />
          )}
        </div>
      </div>

      {/* All Payments for this order */}
      {payment.payments && payment.payments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <CreditCard className="text-emerald-500" size={15} /> All Payments for this Order
          </h4>
          <PaymentDetailsTable payments={payment.payments} />
        </div>
      )}
    </Modal>
  );
};

// ─── Payment Card (Card View) ───────────────────────────────────────────────────

const PaymentCard = ({ payment, index, onView }) => {
  const isPartial = payment.is_partial || (payment.payments && payment.payments.length > 1);
  const paymentCount = payment.payments?.length || 1;

  return (
    <ManagementCard
      key={payment.id || payment.payment_id}
      delay={index * 0.05}
      accent="emerald"
      eyebrow={payment.client_name}
      title={payment.order_name}
      subtitle={formatDate(payment.create_date)}
      icon={
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <CreditCard size={14} className="text-white" />
        </div>
      }
      badge={<PaymentStatusBadge status={payment.status} />}
      onClick={() => onView(payment)}
      hoverable
      actions={[
        { 
          label: 'View Details', 
          icon: <Eye size={12} />, 
          onClick: () => onView(payment), 
          className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400' 
        },
      ]}
      menuId={`payment-card-${payment.id || payment.payment_id}`}
    >
      <div className="mt-2 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {formatAmount(payment.amount)}
          </span>
          {isPartial && (
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Layers size={10} /> {paymentCount} payments
            </span>
          )}
        </div>
        {payment.utr && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
            UTR: {payment.utr}
          </p>
        )}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
          {payment.payment_id}
        </p>
      </div>
    </ManagementCard>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Payments() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [payments, setPayments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const itemsPerPage = 20;
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchPayments = async ({ force = false } = {}) => {
    const requestKey = `${currentPage}|${itemsPerPage}|${searchTerm}`;
    if (activeFetchRef.current === requestKey) { setRefreshing(false); return; }
    if (!force && lastFetchRef.current === requestKey) return;

    lastFetchRef.current = requestKey;
    activeFetchRef.current = requestKey;
    setLoading(true);
    try {
      const response = await apiCall(
        `/api/admin/payments/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`,
        'GET'
      );
      const data = await response.json();
      if (data.success) {
        // Map API response to component expectations
        const mappedPayments = data.data.payments.map(payment => ({
          ...payment,
          // Ensure all fields exist
          payments: payment.payments || [], // If API includes all payments for order
          // For backward compatibility
          order_name: payment.order_name,
          client_name: payment.client_name,
          username: payment.username,
          order_id: payment.order_id,
          amount: payment.amount,
          status: payment.status,
          is_partial: payment.is_partial,
          utr: payment.utr,
          gateway: payment.gateway,
          razorpay_order_id: payment.razorpay_order_id,
          failure_reason: payment.failure_reason,
          create_date: payment.create_date,
          id: payment.id,
          payment_id: payment.payment_id,
        }));
        setPayments(mappedPayments);
        setTotalItems(data.data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch payments.');
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

  useEffect(() => { 
    fetchPayments(); 
  }, [currentPage, searchTerm]);

  const handleRefresh = () => { 
    setRefreshing(true); 
    fetchPayments({ force: true }); 
  };
  
  const handleView = (payment) => { 
    // Fetch all payments for this order if not already loaded
    if (!payment.payments || payment.payments.length === 0) {
      // You might want to fetch payment details here
      // For now, just show the current payment
      setSelectedPayment(payment); 
    } else {
      setSelectedPayment(payment);
    }
    setIsViewModalOpen(true); 
  };

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'order_name',
      label: 'Order',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <CreditCard size={13} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.order_name}</p>
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{row.order_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'client_name',
      label: 'Client',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap font-medium">{row.client_name}</p>
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">@{row.username}</p>
        </div>
      ),
    },
    {
      key: 'payment_id',
      label: 'Payment ID',
      render: (row) => (
        <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all">
          {row.payment_id}
        </p>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
          {formatAmount(row.amount)}
        </span>
      ),
    },
    {
      key: 'is_partial',
      label: 'Type',
      render: (row) => (
        row.is_partial ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700">
            <Layers size={9} /> Partial
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
            <CheckCircle size={9} /> Full
          </span>
        )
      ),
    },
    {
      key: 'utr',
      label: 'UTR',
      render: (row) => (
        <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all">
          {row.utr || '—'}
        </p>
      ),
    },
    {
      key: 'gateway',
      label: 'Gateway',
      render: (row) => (
        <span className="text-xs capitalize text-gray-600 dark:text-gray-300">
          {row.gateway || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'create_date',
      label: 'Created',
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
      title="Payments"
      description="Track all payment transactions and order payments."
      accent="emerald"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search by order name, client, or payment ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
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
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> payment{totalItems !== 1 ? 's' : ''}
              {searchTerm && <span className="ml-1 text-emerald-600 dark:text-emerald-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="emerald" />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={6} columns={8} />}

        {/* Empty State */}
        {!loading && payments.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50"
          >
            <CreditCard className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No payments found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No payment records yet'}
            </p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && payments.length > 0 && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }} 
              className="rounded-xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50"
            >
              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={payments}
                  rowKey="id"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { 
                      label: 'View Details', 
                      icon: <Eye size={12} />, 
                      onClick: () => handleView(row), 
                      className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' 
                    },
                  ]}
                  accent="emerald"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {payments.map((payment, index) => (
                      <PaymentCard
                        key={payment.id || payment.payment_id}
                        payment={payment}
                        index={index}
                        onView={handleView}
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
              />
            </motion.div>
          </>
        )}
      </div>

      {/* View Payment Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedPayment && (
          <ViewPaymentModal
            payment={selectedPayment}
            onClose={() => { setIsViewModalOpen(false); setSelectedPayment(null); }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}