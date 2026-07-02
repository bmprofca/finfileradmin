import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Briefcase, Calendar, Hash, Phone, Mail, ArrowLeft, Building2, User
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import apiCall from '../utils/apiCall';
import { PageContentSkeleton } from '../components/SkeletonComponent';

const STATUS_COLORS = {
  'created': { pill: 'bg-blue-100 text-blue-800 border border-blue-200', dot: 'bg-blue-500' },
  'in process': { pill: 'bg-amber-100 text-amber-800 border border-amber-200', dot: 'bg-amber-500' },
  'pending from department': { pill: 'bg-orange-100 text-orange-800 border border-orange-200', dot: 'bg-orange-500' },
  'completed': { pill: 'bg-green-100 text-green-800 border border-green-200', dot: 'bg-green-500' },
  'cancelled': { pill: 'bg-red-100 text-red-800 border border-red-200', dot: 'bg-red-500' },
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || '').toString().toLowerCase();
  const config = STATUS_COLORS[normalizedStatus] || { pill: 'bg-gray-100 text-gray-700 border border-gray-200', dot: 'bg-gray-400' };

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
      <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        <Briefcase size={20} />
      </div>
    }
    badge={<StatusBadge status={order.status} />}
    menuId={`order-card-${order.order_id}`}
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

export default function StaffProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  const fetchProfileAndOrders = async () => {
    setLoading(true);
    try {
      // 1. Fetch Staff Details
      const staffRes = await apiCall('/api/admin/staff/list', 'GET');
      const staffData = await staffRes.json();
      if (staffData.success) {
        const foundStaff = staffData.data.staffs.find(s => s.username === username);
        if (foundStaff) {
          setStaff(foundStaff);
        }
      }

      // 2. Fetch Orders for this Staff
      const ordersRes = await apiCall(`/api/admin/orders/list?staff_username=${username}&page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.data.orders);
        setTotalOrders(ordersData.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lastFetchRef = useRef({ username: null, page: null, search: null, limit: null });
  useEffect(() => {
    if (
      lastFetchRef.current.username === username &&
      lastFetchRef.current.page === currentPage &&
      lastFetchRef.current.search === searchTerm &&
      lastFetchRef.current.limit === itemsPerPage
    ) return;

    lastFetchRef.current = { username, page: currentPage, search: searchTerm, limit: itemsPerPage };
    fetchProfileAndOrders();
  }, [username, currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileAndOrders();
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

  if (!staff && !loading) {
    return (
      <ManagementHub title="Staff Not Found" description="The staff member you are looking for does not exist." accent="blue">
        <Button onClick={() => navigate('/staffs')} variant="primary" className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Staffs
        </Button>
      </ManagementHub>
    );
  }

  return (
    <ManagementHub
      title={staff ? `${staff.full_name}'s Profile` : 'Staff Profile'}
      description="View staff details and their assigned orders."
      accent="indigo"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button variant="outline" onClick={() => navigate('/staffs')} className="flex items-center gap-2 text-sm py-1.5">
          <ArrowLeft size={16} /> Back
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Profile Details Card */}
        {staff && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-6 rounded-sm shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                {staff.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{staff.full_name}</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <User size={14} className="text-indigo-400" /> {staff.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail size={14} className="text-indigo-400" /> {staff.email}
                  </p>
                  {staff.mobile && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Phone size={14} className="text-indigo-400" /> {staff.mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Assigned Orders</h3>
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
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50">
              <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
              <p className="text-xl text-gray-500 dark:text-gray-400">No orders found</p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">{searchTerm ? 'Try adjusting your search' : 'No orders assigned to this staff yet'}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <PageContentSkeleton viewMode={viewMode} rows={6} columns={5} />
          )}

          {/* Content */}
          {!loading && orders.length > 0 && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-sm bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

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
