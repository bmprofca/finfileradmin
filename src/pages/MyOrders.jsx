import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Briefcase, Hash, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import apiCall from '../utils/apiCall';
import { useAuth } from '../contexts/AuthContext';
import { PageContentSkeleton } from '../components/SkeletonComponent';

const STATUS_COLORS = {
  'created': { pill: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500 dark:bg-blue-400' },
  'in process': { pill: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500 dark:bg-amber-400' },
  'pending from department': { pill: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-500 dark:bg-orange-400' },
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

const OrderCard = ({ order, index }) => (
  <ManagementCard
    delay={index * 0.05}
    accent="indigo"
    eyebrow={`Date: ${new Date(order.create_date).toLocaleDateString()}`}
    title={order.name}
    subtitle={order.service_name}
    icon={
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        <Briefcase size={20} />
      </div>
    }
    badge={<StatusBadge status={order.status} />}
    menuId={`myorder-card-${order.order_id}`}
    footer={
      <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><Hash size={10} className="text-indigo-400 dark:text-indigo-500" /> {order.order_id}</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">₹{order.fees}</span>
      </div>
    }
  >
    <div className="mt-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <User size={10} className="text-gray-400 dark:text-gray-500" /> Client: {order.client_username}
      </p>
    </div>
  </ManagementCard>
);

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const itemsPerPage = 10;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // If the user is a staff member, the backend automatically filters their orders.
      // If the user is an admin, passing their own username ensures they see orders assigned to them, or we can use the staff_username filter we added earlier.
      // Actually, if they want "my orders", we use staff_username=their_username just to be safe if they are an admin.
      const usernameParam = user?.username ? `staff_username=${user.username}&` : '';
      const response = await apiCall(`/api/admin/orders/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
        setTotalOrders(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, currentPage, searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'name', label: 'Order Name' },
    { key: 'service_name', label: 'Service Name' },
    { key: 'client_username', label: 'Client Username' },
    { key: 'fees', label: 'Fees', render: (row) => `₹${row.fees}` },
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
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-gray-950/30"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search your orders..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px]"
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

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="indigo" />
            </div>
          </motion.div>

          {/* Empty state */}
          {!loading && orders.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50">
              <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
              <p className="text-xl text-gray-500 dark:text-gray-400">No orders found</p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">{searchTerm ? 'Try adjusting your search' : 'You do not have any assigned orders yet'}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <PageContentSkeleton viewMode={viewMode} rows={6} columns={5} />
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
                    accent="indigo"
                  />
                )}

                {/* Card View */}
                {viewMode === 'card' && (
                  <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                    <AnimatePresence>
                      {orders.map((order, index) => (
                        <OrderCard key={order.order_id} order={order} index={index} />
                      ))}
                    </AnimatePresence>
                  </ManagementGrid>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
                <PaginationComponent
                  currentPage={currentPage}
                  totalItems={totalOrders}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>
    </ManagementHub>
  );
}
