// components/client/OrdersTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, Eye, RefreshCw, User,
  Calendar, Briefcase, Clock, X, FileText, Download
} from 'lucide-react';
import apiCall from '../../utils/apiCall';
import { formatDate } from '../../utils/helpers';
import { PageContentSkeleton } from '../../components/SkeletonComponent';
import ManagementTable from '../../components/common/ManagementTable';
import ManagementGrid from '../../components/common/ManagementGrid';
import ManagementCard from '../../components/common/ManagementCard';
import ManagementViewSwitcher from '../../components/common/ManagementViewSwitcher';
import PaginationComponent from '../../components/common/PaginationComponent';
import Modal from '../../components/common/Modal';
import AdvancedDateFilter from '../../components/common/AdvancedDateFilter';
import SelectField from '../../components/common/SelectField';
import { ConstantOptions } from '../../contexts/ConstantOptionsContext';
import toast from 'react-hot-toast';

// Order Status Map
const STATUS_COLORS = {
  'created': { pill: 'bg-blue-100 text-blue-800 border border-blue-200', dot: 'bg-blue-500' },
  'in process': { pill: 'bg-amber-100 text-amber-800 border border-amber-200', dot: 'bg-amber-500' },
  'pending from department': { pill: 'bg-orange-100 text-orange-800 border border-orange-200', dot: 'bg-orange-500' },
  'completed': { pill: 'bg-green-100 text-green-800 border border-green-200', dot: 'bg-green-500' },
  'cancelled': { pill: 'bg-red-100 text-red-800 border border-red-200', dot: 'bg-red-500' },
};

const OrderStatusBadge = ({ status }) => {
  const normalizedStatus = (status || '').toString().toLowerCase();
  const config = STATUS_COLORS[normalizedStatus] || {
    pill: 'bg-gray-100 text-gray-700 border border-gray-200',
    dot: 'bg-gray-400'
  };
  const displayStatus = normalizedStatus.replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {displayStatus || 'Unknown'}
    </span>
  );
};


