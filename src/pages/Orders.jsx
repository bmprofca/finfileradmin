import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Briefcase, Hash, User, Users, UserPlus, UserMinus,
  Eye, Calendar, IndianRupee, FileText, Tag, CheckCircle, Edit, RefreshCw
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Modal from '../components/common/Modal';
import SelectField from '../components/common/SelectField';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import apiCall from '../utils/apiCall';

/* ─── Status Badge ─── */
const STATUS_COLORS = {
  'created':                  { pill: 'bg-blue-100 text-blue-800 border border-blue-200',   dot: 'bg-blue-500' },
  'in process':               { pill: 'bg-amber-100 text-amber-800 border border-amber-200', dot: 'bg-amber-500' },
  'pending from department':  { pill: 'bg-orange-100 text-orange-800 border border-orange-200', dot: 'bg-orange-500' },
  'completed':                { pill: 'bg-green-100 text-green-800 border border-green-200', dot: 'bg-green-500' },
  'cancelled':                { pill: 'bg-red-100 text-red-800 border border-red-200',       dot: 'bg-red-500' },
};

const ORDER_STATUS_OPTIONS = [
  'created',
  'in process',
  'pending from department',
  'completed',
  'cancelled',
];

const ORDER_STATUS_SELECT_OPTIONS = ORDER_STATUS_OPTIONS.map((status) => ({
  value: status,
  label: status.replace(/\b\w/g, l => l.toUpperCase()),
}));

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'not applicable', label: 'Not Applicable' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'flat', label: 'Flat' },
];

const StatusBadge = ({ status }) => {
  const key = (status || '').toString().toLowerCase();
  const cfg = STATUS_COLORS[key] || { pill: 'bg-gray-100 text-gray-700 border border-gray-200', dot: 'bg-gray-400' };
  const display = key.replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {display || 'Unknown'}
    </span>
  );
};

