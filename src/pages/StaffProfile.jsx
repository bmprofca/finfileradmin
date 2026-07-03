import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Mail, ArrowLeft, Shield, ShieldCheck, CheckCircle, Briefcase, Hash, Search, X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import RefreshButton from '../components/common/RefreshButton';
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

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-4">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600">
      <Icon size={16} className="text-gray-500 dark:text-gray-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

export default function StaffProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [staffLoading, setStaffLoading] = useState(true);
  
  const [permissionData, setPermissionData] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsFetched, setPermissionsFetched] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'permissions' or 'orders'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const staffRes = await apiCall('/api/admin/staff/list', 'GET');
      const staffData = await staffRes.json();
      if (staffData.success) {
        const foundStaff = staffData.data.staffs.find(s => s.username === username);
        if (foundStaff) {
          setStaff(foundStaff);
        }
      }
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const permRes = await apiCall(`/api/admin/permissions/staff/${username}`, 'GET');
      const permData = await permRes.json();
      if (permData.success) {
        setPermissionData(permData.data);
      }
    } catch (error) {
      console.error('Failed to fetch permissions', error);
    } finally {
      setPermissionsLoading(false);
      setPermissionsFetched(true);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const ordersRes = await apiCall(`/api/admin/orders/list?staff_username=${username}&page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.data.orders);
        setTotalOrders(ordersData.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch staff always
  const lastStaffFetchRef = useRef({ username: null });
  useEffect(() => {
    if (lastStaffFetchRef.current.username === username) return;
    lastStaffFetchRef.current = { username };
    fetchStaff();
  }, [username]);

  // Fetch permissions lazily
  useEffect(() => {
    if (activeTab === 'permissions' && !permissionsFetched && !permissionsLoading && username) {
      fetchPermissions();
    }
  }, [activeTab, permissionsFetched, username]);

  // Fetch orders lazily
  const lastOrderFetchRef = useRef({ username: null, page: null, search: null, limit: null });
  useEffect(() => {
    if (activeTab !== 'orders') return;

    if (
      lastOrderFetchRef.current.username === username &&
      lastOrderFetchRef.current.page === currentPage &&
      lastOrderFetchRef.current.search === searchTerm &&
      lastOrderFetchRef.current.limit === itemsPerPage
    ) return;

    lastOrderFetchRef.current = { username, page: currentPage, search: searchTerm, limit: itemsPerPage };
    fetchOrders();
  }, [activeTab, username, currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
    if (activeTab === 'permissions') await fetchPermissions();
    if (activeTab === 'orders') await fetchOrders();
    setRefreshing(false);
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

  if (!staff && !staffLoading) {
    return (
      <ManagementHub title="Staff Not Found" description="The staff member you are looking for does not exist." accent="blue">
        <Button onClick={() => navigate('/staffs')} variant="primary" className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Staffs
        </Button>
      </ManagementHub>
    );
  }

  return (
    <ManagementHub accent="indigo">
      <div className="space-y-6">

        {/* Profile Header */}
        {staff && (
          <motion.div 
            initial={{ opacity: 0, y: -14 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }} 
            className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-4 shadow-sm backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              {staff.image ? (
                <img src={staff.image} alt={staff.full_name} className="w-16 h-16 rounded-xl object-cover shadow-md shrink-0 border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                  {staff.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{staff.full_name}</h2>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${staff.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                    {staff.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <User size={14} className="text-indigo-400" /> @{staff.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Mail size={14} className="text-indigo-400" /> {staff.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <RefreshButton
                type="button"
                loading={refreshing}
                onClick={handleRefresh}
                title="Refresh"
              >
                Refresh
              </RefreshButton>
              <Button variant="outline" onClick={() => navigate('/staffs')} className="flex items-center gap-2 text-sm py-1.5">
                <ArrowLeft size={16} /> Back
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tabs Bar */}
        {!staffLoading && (
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'permissions' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              <Shield size={16} />
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              <Briefcase size={16} />
              Assigned Orders
            </button>
          </div>
        )}

        {/* Loading State */}
        {staffLoading && (
          <PageContentSkeleton rows={6} columns={2} />
        )}

        {/* Content */}
        {!staffLoading && (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && staff && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <User className="text-indigo-500" size={20} /> Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem icon={User} label="First Name" value={staff.first_name} />
                    <InfoItem icon={User} label="Middle Name" value={staff.middle_name} />
                    <InfoItem icon={User} label="Last Name" value={staff.last_name} />
                    <InfoItem icon={Mail} label="Email Address" value={staff.email} />
                    <InfoItem icon={Phone} label="Mobile Number" value={staff.mobile} />
                    <InfoItem icon={Shield} label="Permission Package" value={staff.permission_package_name || staff.permission_package_id || 'None'} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'permissions' && (
              <motion.div
                key="permissions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Package Details */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-800">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {permissionData?.permission_package?.name || 'No Package Assigned'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {permissionData?.permission_package?.remark || 'This staff member does not have a permission package assigned.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                {permissionData?.permissions && permissionData.permissions.length > 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        Assigned Permissions ({permissionData.permissions.length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {permissionData.permissions.map((perm) => (
                        <div key={perm.permission_id} className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="mt-1 text-emerald-500 shrink-0">
                            <CheckCircle size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200">{perm.name}</h5>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                {perm.module}
                              </span>
                            </div>
                            {perm.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{perm.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <Shield className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No permissions found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This staff member has no specific permissions assigned.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Filters Bar */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex-1 max-w-lg items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                  </div>

                  <div className="">
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="indigo" />
                  </div>
                </div>

                {/* Empty state */}
                {!ordersLoading && orders.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
                    <p className="text-xl text-gray-500 dark:text-gray-400">No orders found</p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">{searchTerm ? 'Try adjusting your search' : 'No orders assigned to this staff yet'}</p>
                  </div>
                )}

                {/* Loading State */}
                {ordersLoading && (
                  <PageContentSkeleton viewMode={viewMode} rows={6} columns={5} />
                )}

                {/* Content */}
                {!ordersLoading && orders.length > 0 && (
                  <>
                    <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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
                        <ManagementGrid viewMode={viewMode} className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                          <AnimatePresence>
                            {orders.map((order, index) => (
                              <OrderCard key={order.order_id} order={order} index={index} />
                            ))}
                          </AnimatePresence>
                        </ManagementGrid>
                      )}
                    </div>

                    <div className="mt-4">
                      <PaginationComponent
                        currentPage={currentPage}
                        totalItems={totalOrders}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onLimitChange={handleLimitChange}
                        availableLimits={[10, 20, 50, 100]}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </ManagementHub>
  );
}
