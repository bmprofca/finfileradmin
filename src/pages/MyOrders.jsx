import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Briefcase, FileText, Download
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import apiCall from '../utils/apiCall';
import { useAuth } from '../contexts/AuthContext';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  'created': { pill: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500 dark:bg-blue-400' },
  'in process': { pill: 'bg-amber-50 whitespace-nowrap text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500 dark:bg-amber-400' },
  'pending from department': { pill: 'bg-orange-50 whitespace-nowrap text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-500 dark:bg-orange-400' },
  'completed': { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  'cancelled': { pill: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800', dot: 'bg-red-500 dark:bg-red-400' },
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || '').toString().toLowerCase();
  const config = STATUS_COLORS[normalizedStatus] || { pill: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', dot: 'bg-slate-400 dark:bg-gray-500' };

  // Capitalize first letter of each word for display
  const displayStatus = normalizedStatus.replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {displayStatus || 'Unknown'}
    </span>
  );
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const getPaymentState = (order) => {
  const fees = Number(order?.fees) || 0;
  const totalPaid = Number(order?.total_paid) || 0;
  const dueAmount = Number(order?.due_amount) || Math.max(fees - totalPaid, 0);

  if (dueAmount <= 0 && fees > 0) return 'paid';
  if (dueAmount > 0) return 'due';
  return 'unpaid';
};

const getPaymentHighlightClass = (order) => {
  const paymentState = getPaymentState(order);

  if (paymentState === 'paid') {
    return 'bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30';
  }

  if (paymentState === 'due') {
    return 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';
  }

  return '';
};


const PaymentText = ({ order }) => {
  const paymentState = getPaymentState(order);
  const isPaid = paymentState === 'paid';

  return (
    <span className={`whitespace-nowrap text-xs font-semibold ${isPaid
      ? 'text-emerald-700 dark:text-emerald-300'
      : 'text-amber-700 dark:text-amber-300'
      }`}>
      {isPaid ? 'Paid' : `Due ${formatCurrency(order.due_amount)}`}
    </span>
  );
};

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  const fetchOrders = async ({ force = false } = {}) => {
    const queryString = `page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
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
      const response = await apiCall(`/api/admin/orders/list?${queryString}`, 'GET');
      const data = await response.json();
      if (data.success) {
        const mappedOrders = data.data.orders.map(order => ({
          ...order,
          name: order.order_name,
          payments: order.payments || [],
          assigned_staff: order.assigned_staff || [],
          documents: order.documents || [],
          base_price: Number(order.base_price),
          tax_rate: Number(order.tax_rate),
          tax_value: Number(order.tax_value),
          total_fees: Number(order.total_fees),
          discount_percentage: Number(order.discount_percentage),
          discount_value: Number(order.discount_value),
          fees: Number(order.fees),
          total_paid: Number(order.total_paid),
          due_amount: Number(order.due_amount),
        }));
        setOrders(mappedOrders);
        setTotalOrders(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) {
        activeFetchRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders({ force: true });
  };

  const openDocumentsPage = (order) => {
    navigate('/documents', {
      state: {
        documents: order.documents || [],
        title: `Documents - ${order.name || order.order_id}`,
        subtitle: `${order.service_name || 'Order'} · ${order.client_name || order.client_username || ''}`,
        type: 'order',
        id: order.order_id,
      },
    });
  };

  const handleDownloadStatement = async (order) => {
    let toastId;
    try {
      toastId = toast.loading('Generating statement...');
      const res = await apiCall(`/api/admin/orders/download-payments/${order.order_id}`, 'GET');
      const data = await res.json();
      if (data.success && data.data?.url) {
        const fileRes = await fetch(data.data.url);
        const blob = await fileRes.blob();
        const objectUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = data.data.filename || 'statement.pdf';
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        toast.dismiss(toastId);
      } else {
        toast.error(data.message || 'Failed to download statement', { id: toastId });
      }
    } catch (err) {
      console.error('Error downloading statement', err);
      toast.error('An error occurred while downloading', { id: toastId });
    }
  };

  const getActions = (order) => [
    {
      label: 'Documents',
      icon: <FileText size={12} />,
      onClick: () => openDocumentsPage(order),
      className: 'text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40',
    },
    {
      label: 'Download Statement',
      icon: <Download size={12} />,
      onClick: () => handleDownloadStatement(order),
      className: 'text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:text-teal-200 dark:hover:bg-teal-950/40',
    },
  ];

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'name', label: 'Order Name' },
    { key: 'service_name', label: 'Service Name' },
    { key: 'client', label: 'Client', render: (row) => row.client_name || row.client_username },
    { key: 'fees', label: 'Fees', render: (row) => formatCurrency(row.fees) },
    { key: 'payment', label: 'Payment', render: (row) => <PaymentText order={row} /> },
    {
      key: 'documents',
      label: 'Documents',
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openDocumentsPage(row);
          }}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
        >
          <FileText size={14} /> Documents
        </button>
      )
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'create_date', label: 'Date', render: (row) => new Date(row.create_date).toLocaleDateString() },
  ];

  return (
    <ManagementHub
      title="My Orders"
      description="View and manage all orders assigned to you."
      accent="indigo"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-gray-950/30"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search your orders..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px]"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{totalOrders}</span> orders
              </p>
            </div>

          </motion.div>

          {/* Empty state */}
          {!loading && orders.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50">
              <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
              <p className="text-xl text-gray-500 dark:text-gray-400">No orders found</p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">{searchTerm ? 'Try adjusting your search' : 'You do not have any assigned orders yet'}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <PageContentSkeleton rows={6} columns={5} />
          )}

          {/* Content */}
          {!loading && orders.length > 0 && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

                <ManagementTable
                  columns={columns}
                  rows={orders}
                  rowKey="order_id"
                  accent="indigo"
                  getActions={getActions}
                  rowClassName={(row) => getPaymentHighlightClass(row)}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
                <PaginationComponent
                  currentPage={currentPage}
                  totalItems={totalOrders}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onLimitChange={handleLimitChange}
                  availableLimits={[10, 20, 50, 100]}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>
    </ManagementHub>
  );
}
