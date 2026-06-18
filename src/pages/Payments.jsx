import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, User, CreditCard,
  CheckCircle, XCircle, Clock, AlertCircle,
  RefreshCw, IndianRupee, Hash, Calendar, Layers
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

const formatAmount = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

// ─── Status Badges ────────────────────────────────────────────────────────────

const ORDER_STATUS_MAP = {
  'created':                 { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',   icon: Clock,         label: 'Created' },
  'in process':              { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700', icon: RefreshCw,    label: 'In Process' },
  'pending from department': { color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700', icon: AlertCircle, label: 'Dept. Pending' },
  'completed':               { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700', icon: CheckCircle, label: 'Completed' },
  'cancelled':               { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', icon: XCircle,       label: 'Cancelled' },
};

const PAYMENT_STATUS_MAP = {
  'paid':    { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700', icon: CheckCircle, label: 'Paid' },
  'created': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',   icon: Clock,       label: 'Pending' },
  'failed':  { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',   icon: XCircle,     label: 'Failed' },
};

const OrderStatusBadge = ({ status }) => {
  const cfg = ORDER_STATUS_MAP[status?.toLowerCase()] || ORDER_STATUS_MAP['created'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
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
      <Icon size={14} className="dark:text-gray-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className={`text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</div>
    </div>
  </div>
);

// ─── Partial Payments Table inside modal ─────────────────────────────────────

const PartialPaymentsTable = ({ payments }) => {
  if (!payments?.length) return (
    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No payment attempts yet.</p>
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400">
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Amount</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Gateway</th>
            <th className="px-3 py-2 text-left font-semibold">UTR / Payment ID</th>
            <th className="px-3 py-2 text-left font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {payments.map((p) => (
            <tr key={p.payment_id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.partial_payment_no}</td>
              <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100">{formatAmount(p.amount)}</td>
              <td className="px-3 py-2"><PaymentStatusBadge status={p.status} /></td>
              <td className="px-3 py-2 capitalize text-gray-600 dark:text-gray-300">{p.gateway}</td>
              <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400 break-all">{p.utr || p.payment_id || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDate(p.create_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── View Order Modal ─────────────────────────────────────────────────────────

const ViewOrderModal = ({ order, onClose }) => {
  const paidPct = order.actual_price > 0 ? Math.round((order.total_paid / order.actual_price) * 100) : 0;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Order Details"
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{order.order_name}</h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 break-all">{order.order_id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.order_status} />
            {order.partial_payment_allowed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700">
                <Layers size={9} /> Partial Allowed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Amount Summary */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <IndianRupee className="text-emerald-500" size={15} /> Payment Summary
        </h4>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Order Value', value: formatAmount(order.actual_price), color: 'text-gray-800 dark:text-gray-100' },
            { label: 'Total Paid', value: formatAmount(order.total_paid), color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Due Amount', value: formatAmount(order.due_amount), color: order.due_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</div>
              <div className={`text-base font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-right">{paidPct}% paid</p>
      </div>

      {/* Client & Order Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <User className="text-emerald-500" size={15} /> Client & Order Info
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoItem icon={User} label="Client Name" value={order.client_name} />
          <InfoItem icon={Hash} label="Username" value={`@${order.username}`} mono />
          <InfoItem icon={Hash} label="Order ID" value={order.order_id} mono />
          <InfoItem icon={Calendar} label="Created On" value={formatDate(order.create_date)} />
        </div>
      </div>

      {/* Payment Attempts */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <CreditCard className="text-emerald-500" size={15} /> Payment Attempts ({order.partial_payments_count})
        </h4>
        <PartialPaymentsTable payments={order.partial_payment} />
      </div>
    </Modal>
  );
};

// ─── Order Card (Card View) ───────────────────────────────────────────────────

const OrderManagementCard = ({ order, index, onView }) => {
  const paidPct = order.actual_price > 0 ? Math.round((order.total_paid / order.actual_price) * 100) : 0;
  return (
    <ManagementCard
      key={order.order_id}
      delay={index * 0.05}
      accent="emerald"
      eyebrow={order.client_name}
      title={order.order_name}
      subtitle={formatDate(order.create_date)}
      icon={
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <CreditCard size={14} className="text-white" />
        </div>
      }
      badge={<OrderStatusBadge status={order.order_status} />}
      onClick={() => onView(order)}
      hoverable
      actions={[
        { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(order), className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 dark:text-emerald-400' },
      ]}
      menuId={`order-card-${order.order_id}`}
    >
      <div className="mt-2 space-y-2">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatAmount(order.total_paid)} paid</span>
          <span className={order.due_amount > 0 ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400'}>
            {order.due_amount > 0 ? `${formatAmount(order.due_amount)} due` : 'Fully paid'}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono break-all">{order.order_id}</p>
      </div>
    </ManagementCard>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Payments() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [orders, setOrders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const itemsPerPage = 20;
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchOrders = async ({ force = false } = {}) => {
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
        setOrders(data.data.orders);
        setTotalItems(data.data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch orders.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  };

  useEffect(() => { fetchOrders(); }, [currentPage, searchTerm]);

  const handleRefresh = () => { setRefreshing(true); fetchOrders({ force: true }); };
  const handleView = (order) => { setSelectedOrder(order); setIsViewModalOpen(true); };

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
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{row.order_id.slice(0, 12)}…</p>
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
      key: 'actual_price',
      label: 'Order Value',
      render: (row) => <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{formatAmount(row.actual_price)}</span>,
    },
    {
      key: 'total_paid',
      label: 'Paid',
      render: (row) => <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatAmount(row.total_paid)}</span>,
    },
    {
      key: 'due_amount',
      label: 'Due',
      render: (row) => (
        <span className={`text-sm font-semibold whitespace-nowrap ${row.due_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {row.due_amount > 0 ? formatAmount(row.due_amount) : '—'}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => {
        const pct = row.actual_price > 0 ? Math.round((row.total_paid / row.actual_price) * 100) : 0;
        return (
          <div className="w-24">
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (row) => <OrderStatusBadge status={row.order_status} />,
    },
    {
      key: 'partial_payments_count',
      label: 'Payments',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {row.partial_payments_count} attempt{row.partial_payments_count !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'create_date',
      label: 'Created',
      render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(row.create_date)}</span>,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Payments"
      description="Track orders, payment status, and transaction history."
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
                placeholder="Search by order name, client, or ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> order{totalItems !== 1 ? 's' : ''}
              {searchTerm && <span className="ml-1 text-emerald-600 dark:text-emerald-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="emerald" />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={6} columns={7} />}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50">
            <CreditCard className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No orders found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No payment orders yet'}
            </p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && orders.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={orders}
                  rowKey="order_id"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:hover:text-emerald-300' },
                  ]}
                  accent="emerald"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {orders.map((order, index) => (
                      <OrderManagementCard
                        key={order.order_id}
                        order={order}
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

      {/* View Order Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedOrder && (
          <ViewOrderModal
            order={selectedOrder}
            onClose={() => { setIsViewModalOpen(false); setSelectedOrder(null); }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}