/* ─── Staff Checkbox List ─── */
const StaffCheckboxList = ({ allStaff, selectedUsernames, onChange }) => (
  <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
    {allStaff.map(staff => (
      <label
        key={staff.username}
        className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors shadow-sm border border-transparent dark:border-gray-700"
      >
        <input
          type="checkbox"
          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          checked={selectedUsernames.includes(staff.username)}
          onChange={(e) => {
            if (e.target.checked) onChange([...selectedUsernames, staff.username]);
            else onChange(selectedUsernames.filter(u => u !== staff.username));
          }}
        />
        <div className="flex items-center gap-3 min-w-0">
          {staff.image ? (
            <img src={staff.image} alt={staff.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {staff.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{staff.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{staff.username} · {staff.email}</p>
          </div>
        </div>
      </label>
    ))}
    {allStaff.length === 0 && (
      <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">No staff members available.</p>
    )}
  </div>
);

/* ─── Info Item ─── */
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="text-indigo-500 dark:text-indigo-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

/* ─── View Assigned Staff Modal ─── */
const ViewAssignedStaffModal = ({ order, onClose }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={`Assigned Staff · ${order?.name || ''}`}
    icon={Users}
    size="md"
    footer={null}
  >
    <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
      {order.assigned_staff && order.assigned_staff.length > 0 ? (
        order.assigned_staff.map(staff => (
          <div key={staff.username} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {staff.name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{staff.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{staff.username}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">No staff assigned to this order.</p>
      )}
    </div>
  </Modal>
);

/* ─── View Order Modal ─── */
const ViewOrderModal = ({ order, onClose, onAssign, onEditStaff, onRemoveStaff, onUpdateOrder, onUpdateStatus }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Order Details"
    icon={Briefcase}
    size="2xl"
    contentClassName="p-5 space-y-4"
    footer={
      <>
        <button
          onClick={() => onUpdateStatus(order)}
          className="px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} /> Status
        </button>
        <button
          onClick={() => onUpdateOrder(order)}
          className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/20 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-2"
        >
          <Edit size={14} /> Update
        </button>
        {order.assigned_staff && order.assigned_staff.length > 0 && (
          <button
            onClick={() => onRemoveStaff(order)}
            className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
          >
            <UserMinus size={14} /> Remove
          </button>
        )}
        <button
          onClick={() => onEditStaff(order)}
          className="px-4 py-2.5 rounded-xl border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/20 text-sm font-semibold text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-all flex items-center gap-2"
        >
          <Users size={14} /> Edit Staff
        </button>
        <button
          onClick={() => onAssign(order)}
          className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-2"
        >
          <UserPlus size={14} /> Assign Staff
        </button>
      </>
    }
  >
    {/* Icon + Name */}
    <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
        <Briefcase size={28} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{order.name}</h3>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{order.service_name}</p>
        <div className="mt-2 flex gap-2 items-center">
          <StatusBadge status={order.status} />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono text-[10px]">ID: {order.order_id}</span>
        </div>
      </div>
    </div>

    {/* Info Grid */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <FileText className="text-indigo-500 dark:text-indigo-400" size={15} /> General & Financial Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem icon={Hash}         label="Order ID"   value={order.order_id} />
        <InfoItem icon={FileText}     label="Order Name" value={order.name} />
        <InfoItem icon={Tag}          label="Service"    value={order.service_name} />
        <InfoItem icon={User}         label="Client"     value={order.client_name || order.client_username} />
        <InfoItem icon={IndianRupee}  label="Fees"       value={`₹${Number(order.fees).toLocaleString()}`} />
        <InfoItem icon={Briefcase}    label="Status"     value={<StatusBadge status={order.status} />} />
        <InfoItem icon={Calendar}     label="Created"    value={new Date(order.create_date).toLocaleString()} />
      </div>
    </div>

    {/* Staff Grid */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Users className="text-indigo-500 dark:text-indigo-400" size={15} /> Assigned Staff
      </h4>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        {order.assigned_staff && order.assigned_staff.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {order.assigned_staff.map(s => (
              <span
                key={s.username}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-indigo-300 dark:border-gray-700"
              >
                <User size={12} className="text-indigo-500" /> {s.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400 italic">No staff currently assigned to this order.</span>
        )}
      </div>
    </div>
  </Modal>
);

const OrderUpdateModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    name: order?.name || '',
    service_id: order?.service_id || '',
    base_price: order?.base_price ?? 1,
    tax_rate: order?.tax_rate ?? 1,
    tax_value: order?.tax_value ?? 1,
    total_fees: order?.total_fees ?? 1,
    discount_type: order?.discount_type || 'not applicable',
    discount_percentage: order?.discount_percentage ?? 1,
    discount_value: order?.discount_value ?? 1,
    fees: order?.fees ?? 1,
    partial_payment_allowed: order?.partial_payment_allowed ?? true,
  });

  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm dark:text-gray-100';

  const setText = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setNumber = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value === '' ? '' : Number(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      base_price: Number(form.base_price),
      tax_rate: Number(form.tax_rate),
      tax_value: Number(form.tax_value),
      total_fees: Number(form.total_fees),
      discount_percentage: Number(form.discount_percentage),
      discount_value: Number(form.discount_value),
      fees: Number(form.fees),
      partial_payment_allowed: Boolean(form.partial_payment_allowed),
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Order · ${order?.name || ''}`}
      icon={Edit}
      size="3xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="order-update-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Edit size={14} />
          {isSubmitting ? 'Updating...' : 'Update Order'}
        </button>
      }
    >
      <form id="order-update-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Order Name</label>
            <input required value={form.name} onChange={setText('name')} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Service ID</label>
            <input required value={form.service_id} onChange={setText('service_id')} className={inputCls} />
          </div>
          {[
            ['base_price', 'Base Price'],
            ['tax_rate', 'Tax Rate'],
            ['tax_value', 'Tax Value'],
            ['total_fees', 'Total Fees'],
            ['discount_percentage', 'Discount Percentage'],
            ['discount_value', 'Discount Value'],
            ['fees', 'Final Fees'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
              <input required type="number" min="0" step="0.01" value={form[key]} onChange={setNumber(key)} className={inputCls} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Discount Type</label>
            <SelectField
              options={DISCOUNT_TYPE_OPTIONS}
              value={DISCOUNT_TYPE_OPTIONS.find((option) => option.value === form.discount_type) || DISCOUNT_TYPE_OPTIONS[0]}
              onChange={(selected) => setForm((prev) => ({ ...prev, discount_type: selected?.value || 'not applicable' }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={form.partial_payment_allowed}
                onChange={(e) => setForm((prev) => ({ ...prev, partial_payment_allowed: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              Partial payment allowed
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const OrderStatusModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    status: (order?.status || 'created').toString().toLowerCase(),
    remark: order?.remark || '',
  });

  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm dark:text-gray-100';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Status · ${order?.name || ''}`}
      icon={RefreshCw}
      size="md"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="order-status-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          {isSubmitting ? 'Updating...' : 'Update Status'}
        </button>
      }
    >
      <form id="order-status-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
          <SelectField
            options={ORDER_STATUS_SELECT_OPTIONS}
            value={ORDER_STATUS_SELECT_OPTIONS.find((option) => option.value === form.status) || ORDER_STATUS_SELECT_OPTIONS[0]}
            onChange={(selected) => setForm((prev) => ({ ...prev, status: selected?.value || 'created' }))}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Remark</label>
          <textarea
            value={form.remark}
            onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
            rows={4}
            placeholder="Add a status note..."
            className={inputCls}
          />
        </div>
      </form>
    </Modal>
  );
};

/* ─── Order Card ─── */
const OrderCard = ({ order, index, getActions, onClick, onViewStaff }) => (
  <ManagementCard
    delay={index * 0.05}
    accent="indigo"
    eyebrow={`Date: ${new Date(order.create_date).toLocaleDateString()}`}
    title={order.name}
    subtitle={order.service_name}
    onClick={() => onClick && onClick(order)}
    icon={
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
        <Briefcase size={20} />
      </div>
    }
    badge={<StatusBadge status={order.status} />}
    menuId={`order-card-${order.order_id}`}
    actions={getActions ? getActions(order) : undefined}
    footer={
      <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Hash size={10} className="text-indigo-400 dark:text-indigo-500" /> {order.order_id}
        </span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">₹{order.fees}</span>
      </div>
    }
  >
    <div className="mt-1 space-y-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <User size={10} className="text-gray-400 dark:text-gray-500" />
        Client: {order.client_name || order.client_username}
      </p>
      {order.assigned_staff && order.assigned_staff.length > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onViewStaff && onViewStaff(order); }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5 mt-1"
        >
          <Users size={12} /> {order.assigned_staff.length} Staff Assigned
        </button>
      )}
    </div>
  </ManagementCard>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function Orders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [viewMode, setViewMode]       = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Staff
  const [allStaff, setAllStaff] = useState([]);

  // Modals
  const [selectedOrder, setSelectedOrder]                 = useState(null);
  const [detailModalOpen, setDetailModalOpen]             = useState(false);
  const [assignModalOpen, setAssignModalOpen]             = useState(false);
  const [editStaffModalOpen, setEditStaffModalOpen]       = useState(false);
  const [removeStaffModalOpen, setRemoveStaffModalOpen]   = useState(false);
  const [viewStaffModalOpen, setViewStaffModalOpen]       = useState(false);
  const [updateOrderModalOpen, setUpdateOrderModalOpen]   = useState(false);
  const [statusModalOpen, setStatusModalOpen]             = useState(false);
  const [selectedStaffUsernames, setSelectedStaffUsernames] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const itemsPerPage = 10;

  /* ─── Data Fetching ─── */
  const staffFetchedRef = useRef(false);

  const ensureStaffFetched = async () => {
    if (!staffFetchedRef.current) {
      setStaffLoading(true);
      try {
        const res  = await apiCall('/api/admin/staff/list', 'GET');
        const data = await res.json();
        if (data.success) {
          setAllStaff(data.data.staffs);
          staffFetchedRef.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch staff', err);
      } finally {
        setStaffLoading(false);
      }
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res  = await apiCall(
        `/api/admin/orders/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setTotalOrders(data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lastOrderFetchRef = useRef({ page: null, search: null });
  useEffect(() => { 
    if (lastOrderFetchRef.current.page === currentPage && lastOrderFetchRef.current.search === searchTerm) return;
    lastOrderFetchRef.current = { page: currentPage, search: searchTerm };
    fetchOrders(); 
  }, [currentPage, searchTerm]);

  const handleRefresh = () => { setRefreshing(true); fetchOrders(); };

  /* ─── Modal Openers ─── */
  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const openViewStaffModal = (order) => {
    setSelectedOrder(order);
    setViewStaffModalOpen(true);
  };

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setSelectedStaffUsernames([]);
    setDetailModalOpen(false);
    setAssignModalOpen(true);
    ensureStaffFetched();
  };

  const openUpdateOrderModal = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(false);
    setUpdateOrderModalOpen(true);
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(false);
    setStatusModalOpen(true);
  };

  const openEditStaffModal = (order) => {
    setSelectedOrder(order);
    setSelectedStaffUsernames(order.assigned_staff ? order.assigned_staff.map(s => s.username) : []);
    setDetailModalOpen(false);
    setEditStaffModalOpen(true);
    ensureStaffFetched();
  };

  const openRemoveStaffModal = (order) => {
    setSelectedOrder(order);
    setSelectedStaffUsernames([]);
    setDetailModalOpen(false);
    setRemoveStaffModalOpen(true);
    ensureStaffFetched();
  };

  /* ─── API Handlers ─── */
  const handleAssignStaff = async () => {
    if (!selectedOrder || selectedStaffUsernames.length === 0) return;
    setSaving(true);
    try {
      const res  = await apiCall('/api/admin/orders/assign', 'POST', {
        order_id: selectedOrder.order_id,
        staff_usernames: selectedStaffUsernames,
      });
      const data = await res.json();
      if (data.success) { setAssignModalOpen(false); fetchOrders(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleEditStaff = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res  = await apiCall('/api/admin/orders/assign/update', 'PUT', {
        order_id: selectedOrder.order_id,
        staff_usernames: selectedStaffUsernames,
      });
      const data = await res.json();
      if (data.success) { setEditStaffModalOpen(false); fetchOrders(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleRemoveStaff = async () => {
    if (!selectedOrder || selectedStaffUsernames.length === 0) return;
    setSaving(true);
    try {
      const res  = await apiCall('/api/admin/orders/assign/remove', 'DELETE', {
        order_id: selectedOrder.order_id,
        staff_usernames: selectedStaffUsernames,
      });
      const data = await res.json();
      if (data.success) { setRemoveStaffModalOpen(false); fetchOrders(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleUpdateOrder = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall(`/api/admin/orders/update/${selectedOrder.order_id}`, 'PUT', payload);
      const data = await res.json();
      if (data.success) {
        setUpdateOrderModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall(`/api/admin/orders/status/${selectedOrder.order_id}`, 'PUT', payload);
      const data = await res.json();
      if (data.success) {
        setStatusModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  /* ─── Computed Staff Lists ─── */
  const unassignedStaff = allStaff.filter(
    s => !selectedOrder?.assigned_staff?.some(a => a.username === s.username)
  );

  const assignedStaffList = selectedOrder?.assigned_staff
    ? allStaff.filter(s => selectedOrder.assigned_staff.some(a => a.username === s.username))
    : [];

  /* ─── Action Menu (matches Services.jsx shape) ─── */
  const getActions = (order) => {
    const actions = [
      {
        label: 'View Details',
        icon: <Eye size={12} />,
        onClick: () => openDetailModal(order),
        className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300',
      },
      {
        label: 'Update Order',
        icon: <Edit size={12} />,
        onClick: () => openUpdateOrderModal(order),
        className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300',
      },
      {
        label: 'Update Status',
        icon: <RefreshCw size={12} />,
        onClick: () => openStatusModal(order),
        className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300',
      },
      {
        label: 'Assign Staff',
        icon: <UserPlus size={12} />,
        onClick: () => openAssignModal(order),
        className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300',
      },
      {
        label: 'Edit Staff',
        icon: <Users size={12} />,
        onClick: () => openEditStaffModal(order),
        className: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 dark:text-amber-400 dark:hover:text-amber-300',
      },
    ];

    if (order.assigned_staff && order.assigned_staff.length > 0) {
      actions.push({
        label: 'Remove Staff',
        icon: <UserMinus size={12} />,
        onClick: () => openRemoveStaffModal(order),
        className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300',
      });
    }

    return actions;
  };

  /* ─── Table Columns ─── */
  const columns = [
    { key: 'order_id',      label: 'Order ID' },
    { key: 'name',          label: 'Order Name' },
    { key: 'service_name',  label: 'Service' },
    {
      key: 'client', label: 'Client',
      render: (row) => row.client_name || row.client_username,
    },
    {
      key: 'assigned_staff', label: 'Staff',
      render: (row) =>
        row.assigned_staff && row.assigned_staff.length > 0
          ? (
            <button
              onClick={(e) => { e.stopPropagation(); openViewStaffModal(row); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/50 cursor-pointer"
            >
              <Users size={12} /> {row.assigned_staff.length} Assigned
            </button>
          )
          : <span className="text-xs text-gray-400 dark:text-gray-500 italic">Unassigned</span>,
    },
    {
      key: 'fees', label: 'Fees',
      render: (row) => <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₹{row.fees}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'create_date', label: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {new Date(row.create_date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  /* ─── Render ─── */
  return (
    <ManagementHub
      title="All Orders"
      description="Manage and track all client orders in the system."
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
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
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

          {/* Loading */}
          {loading && (
            <PageContentSkeleton viewMode={viewMode} rows={6} columns={6} />
          )}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50"
            >
              <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
              <p className="text-xl text-gray-500 dark:text-gray-400">No orders found</p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'There are no orders yet'}
              </p>
            </motion.div>
          )}

          {/* Content */}
          {!loading && orders.length > 0 && (
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
                    rows={orders}
                    rowKey="order_id"
                    accent="indigo"
                    getActions={getActions}
                    onRowClick={(row) => openDetailModal(row)}
                  />
                )}

                {/* Card View */}
                {viewMode === 'card' && (
                  <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                    <AnimatePresence>
                      {orders.map((order, index) => (
                        <OrderCard
                          key={order.order_id}
                          order={order}
                          index={index}
                          getActions={getActions}
                          onClick={openDetailModal}
                          onViewStaff={openViewStaffModal}
                        />
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

      {/* ── VIEW DETAILS MODAL ── */}
      <AnimatePresence>
        {detailModalOpen && selectedOrder && (
          <ViewOrderModal
            order={selectedOrder}
            onClose={() => { setDetailModalOpen(false); setSelectedOrder(null); }}
            onAssign={openAssignModal}
            onEditStaff={openEditStaffModal}
            onRemoveStaff={openRemoveStaffModal}
            onUpdateOrder={openUpdateOrderModal}
            onUpdateStatus={openStatusModal}
          />
        )}
      </AnimatePresence>

      {/* ── UPDATE ORDER MODAL ── */}
      <AnimatePresence>
        {updateOrderModalOpen && selectedOrder && (
          <OrderUpdateModal
            order={selectedOrder}
            onClose={() => setUpdateOrderModalOpen(false)}
            onSubmit={handleUpdateOrder}
            isSubmitting={saving}
          />
        )}
      </AnimatePresence>

      {/* ── UPDATE STATUS MODAL ── */}
      <AnimatePresence>
        {statusModalOpen && selectedOrder && (
          <OrderStatusModal
            order={selectedOrder}
            onClose={() => setStatusModalOpen(false)}
            onSubmit={handleUpdateStatus}
            isSubmitting={saving}
          />
        )}
      </AnimatePresence>

      {/* ── VIEW ASSIGNED STAFF MODAL ── */}
      <AnimatePresence>
        {viewStaffModalOpen && selectedOrder && (
          <ViewAssignedStaffModal
            order={selectedOrder}
            onClose={() => { setViewStaffModalOpen(false); setSelectedOrder(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── ASSIGN STAFF MODAL ── */}
      <AnimatePresence>
        {assignModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setAssignModalOpen(false)}
            title={`Assign Staff · ${selectedOrder?.name || ''}`}
            icon={UserPlus}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={saving || selectedStaffUsernames.length === 0}
                onClick={handleAssignStaff}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={14} />
                {saving ? 'Assigning…' : `Assign${selectedStaffUsernames.length > 0 ? ` (${selectedStaffUsernames.length})` : ''}`}
              </button>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select staff members to add to this order. Already-assigned staff are excluded.
              </p>
              {staffLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading staff...
                </div>
              ) : (
                <StaffCheckboxList
                  allStaff={unassignedStaff}
                  selectedUsernames={selectedStaffUsernames}
                  onChange={setSelectedStaffUsernames}
                />
              )}
              {!staffLoading && unassignedStaff.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="text-green-400 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">All staff are already assigned to this order.</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── EDIT STAFF MODAL ── */}
      <AnimatePresence>
        {editStaffModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setEditStaffModalOpen(false)}
            title={`Edit Staff · ${selectedOrder?.name || ''}`}
            icon={Users}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={saving || staffLoading}
                onClick={handleEditStaff}
                className="px-5 py-2.5 rounded-xl bg-amber-500 dark:bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 dark:hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Users size={14} />
                {saving ? 'Saving…' : 'Update Assignments'}
              </button>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select who should be assigned. This <span className="font-semibold text-gray-700 dark:text-gray-300">replaces</span> all current assignments.
              </p>
              {staffLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading staff...
                </div>
              ) : (
                <StaffCheckboxList
                  allStaff={allStaff}
                  selectedUsernames={selectedStaffUsernames}
                  onChange={setSelectedStaffUsernames}
                />
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── REMOVE STAFF MODAL ── */}
      <AnimatePresence>
        {removeStaffModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setRemoveStaffModalOpen(false)}
            title={`Remove Staff · ${selectedOrder?.name || ''}`}
            icon={UserMinus}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={saving || selectedStaffUsernames.length === 0}
                onClick={handleRemoveStaff}
                className="px-5 py-2.5 rounded-xl bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <UserMinus size={14} />
                {saving ? 'Removing…' : `Remove${selectedStaffUsernames.length > 0 ? ` (${selectedStaffUsernames.length})` : ''}`}
              </button>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose which staff members to unassign from this order.
              </p>
              {staffLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading staff...
                </div>
              ) : assignedStaffList.length > 0 ? (
                <StaffCheckboxList
                  allStaff={assignedStaffList}
                  selectedUsernames={selectedStaffUsernames}
                  onChange={setSelectedStaffUsernames}
                />
              ) : (
                <div className="text-center py-8">
                  <UserMinus className="text-gray-300 dark:text-gray-600 mx-auto mb-2" size={40} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No staff assigned to this order.</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </ManagementHub>
  );
}
