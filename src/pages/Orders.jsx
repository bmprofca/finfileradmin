import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Briefcase, Hash, User, Users, UserPlus, UserMinus,
  Eye, Calendar, IndianRupee, FileText, Tag, CheckCircle, Edit, RefreshCw,
  ChevronLeft, ChevronRight
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
import { ConstantOptions } from '../contexts/ConstantOptionsContext';
import apiCall from '../utils/apiCall';

/* ─── Status Badge ─── */
const STATUS_COLORS = {
  'created': { pill: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500 dark:bg-blue-400' },
  'in process': { pill: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500 dark:bg-amber-400' },
  'pending from department': { pill: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-500 dark:bg-orange-400' },
  'completed': { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  'cancelled': { pill: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800', dot: 'bg-red-500 dark:bg-red-400' },
};

const StatusBadge = ({ status }) => {
  const key = (status || '').toString().toLowerCase();
  const cfg = STATUS_COLORS[key] || { pill: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', dot: 'bg-slate-400 dark:bg-gray-500' };
  const display = key.replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {display || 'Unknown'}
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

const getPaymentCardClass = (order) => {
  const paymentState = getPaymentState(order);

  if (paymentState === 'paid') {
    return 'border-emerald-300 bg-emerald-50/50 shadow-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/20';
  }

  if (paymentState === 'due') {
    return 'border-amber-300 bg-amber-50/60 shadow-amber-100 dark:border-amber-800 dark:bg-amber-950/20';
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

/* ─── Staff Management Modal ─── */
const StaffManagementModal = ({ order, allStaff, onClose, onSubmit, isSubmitting }) => {
  const [leftStaff, setLeftStaff] = useState([]);
  const [rightStaff, setRightStaff] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialRightStaff, setInitialRightStaff] = useState([]);

  useEffect(() => {
    if (order && allStaff.length > 0) {
      const assignedUsernames = order.assigned_staff?.map(s => s.username) || [];
      const left = allStaff.filter(s => !assignedUsernames.includes(s.username));
      const right = allStaff.filter(s => assignedUsernames.includes(s.username));
      setLeftStaff(left);
      setRightStaff(right);
      setInitialRightStaff(right.map(s => s.username));
      setHasChanges(false);
    }
  }, [order, allStaff]);

  const moveToRight = (staff) => {
    setLeftStaff(prev => prev.filter(s => s.username !== staff.username));
    setRightStaff(prev => [...prev, staff]);
    setHasChanges(true);
  };

  const moveToLeft = (staff) => {
    setRightStaff(prev => prev.filter(s => s.username !== staff.username));
    setLeftStaff(prev => [...prev, staff]);
    setHasChanges(true);
  };

  const moveAllToRight = () => {
    setRightStaff(prev => [...prev, ...leftStaff]);
    setLeftStaff([]);
    setHasChanges(true);
  };

  const moveAllToLeft = () => {
    setLeftStaff(prev => [...prev, ...rightStaff]);
    setRightStaff([]);
    setHasChanges(true);
  };

  const handleSubmit = () => {
    const staffUsernames = rightStaff.map(s => s.username);
    onSubmit({
      order_id: order.order_id,
      staff_usernames: staffUsernames
    });
  };

  const isInitial = () => {
    const currentRight = rightStaff.map(s => s.username).sort();
    const initialRight = initialRightStaff.sort();
    return JSON.stringify(currentRight) === JSON.stringify(initialRight);
  };

  const StaffCard = ({ staff, onAction, actionIcon: ActionIcon, actionLabel, direction }) => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group">
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
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{staff.username}</p>
        </div>
      </div>
      <button
        onClick={() => onAction(staff)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
        title={actionLabel}
      >
        <ActionIcon size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage Staff · ${order?.order_name || ''}`}
      icon={Users}
      size="3xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rightStaff.length} staff assigned
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges || isInitial()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users size={14} />
            {isSubmitting ? 'Updating...' : 'Update Staff'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Use the arrow buttons to move staff between available and assigned lists.
        </p>

        <div className="flex flex-col gap-4 lg:flex-row md:flex-row items-stretch">
          {/* Left Column - Available Staff */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserPlus size={14} className="text-indigo-500" />
                Available ({leftStaff.length})
              </h4>
              {leftStaff.length > 0 && (
                <button
                  onClick={moveAllToRight}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <ChevronRight size={14} /> All
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {leftStaff.length > 0 ? (
                leftStaff.map(staff => (
                  <StaffCard
                    key={staff.username}
                    staff={staff}
                    onAction={moveToRight}
                    actionIcon={ChevronRight}
                    actionLabel="Assign"
                  />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  <UserPlus className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
                  No available staff
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Navigation Arrows (narrow) */}
          <div className="w-16 mx-auto flex flex-col items-center justify-center gap-4 py-4 flex-shrink-0">
            <button
              onClick={moveAllToRight}
              disabled={leftStaff.length === 0}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={moveAllToLeft}
              disabled={rightStaff.length === 0}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium text-center">
              {rightStaff.length} / {allStaff.length}
            </div>
          </div>

          {/* Right Column - Assigned Staff */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserCheck size={14} className="text-green-500" />
                Assigned ({rightStaff.length})
              </h4>
              {rightStaff.length > 0 && (
                <button
                  onClick={moveAllToLeft}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> All
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {rightStaff.length > 0 ? (
                rightStaff.map(staff => (
                  <StaffCard
                    key={staff.username}
                    staff={staff}
                    onAction={moveToLeft}
                    actionIcon={ChevronLeft}
                    actionLabel="Unassign"
                  />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  <UserMinus className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
                  No staff assigned
                </div>
              )}
            </div>
          </div>
        </div>

        {hasChanges && !isInitial() && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <RefreshCw size={14} className="text-amber-600 dark:text-amber-400 animate-spin-slow" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have unsaved changes. Click "Update Staff" to save.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Helper component for UserCheck icon
const UserCheck = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
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

/* ─── View Order Modal ─── */
const ViewOrderModal = ({ order, onClose, onManageStaff, onUpdateOrder, onUpdateStatus }) => {
  const hasAssignedStaff = order.assigned_staff && order.assigned_staff.length > 0;

  return (
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
          <button
            onClick={() => onManageStaff(order)}
            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${hasAssignedStaff
              ? 'border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              : 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
              }`}
          >
            {hasAssignedStaff ? (
              <>
                <Users size={14} /> Manage Staff
              </>
            ) : (
              <>
                <UserPlus size={14} /> Assign Staff
              </>
            )}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
          <Briefcase size={28} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{order.order_name}</h3>
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
          <InfoItem icon={Hash} label="Order ID" value={order.order_id} />
          <InfoItem icon={FileText} label="Order Name" value={order.order_name} />
          <InfoItem icon={Tag} label="Service" value={order.service_name} />
          <InfoItem icon={User} label="Client" value={order.client_name || order.client_username} />
          <InfoItem icon={IndianRupee} label="Fees" value={formatCurrency(order.fees)} />
          <InfoItem icon={IndianRupee} label="Paid" value={formatCurrency(order.total_paid)} />
          <InfoItem icon={IndianRupee} label="Due" value={<PaymentText order={order} />} />
          <InfoItem icon={Briefcase} label="Status" value={<StatusBadge status={order.status} />} />
          <InfoItem icon={Calendar} label="Created" value={new Date(order.create_date).toLocaleString()} />
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
            <button
              onClick={() => onManageStaff(order)}
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold flex items-center gap-2"
            >
              <UserPlus size={16} /> Click to assign staff
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const OrderUpdateModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const { discountTypeOptions } = ConstantOptions();
  const [form, setForm] = useState({
    order_name: order?.order_name || '',
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

  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm';

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
      title={`Update Order · ${order?.order_name || ''}`}
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
            <input required value={form.order_name} onChange={setText('order_name')} className={inputCls} />
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
              options={discountTypeOptions}
              value={discountTypeOptions.find((option) => option.value === form.discount_type) || discountTypeOptions[0]}
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
  const { orderStatusOptions } = ConstantOptions();
  const [form, setForm] = useState({
    status: (order?.status || 'created').toString().toLowerCase(),
    remark: order?.remark || '',
  });

  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Status · ${order?.order_name || ''}`}
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
            options={orderStatusOptions}
            value={orderStatusOptions.find((option) => option.value === form.status) || orderStatusOptions[0]}
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
const OrderCard = ({ order, index, getActions, onClick, onManageStaff }) => {
  const hasAssignedStaff = order.assigned_staff && order.assigned_staff.length > 0;

  return (
    <ManagementCard
      delay={index * 0.05}
      accent="indigo"
      className={getPaymentCardClass(order)}
      eyebrow={`Date: ${new Date(order.create_date).toLocaleDateString()}`}
      title={order.order_name}
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
          <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(order.fees)}</span>
        </div>
      }
    >
      <div className="mt-1 space-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <User size={10} className="text-gray-400 dark:text-gray-500" />
          Client: {order.client_name || order.client_username}
        </p>
        {hasAssignedStaff ? (
          <button
            onClick={(e) => { e.stopPropagation(); onManageStaff && onManageStaff(order); }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1.5 mt-1"
          >
            <Users size={12} /> {order.assigned_staff.length} Staff Assigned
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onManageStaff && onManageStaff(order); }}
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold flex items-center gap-1.5 mt-1"
          >
            <UserPlus size={12} /> Assign Staff
          </button>
        )}
      </div>
    </ManagementCard>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function Orders() {
  const { orderStatusOptions } = ConstantOptions();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Staff
  const [allStaff, setAllStaff] = useState([]);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [updateOrderModalOpen, setUpdateOrderModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const itemsPerPage = 10;

  /* ─── Data Fetching ─── */
  const staffFetchedRef = useRef(false);

  const ensureStaffFetched = async () => {
    if (!staffFetchedRef.current) {
      setStaffLoading(true);
      try {
        const res = await apiCall('/api/admin/staff/list', 'GET');
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
      const statusParam = statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : '';
      const res = await apiCall(
        `/api/admin/orders/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}${statusParam}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        // Map the API response to match component expectations
        const mappedOrders = data.data.orders.map(order => ({
          ...order,
          // The API returns 'order_name' but components expect 'name'
          // We'll keep both for backward compatibility
          name: order.order_name,
          // Ensure arrays exist
          assigned_staff: order.assigned_staff || [],
          payments: order.payments || [],
          // Ensure numeric values are numbers
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
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lastOrderFetchRef = useRef({ page: null, search: null, status: null });
  useEffect(() => {
    if (
      lastOrderFetchRef.current.page === currentPage &&
      lastOrderFetchRef.current.search === searchTerm &&
      lastOrderFetchRef.current.status === statusFilter
    ) return;
    lastOrderFetchRef.current = { page: currentPage, search: searchTerm, status: statusFilter };
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const handleRefresh = () => { setRefreshing(true); fetchOrders(); };

  /* ─── Modal Openers ─── */
  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const openStaffModal = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(false);
    setStaffModalOpen(true);
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

  /* ─── API Handlers ─── */
  const handleUpdateStaff = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall('/api/admin/orders/assign/update', 'PUT', payload);
      const data = await res.json();
      if (data.success) {
        setStaffModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      }
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

  /* ─── Action Menu ─── */
  const getActions = (order) => {
    const hasAssignedStaff = order.assigned_staff && order.assigned_staff.length > 0;

    const actions = [
      {
        label: 'View Details',
        icon: <Eye size={12} />,
        onClick: () => openDetailModal(order),
        className: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40',
      },
      {
        label: hasAssignedStaff ? 'Manage Staff' : 'Assign Staff',
        icon: hasAssignedStaff ? <Users size={12} /> : <UserPlus size={12} />,
        onClick: () => openStaffModal(order),
        className: hasAssignedStaff
          ? 'text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40'
          : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40',
      },
      {
        label: 'Update Order',
        icon: <Edit size={12} />,
        onClick: () => openUpdateOrderModal(order),
        className: 'text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:text-indigo-200 dark:hover:bg-indigo-950/40',
      },
      {
        label: 'Update Status',
        icon: <RefreshCw size={12} />,
        onClick: () => openStatusModal(order),
        className: 'text-violet-700 hover:text-violet-800 hover:bg-violet-50 dark:text-violet-300 dark:hover:text-violet-200 dark:hover:bg-violet-950/40',
      },

    ];

    return actions;
  };

  /* ─── Table Columns ─── */
  const columns = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'order_name', label: 'Order Name' },
    { key: 'service_name', label: 'Service' },
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
              onClick={(e) => { e.stopPropagation(); openStaffModal(row); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/50 cursor-pointer"
            >
              <Users size={12} /> {row.assigned_staff.length} Assigned
            </button>
          )
          : (
            <button
              onClick={(e) => { e.stopPropagation(); openStaffModal(row); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/50 cursor-pointer"
            >
              <UserPlus size={12} /> Unassigned
            </button>
          ),
    },
    {
      key: 'fees', label: 'Fees',
      render: (row) => <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(row.fees)}</span>,
    },
    {
      key: 'payment', label: 'Payment',
      render: (row) => <PaymentText order={row} />,
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
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-gray-950/30"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px]"
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
              <div className="min-w-[180px] w-full sm:w-auto">
                <SelectField
                  options={orderStatusOptions}
                  value={orderStatusOptions.find((option) => option.value === statusFilter) || null}
                  onChange={(selected) => {
                    setStatusFilter(selected?.value || '');
                    setCurrentPage(1);
                  }}
                  placeholder="All Status"
                  isClearable
                />
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
                    rowClassName={(row) => getPaymentHighlightClass(row)}
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
                          onManageStaff={openStaffModal}
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
            onManageStaff={openStaffModal}
            onUpdateOrder={openUpdateOrderModal}
            onUpdateStatus={openStatusModal}
          />
        )}
      </AnimatePresence>

      {/* ── STAFF MANAGEMENT MODAL ── */}
      <AnimatePresence>
        {staffModalOpen && selectedOrder && (
          <StaffManagementModal
            order={selectedOrder}
            allStaff={allStaff}
            onClose={() => { setStaffModalOpen(false); setSelectedOrder(null); }}
            onSubmit={handleUpdateStaff}
            isSubmitting={saving}
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

    </ManagementHub>
  );
}
