// components/client/PaymentsTab.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Search, Eye, RefreshCw, CheckCircle,
  XCircle, Clock, AlertCircle, Layers, Hash, Calendar,
  Building2, Wallet
} from 'lucide-react';
import apiCall from '../../utils/apiCall';
import { formatDate, formatAmount } from '../../utils/helpers';
import { PageContentSkeleton } from '../../components/SkeletonComponent';
import ManagementTable from '../../components/common/ManagementTable';
import ManagementGrid from '../../components/common/ManagementGrid';
import ManagementCard from '../../components/common/ManagementCard';
import ManagementViewSwitcher from '../../components/common/ManagementViewSwitcher';
import PaginationComponent from '../../components/common/PaginationComponent';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

// Payment Status Map
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

export default function PaymentsTab({ username }) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Payment details modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, [username, currentPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/admin/clients/profile/${username}?resource=payments&page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        setTotalPayments(data.data.pagination?.total_records || data.data.payments.length);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  if (loading) return <PageContentSkeleton viewMode={viewMode} rows={6} columns={5} />;

  const columns = [
    {
      key: 'payment_id',
      label: 'Payment ID',
      render: (row) => <span className="font-mono text-xs">{row.payment_id}</span>
    },
    {
      key: 'order_id',
      label: 'Order ID',
      render: (row) => <span className="font-mono text-xs">{row.order_id}</span>
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="font-semibold">₹{row.amount}</span>
    },
    {
      key: 'gateway',
      label: 'Gateway',
      render: (row) => <span className="capitalize">{row.gateway || '—'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <PaymentStatusBadge status={row.status} />
    },
    {
      key: 'create_date',
      label: 'Date',
      render: (row) => formatDate(row.create_date)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleViewPayment(row)}
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
        >
          <Eye size={14} /> View
        </button>
      )
    }
  ];

  const PaymentCard = ({ payment }) => (
    <ManagementCard
      delay={0}
      accent="emerald"
      eyebrow={`Payment: ${payment.payment_id}`}
      title={`Order: ${payment.order_id}`}
      subtitle={`Gateway: ${payment.gateway || '—'}`}
      icon={
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          <CreditCard size={20} />
        </div>
      }
      badge={<PaymentStatusBadge status={payment.status} />}
      onClick={() => handleViewPayment(payment)}
      hoverable
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar size={10} className="text-emerald-400" /> {formatDate(payment.create_date)}
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">₹{payment.amount}</span>
        </div>
      }
    />
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 text-sm py-2">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </Button>
          <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="emerald" />
        </div>
      </div>

      {payments?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CreditCard className="text-gray-300 dark:text-gray-600 mx-auto mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No payments found</p>
          {searchTerm && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search</p>}
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <ManagementTable columns={columns} rows={payments || []} rowKey="payment_id" accent="emerald" />
            </div>
          ) : (
            <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <AnimatePresence>
                {payments.map((payment) => (
                  <PaymentCard key={payment.payment_id} payment={payment} />
                ))}
              </AnimatePresence>
            </ManagementGrid>
          )}
          <PaginationComponent
            currentPage={currentPage}
            totalItems={totalPayments}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Payment Details Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Payment Details"
        icon={CreditCard}
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Payment ID</p>
                <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">{selectedPayment.payment_id}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="font-mono text-sm text-gray-800 dark:text-gray-100">{selectedPayment.order_id}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <PaymentStatusBadge status={selectedPayment.status} />
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">₹{selectedPayment.amount}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Gateway</p>
                <p className="capitalize text-gray-800 dark:text-gray-100">{selectedPayment.gateway || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-gray-800 dark:text-gray-100">{formatDate(selectedPayment.create_date)}</p>
              </div>
            </div>

            {selectedPayment.utr && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">UTR</p>
                <p className="font-mono text-sm text-gray-800 dark:text-gray-100">{selectedPayment.utr}</p>
              </div>
            )}

            {selectedPayment.failure_reason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Failure Reason</p>
                <p className="text-sm text-red-700 dark:text-red-300">{selectedPayment.failure_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}