export default function OrdersTab({ username, refreshTrigger }) {
  const { orderStatusOptions } = ConstantOptions();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState({ date: new Date().toLocaleDateString('en-CA') });

  // Order details modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  useEffect(() => {
    fetchOrders();
  }, [username, currentPage, statusFilter, dateFilter, refreshTrigger, itemsPerPage]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('resource', 'orders');
    params.append('page_no', currentPage);
    params.append('limit', itemsPerPage);

    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter) params.append('status', statusFilter);

    // Date filter
    if (dateFilter) {
      if (dateFilter.date) {
        params.append('date', dateFilter.date);
      } else if (dateFilter.month && dateFilter.year) {
        params.append('month', dateFilter.month);
        params.append('year', dateFilter.year);
      } else if (dateFilter.from_date && dateFilter.to_date) {
        params.append('from_date', dateFilter.from_date);
        params.append('to_date', dateFilter.to_date);
      }
    }

    return params.toString();
  };

  const activeFetchRef = useRef(null);

  const fetchOrders = async () => {
    const queryString = buildQueryParams();
    const requestKey = queryString + '&refresh=' + (refreshTrigger || 0);

    if (activeFetchRef.current === requestKey) {
      setRefreshing(false);
      return;
    }
    activeFetchRef.current = requestKey;

    setLoading(true);
    try {
      const res = await apiCall(
        `/api/admin/clients/profile/${username}?${queryString}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setTotalOrders(data.data.pagination?.total_records || data.data.orders.length);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) {
        activeFetchRef.current = null;
      }
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setLoadingOrder(true);
    try {
      const res = await apiCall(
        `/api/admin/clients/profile/${username}?resource=order&order_id=${orderId}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setOrderModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoadingOrder(false);
    }
  };



  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDocuments = (order) => {
    navigate('/documents', {
      state: {
        documents: order.documents || [],
        title: `Documents - ${order.name || order.order_name || order.order_id}`,
        subtitle: `Client ${username}`,
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

  const getActions = (row) => [
    {
      label: 'View Details',
      icon: <Eye size={12} />,
      onClick: () => fetchOrderDetails(row.order_id),
      className: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40',
    },
    {
      label: 'Documents',
      icon: <FileText size={12} />,
      onClick: () => handleViewDocuments(row),
      className: 'text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40',
    },
    {
      label: 'Download Statement',
      icon: <Download size={12} />,
      onClick: () => handleDownloadStatement(row),
      className: 'text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:text-teal-200 dark:hover:bg-teal-950/40',
    }
  ];

  const getRowHighlightClass = (order) => {
    const hasAssignedStaff = order.assigned_staffs && order.assigned_staffs.length > 0;
    return hasAssignedStaff
      ? 'bg-blue-50/40 hover:bg-blue-100/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'
      : 'bg-yellow-50/60 hover:bg-yellow-100/70 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20';
  };

  const getCardHighlightClass = (order) => {
    const hasAssignedStaff = order.assigned_staffs && order.assigned_staffs.length > 0;
    return hasAssignedStaff
      ? 'border-blue-200 bg-blue-50/30 shadow-blue-100/50 dark:border-blue-800/50 dark:bg-blue-900/20'
      : 'border-yellow-300 bg-yellow-50/50 shadow-yellow-100/50 dark:border-yellow-700/50 dark:bg-yellow-900/20';
  };

  const hasActiveFilters = statusFilter || dateFilter;

  const clearAllFilters = () => {
    setStatusFilter(null);
    setDateFilter(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) return <PageContentSkeleton viewMode={viewMode} rows={6} columns={5} />;

  const columns = [
    {
      key: 'order_id',
      label: 'Order ID',
      render: (row) => <span className="font-mono text-xs">{row.order_id}</span>
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>
    },
    {
      key: 'service_id',
      label: 'Service',
      render: (row) => row.service_id || '—'
    },
    {
      key: 'fees',
      label: 'Fees',
      render: (row) => <span className="font-semibold">₹{row.fees}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />
    },
    {
      key: 'documents',
      label: 'Docs',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleViewDocuments(row); }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/50"
        >
          <FileText size={12} /> {row.documents?.length || 0}
        </button>
      )
    },
    {
      key: 'create_date',
      label: 'Created',
      render: (row) => formatDate(row.create_date)
    }
  ];

  const OrderCard = ({ order }) => (
    <ManagementCard
      className={getCardHighlightClass(order)}
      delay={0}
      accent="emerald"
      eyebrow={`Order: ${order.order_id}`}
      title={order.name}
      subtitle={`Service: ${order.service_id || '—'}`}
      icon={
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          <Briefcase size={20} />
        </div>
      }
      badge={<OrderStatusBadge status={order.status} />}
      onClick={() => fetchOrderDetails(order.order_id)}
      hoverable
      menuId={`order-card-${order.order_id}`}
      actions={getActions(order)}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar size={10} className="text-emerald-400" /> {formatDate(order.create_date)}
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">₹{order.fees}</span>
        </div>
      }
    />
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">

        {/* Search */}
        <div className="relative flex-1 w-full shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex-1 min-w-[130px] lg:w-[150px] max-w-[180px]">
            <SelectField
              options={orderStatusOptions}
              value={orderStatusOptions.find(o => o.value === statusFilter) || null}
              onChange={(selected) => { setStatusFilter(selected ? selected.value : null); setCurrentPage(1); }}
              placeholder="Status"
              isClearable
            />
          </div>

          {/* Date Filter */}
          <div className="flex-1 min-w-[160px] lg:w-[220px] max-w-[220px]">
            <AdvancedDateFilter
              value={dateFilter}
              onChange={(val) => { setDateFilter(val); setCurrentPage(1); }}
              placeholder="Select Date"
              tabOptions={['date', 'month', 'range']}
              showDateStepper
              buttonClassName="h-full min-h-[36px] w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-100 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors whitespace-nowrap"
              >
                <X size={12} /> Clear
              </button>
            )}
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="emerald" />
          </div>
        </div>
      </div>

      {orders?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ShoppingBag className="text-gray-300 dark:text-gray-600 mx-auto mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No orders found</p>
          {(searchTerm || hasActiveFilters) && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <ManagementTable columns={columns} rows={orders || []} rowKey="order_id" accent="emerald" getActions={getActions} onRowClick={(row) => fetchOrderDetails(row.order_id)} rowClassName={getRowHighlightClass} />
            </div>
          ) : (
            <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <AnimatePresence>
                {orders.map((order) => (
                  <OrderCard key={order.order_id} order={order} />
                ))}
              </AnimatePresence>
            </ManagementGrid>
          )}
          <PaginationComponent
            currentPage={currentPage}
            totalItems={totalOrders}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            availableLimits={[10, 20, 50, 100]}
          />
        </>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="Order Details"
        icon={ShoppingBag}
        size="xl"
      >
        {loadingOrder ? (
          <div className="py-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-emerald-500" size={32} />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading order details...</p>
          </div>
        ) : selectedOrder ? (
          <div className="space-y-4">
            {/* Order Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">{selectedOrder.order?.order_id}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <OrderStatusBadge status={selectedOrder.order?.status} />
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Fees</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">₹{selectedOrder.order?.fees}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Service</p>
                <p className="text-gray-800 dark:text-gray-100">{selectedOrder.order?.service_id || '—'}</p>
              </div>
            </div>

            {/* Assigned Staff */}
            {selectedOrder.assigned_staffs?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned Staff</h4>
                <div className="space-y-1">
                  {selectedOrder.assigned_staffs.map((staff) => (
                    <div key={staff.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <User size={14} className="text-emerald-500" />
                      <span>{staff.staff_username}</span>
                      {staff.assigned_date && (
                        <span className="text-xs text-gray-400 ml-2">Assigned: {formatDate(staff.assigned_date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Logs */}
            {selectedOrder.status_logs?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status History</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedOrder.status_logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{log.status}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(log.create_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {selectedOrder.payments?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payments</h4>
                <div className="space-y-1">
                  {selectedOrder.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-gray-500">{payment.payment_id}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">₹{payment.amount}</span>
                        <span className="capitalize text-gray-500">{payment.gateway}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {payment.status}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(payment.create_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Documents Modal */}
    </div>
  );
}
