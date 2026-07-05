import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search,
  X,
  Briefcase,
  User,
  Users,
  UserPlus,
  UserMinus,
  Eye,
  FileText,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Phone,
  List,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import ManagementHub from "../components/common/ManagementHub";
import ManagementTable from "../components/common/ManagementTable";
import PaginationComponent from "../components/common/PaginationComponent";
import Modal from "../components/common/Modal";
import SelectField from "../components/common/SelectField";
import AdvancedDateFilter from "../components/common/AdvancedDateFilter";
import AsyncSelectField from "../components/common/AsyncSelectField";
import { PageContentSkeleton } from "../components/SkeletonComponent";
import { ConstantOptions } from "../contexts/ConstantOptionsContext";
import apiCall from "../utils/apiCall";
import toast from "react-hot-toast";

/* ─── Tab Configuration ─── */
const getTodayISO = () => new Date().toISOString().split("T")[0];

const TAB_CONFIG = [
  {
    key: "all",
    label: "All Orders",
    icon: List,
    getParams: () => ({}),
    emptyLabel: "No orders found",
  },
  {
    key: "assigned",
    label: "Assigned",
    icon: Users,
    getParams: () => ({ assigned: true }),
    emptyLabel: "No assigned orders found",
  },
  {
    key: "unassigned",
    label: "Unassigned",
    icon: UserPlus,
    getParams: () => ({ assigned: false }),
    emptyLabel: "No unassigned orders found",
  },
  {
    key: "today",
    label: "Today",
    icon: CalendarDays,
    getParams: () => ({ from_date: getTodayISO(), to_date: getTodayISO() }),
    emptyLabel: "No orders created today",
  },
  {
    key: "payment_due",
    label: "Payment Due",
    icon: AlertCircle,
    getParams: () => ({ payment_overdue: true }),
    emptyLabel: "No payment overdue orders",
  },
];

/* ─── Status Badge ─── */
const STATUS_COLORS = {
  created: {
    pill: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  "in process": {
    pill: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  "pending from department": {
    pill: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    dot: "bg-orange-500 dark:bg-orange-400",
  },
  completed: {
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  cancelled: {
    pill: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500 dark:bg-red-400",
  },
};

const StatusBadge = ({ status }) => {
  const key = (status || "").toString().toLowerCase();
  const cfg = STATUS_COLORS[key] || {
    pill: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    dot: "bg-slate-400 dark:bg-gray-500",
  };
  const display = key.replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {display || "Unknown"}
    </span>
  );
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const getPaymentState = (order) => {
  const fees = Number(order?.fees) || 0;
  const totalPaid = Number(order?.total_paid) || 0;
  const dueAmount = Number(order?.due_amount) || Math.max(fees - totalPaid, 0);

  if (dueAmount <= 0 && fees > 0) return "paid";
  if (dueAmount > 0) return "due";
  return "unpaid";
};

const getRowHighlightClass = (order) => {
  const hasAssignedStaff =
    order.assigned_staff && order.assigned_staff.length > 0;
  return hasAssignedStaff
    ? "bg-blue-50/40 hover:bg-blue-100/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20"
    : "bg-yellow-50/60 hover:bg-yellow-100/70 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20";
};

const PaymentText = ({ order }) => {
  const paymentState = getPaymentState(order);
  const isPaid = paymentState === "paid";

  return (
    <span
      className={`whitespace-nowrap text-xs font-semibold ${isPaid
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-amber-700 dark:text-amber-300"
        }`}
    >
      {isPaid ? "Paid" : `Due ${formatCurrency(order.due_amount)}`}
    </span>
  );
};

/* ─── Staff Skeleton ─── */
const StaffCardSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div>
        <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
        <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
      </div>
    </div>
    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
  </div>
);

/* ─── Staff Management Modal ─── */
const StaffManagementModal = ({
  order,
  allStaff,
  staffLoading,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [leftStaff, setLeftStaff] = useState([]);
  const [rightStaff, setRightStaff] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialRightStaff, setInitialRightStaff] = useState([]);
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  useEffect(() => {
    if (order && allStaff.length > 0) {
      const assignedUsernames =
        order.assigned_staff?.map((s) => s.username) || [];
      const left = allStaff.filter(
        (s) => !assignedUsernames.includes(s.username),
      );
      const right = allStaff.filter((s) =>
        assignedUsernames.includes(s.username),
      );
      setLeftStaff(left);
      setRightStaff(right);
      setInitialRightStaff(right.map((s) => s.username));
      setHasChanges(false);
    }
  }, [order, allStaff]);

  const filterStaff = (list, search) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        (s.full_name || s.name || "").toLowerCase().includes(q) ||
        (s.mobile || "").includes(q) ||
        (s.username || "").toLowerCase().includes(q),
    );
  };

  const moveToRight = (staff) => {
    setLeftStaff((prev) => prev.filter((s) => s.username !== staff.username));
    setRightStaff((prev) => [...prev, staff]);
    setHasChanges(true);
  };

  const moveToLeft = (staff) => {
    setRightStaff((prev) => prev.filter((s) => s.username !== staff.username));
    setLeftStaff((prev) => [...prev, staff]);
    setHasChanges(true);
  };

  const moveAllToRight = () => {
    setRightStaff((prev) => [...prev, ...leftStaff]);
    setLeftStaff([]);
    setHasChanges(true);
  };

  const moveAllToLeft = () => {
    setLeftStaff((prev) => [...prev, ...rightStaff]);
    setRightStaff([]);
    setHasChanges(true);
  };

  const handleSubmit = () => {
    onSubmit({
      order_id: order.order_id,
      staff_usernames: rightStaff.map((s) => s.username),
    });
  };

  const isInitial = () => {
    const currentRight = [...rightStaff.map((s) => s.username)].sort();
    const initialRight = [...initialRightStaff].sort();
    return JSON.stringify(currentRight) === JSON.stringify(initialRight);
  };

  const filteredLeft = filterStaff(leftStaff, leftSearch);
  const filteredRight = filterStaff(rightStaff, rightSearch);

  const StaffCard = ({
    staff,
    onAction,
    actionIcon: ActionIcon,
    actionLabel,
  }) => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        {staff.image ? (
          <img
            src={staff.image}
            alt={staff.full_name || staff.name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(staff.full_name || staff.name || "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {staff.full_name || staff.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <Phone size={10} /> {staff.mobile || "—"}
          </p>
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

  const SearchInput = ({ value, onChange, placeholder }) => (
    <div className="relative mb-2">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        size={13}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-100"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage Staff · ${order?.order_name || ""}`}
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
            className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users size={14} />
            {isSubmitting ? "Updating..." : "Update Staff"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Use the arrow buttons to move staff between available and assigned
          lists.
        </p>

        <div className="flex flex-col gap-4 lg:flex-row md:flex-row items-stretch">
          {/* Left Column - Available Staff */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserPlus size={14} className="text-indigo-500" />
                Available ({leftStaff.length})
              </h4>
              {leftStaff.length > 0 && (
                <button
                  onClick={moveAllToRight}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <ChevronRight size={14} /> All
                </button>
              )}
            </div>
            <SearchInput
              value={leftSearch}
              onChange={setLeftSearch}
              placeholder="Search available..."
            />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {staffLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <StaffCardSkeleton key={i} />
                ))
              ) : filteredLeft.length > 0 ? (
                filteredLeft.map((staff) => (
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
                  <UserPlus
                    className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                    size={32}
                  />
                  {leftSearch ? "No matching staff" : "No available staff"}
                </div>
              )}
            </div>
          </div>

          {/* Center Column */}
          <div className="w-16 mx-auto flex flex-col items-center justify-center gap-4 py-4 flex-shrink-0">
            <button
              onClick={moveAllToRight}
              disabled={leftStaff.length === 0}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={moveAllToLeft}
              disabled={rightStaff.length === 0}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-xs text-gray-400 font-medium text-center">
              {rightStaff.length} / {allStaff.length}
            </div>
          </div>

          {/* Right Column - Assigned Staff */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserCheck size={14} className="text-green-500" />
                Assigned ({rightStaff.length})
              </h4>
              {rightStaff.length > 0 && (
                <button
                  onClick={moveAllToLeft}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> All
                </button>
              )}
            </div>
            <SearchInput
              value={rightSearch}
              onChange={setRightSearch}
              placeholder="Search assigned..."
            />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {staffLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <StaffCardSkeleton key={i} />
                ))
              ) : filteredRight.length > 0 ? (
                filteredRight.map((staff) => (
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
                  <UserMinus
                    className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                    size={32}
                  />
                  {rightSearch ? "No matching staff" : "No staff assigned"}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasChanges && !isInitial() && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <RefreshCw
              size={14}
              className="text-amber-600 dark:text-amber-400 animate-spin-slow"
            />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have unsaved changes. Click "Update Staff" to save.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

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

const OrderUpdateModal = ({
  order,
  services,
  servicesLoading,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const { discountTypeOptions } = ConstantOptions();
  const [form, setForm] = useState({
    order_name: order?.order_name || order?.name || "",
    service_id: order?.service_id || "",
    base_price: order?.base_price ?? "",
    tax_rate: order?.tax_rate ?? "",
    tax_value: order?.tax_value ?? "",
    total_fees: order?.total_fees ?? "",
    discount_type: order?.discount_type || "not applicable",
    discount_percentage: order?.discount_percentage ?? "",
    discount_value: order?.discount_value ?? "",
    fees: order?.fees ?? "",
    partial_payment_allowed: order?.partial_payment_allowed ?? true,
  });

  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none";
  const readOnlyCls =
    "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-600/50 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none";

  const handleNumberKeyPress = (e) => {
    if (!/[0-9.]/.test(e.key)) e.preventDefault();
  };
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
  };

  // Auto-calculation (same logic as ServiceFormModal)
  useEffect(() => {
    const basePrice = Number(form.base_price) || 0;
    const taxRate = Number(form.tax_rate) || 0;
    const discountPercentage = Number(form.discount_percentage) || 0;
    const discountType = form.discount_type;

    const taxValue = parseFloat(((basePrice * taxRate) / 100).toFixed(2));
    const totalFees = parseFloat((basePrice + taxValue).toFixed(2));

    let discountValue;
    if (discountType === "percentage") {
      discountValue = parseFloat(
        ((totalFees * discountPercentage) / 100).toFixed(2),
      );
    } else if (discountType === "flat") {
      discountValue = Number(form.discount_value) || 0;
    } else {
      discountValue = 0;
    }

    const fees = parseFloat((totalFees - discountValue).toFixed(2));

    setForm((prev) => ({
      ...prev,
      tax_value: taxValue !== 0 ? taxValue : "",
      total_fees: totalFees !== 0 ? totalFees : "",
      ...(discountType === "percentage"
        ? { discount_value: discountValue !== 0 ? discountValue : "" }
        : {}),
      ...(discountType === "not applicable" ? { discount_value: "" } : {}),
      fees: fees !== 0 ? fees : "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.base_price,
    form.tax_rate,
    form.discount_type,
    form.discount_percentage,
  ]);

  const handleFlatDiscountChange = (e) => {
    const value = e.target.value;
    const discountValue = value === "" ? 0 : Number(value);
    const totalFees = Number(form.total_fees) || 0;
    const fees = parseFloat((totalFees - discountValue).toFixed(2));
    setForm((prev) => ({
      ...prev,
      discount_value: value === "" ? "" : discountValue,
      fees: fees !== 0 ? fees : "",
    }));
  };

  const handleServiceSelect = (selected) => {
    if (!selected) {
      setForm((prev) => ({ ...prev, service_id: "" }));
      return;
    }
    const svc = services.find((s) => s.service_id === selected.value);
    if (svc) {
      setForm((prev) => ({
        ...prev,
        service_id: svc.service_id,
        base_price: svc.base_price ?? "",
        tax_rate: svc.tax_rate ?? "",
        discount_type: svc.discount_type || "not applicable",
        discount_percentage: svc.discount_percentage ?? "",
        discount_value:
          svc.discount_type === "flat"
            ? (svc.discount_value ?? "")
            : prev.discount_value,
      }));
    } else {
      setForm((prev) => ({ ...prev, service_id: selected.value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    [
      "base_price",
      "tax_rate",
      "tax_value",
      "total_fees",
      "discount_percentage",
      "discount_value",
      "fees",
    ].forEach((k) => {
      payload[k] = Number(payload[k]);
    });
    payload.partial_payment_allowed = Boolean(payload.partial_payment_allowed);
    onSubmit(payload);
  };

  const isPercentageDiscount = form.discount_type === "percentage";
  const isFlatDiscount = form.discount_type === "flat";
  const isDiscountApplicable = form.discount_type !== "not applicable";

  const serviceOptions = services.map((s) => ({
    value: s.service_id,
    label: s.name,
  }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Order · ${order?.order_name || order?.name || ""}`}
      icon={Edit}
      size="3xl"
      contentClassName="p-0"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="order-update-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Edit size={14} />
          {isSubmitting ? "Updating..." : "Update Order"}
        </button>
      }
    >
      <form
        id="order-update-form"
        onSubmit={handleSubmit}
        className="p-6 space-y-8"
      >
        {/* Basic Info */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
            Order Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Order Name *
              </label>
              <input
                required
                type="text"
                value={form.order_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order_name: e.target.value }))
                }
                className={inputCls}
                placeholder="Order name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Service *
              </label>
              <SelectField
                options={serviceOptions}
                value={
                  serviceOptions.find((o) => o.value === form.service_id) ||
                  null
                }
                onChange={handleServiceSelect}
                placeholder={
                  servicesLoading ? "Loading services..." : "Select service..."
                }
                isLoading={servicesLoading}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Pricing */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 border-b pb-2 dark:border-gray-700">
            Pricing &amp; Fees
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Tax Value, Total Fees, and Final Fees are calculated automatically.
            Fields with (auto) are read-only.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Base Price
              </label>
              <input
                type="text"
                name="base_price"
                value={form.base_price}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tax Rate (%)
              </label>
              <input
                type="text"
                name="tax_rate"
                value={form.tax_rate}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Tax Value{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (auto)
                </span>
              </label>
              <input
                type="text"
                value={form.tax_value}
                readOnly
                className={readOnlyCls}
                placeholder="—"
              />
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Total Fees{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (auto)
                </span>
              </label>
              <input
                type="text"
                value={form.total_fees}
                readOnly
                className={readOnlyCls}
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Discount Type
              </label>
              <SelectField
                options={discountTypeOptions}
                value={
                  discountTypeOptions.find(
                    (o) => o.value === form.discount_type,
                  ) || discountTypeOptions[0]
                }
                onChange={(selected) =>
                  setForm((prev) => ({
                    ...prev,
                    discount_type: selected?.value || "not applicable",
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Discount %
                {!isPercentageDiscount && (
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    (n/a)
                  </span>
                )}
              </label>
              <input
                type="text"
                name="discount_percentage"
                value={form.discount_percentage}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                disabled={!isPercentageDiscount}
                className={isPercentageDiscount ? inputCls : readOnlyCls}
                placeholder={isPercentageDiscount ? "0" : "—"}
              />
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Discount Value
                {isPercentageDiscount && (
                  <span className="text-xs text-gray-400 font-normal">
                    (auto)
                  </span>
                )}
                {!isDiscountApplicable && (
                  <span className="text-xs text-gray-400 font-normal">
                    (n/a)
                  </span>
                )}
              </label>
              <input
                type="text"
                name="discount_value"
                value={form.discount_value}
                readOnly={!isFlatDiscount}
                onKeyPress={isFlatDiscount ? handleNumberKeyPress : undefined}
                onChange={isFlatDiscount ? handleFlatDiscountChange : undefined}
                className={isFlatDiscount ? inputCls : readOnlyCls}
                placeholder={isFlatDiscount ? "0" : "—"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Final Fees{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (auto)
                </span>
              </label>
              <input
                type="text"
                value={form.fees}
                readOnly
                className={`${readOnlyCls} font-semibold text-gray-700 dark:text-gray-200`}
                placeholder="—"
              />
            </div>
          </div>

          {Number(form.base_price) > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Base <strong>{form.base_price}</strong>
              </span>
              <span>
                + Tax <strong>{form.tax_value || 0}</strong>
              </span>
              <span>
                = Total <strong>{form.total_fees || 0}</strong>
              </span>
              {isDiscountApplicable && (
                <span>
                  − Discount <strong>{form.discount_value || 0}</strong>
                </span>
              )}
              <span className="font-bold">
                = Final <strong>{form.fees || 0}</strong>
              </span>
            </div>
          )}
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Options */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
            Options
          </h3>
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.partial_payment_allowed}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  partial_payment_allowed: e.target.checked,
                }))
              }
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            Partial payment allowed
          </label>
        </section>
      </form>
    </Modal>
  );
};

const OrderStatusModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const { orderStatusOptions } = ConstantOptions();
  const [form, setForm] = useState({
    status: (order?.status || "created").toString().toLowerCase(),
    remark: order?.remark || "",
  });

  const inputCls =
    "w-full px-3 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Status · ${order?.order_name || ""}`}
      icon={RefreshCw}
      size="md"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="order-status-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          {isSubmitting ? "Updating..." : "Update Status"}
        </button>
      }
    >
      <form
        id="order-status-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Status
          </label>
          <SelectField
            options={orderStatusOptions}
            value={
              orderStatusOptions.find(
                (option) => option.value === form.status,
              ) || orderStatusOptions[0]
            }
            onChange={(selected) =>
              setForm((prev) => ({
                ...prev,
                status: selected?.value || "created",
              }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Remark
          </label>
          <textarea
            value={form.remark}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, remark: e.target.value }))
            }
            rows={4}
            placeholder="Add a status note..."
            className={inputCls}
          />
        </div>
      </form>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function Orders() {
  const { orderStatusOptions, paymentStatusOptions } = ConstantOptions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive active tab from URL ?tab= param
  const tabFromUrl = searchParams.get("tab") || "all";
  const activeTab = TAB_CONFIG.find((t) => t.key === tabFromUrl) ? tabFromUrl : "all";
  const activeTabConfig = TAB_CONFIG.find((t) => t.key === activeTab);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ date: new Date().toISOString().split('T')[0] });
  const [staffFilter, setStaffFilter] = useState("");
  const [partialPaymentFilter, setPartialPaymentFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Staff
  const [allStaff, setAllStaff] = useState([]);

  // Services (for update order modal)
  const [allServices, setAllServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [updateOrderModalOpen, setUpdateOrderModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  /* ─── Data Fetching ─── */
  const staffFetchedRef = useRef(false);
  const servicesFetchedRef = useRef(false);

  const ensureStaffFetched = async () => {
    if (!staffFetchedRef.current) {
      setStaffLoading(true);
      try {
        const res = await apiCall("/api/admin/staff/list", "GET");
        const data = await res.json();
        if (data.success) {
          setAllStaff(data.data.staffs);
          staffFetchedRef.current = true;
        }
      } catch (err) {
        console.error("Failed to fetch staff", err);
      } finally {
        setStaffLoading(false);
      }
    }
  };

  const ensureServicesFetched = async () => {
    if (!servicesFetchedRef.current) {
      setServicesLoading(true);
      try {
        const res = await apiCall("/api/admin/services/list?limit=100", "GET");
        const data = await res.json();
        if (data.success) {
          setAllServices(data.data.services || []);
          servicesFetchedRef.current = true;
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
      } finally {
        setServicesLoading(false);
      }
    }
  };

  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      const res = await apiCall(`/api/admin/orders/details/${orderId}`, "GET");
      const data = await res.json();
      if (data.success) {
        const o = data.data;
        return {
          ...o,
          name: o.order_name,
          assigned_staff: o.assigned_staff || [],
          payments: o.payments || [],
          documents: o.documents || [],
          base_price: Number(o.base_price),
          tax_rate: Number(o.tax_rate),
          tax_value: Number(o.tax_value),
          total_fees: Number(o.total_fees),
          discount_percentage: Number(o.discount_percentage),
          discount_value: Number(o.discount_value),
          fees: Number(o.fees),
          total_paid: Number(o.total_paid),
          due_amount: Number(o.due_amount),
        };
      }
    } catch (err) {
      console.error("Failed to fetch order details", err);
    }
    return null;
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Build query params: tab fixed params + user filters
      const tabParams = activeTabConfig?.getParams() || {};
      const params = new URLSearchParams();
      params.set("page_no", currentPage);
      params.set("limit", itemsPerPage);
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("status", statusFilter);
      if (staffFilter) params.set("staff_username", staffFilter);
      if (partialPaymentFilter) params.set("partial_payment_allowed", partialPaymentFilter);
      if (paymentStatusFilter) params.set("payment_status", paymentStatusFilter);
      Object.entries(tabParams).forEach(([k, v]) => params.set(k, v));

      // Add date filter only if the active tab is not 'today' (which has its own date logic)
      if (activeTab !== 'today' && dateFilter) {
        if (dateFilter.date) {
          params.set('date', dateFilter.date);
        } else if (dateFilter.month && dateFilter.year) {
          params.set('month', dateFilter.month);
          params.set('year', dateFilter.year);
        } else if (dateFilter.from_date && dateFilter.to_date) {
          params.set('from_date', dateFilter.from_date);
          params.set('to_date', dateFilter.to_date);
        }
      }

      const res = await apiCall(
        `/api/admin/orders/list?${params.toString()}`,
        "GET",
      );
      const data = await res.json();
      if (data.success) {
        // Map the API response to match component expectations
        const mappedOrders = data.data.orders.map((order) => ({
          ...order,
          // The API returns 'order_name' but components expect 'name'
          // We'll keep both for backward compatibility
          name: order.order_name,
          // Ensure arrays exist
          assigned_staff: order.assigned_staff || [],
          payments: order.payments || [],
          documents: order.documents || [],
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
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lastOrderFetchRef = useRef({
    page: null,
    search: null,
    status: null,
    date: null,
    staff: null,
    partialPayment: null,
    paymentStatus: null,
    limit: null,
    tab: null,
  });
  useEffect(() => {
    if (
      lastOrderFetchRef.current.page === currentPage &&
      lastOrderFetchRef.current.search === searchTerm &&
      lastOrderFetchRef.current.status === statusFilter &&
      lastOrderFetchRef.current.date === JSON.stringify(dateFilter) &&
      lastOrderFetchRef.current.staff === staffFilter &&
      lastOrderFetchRef.current.partialPayment === partialPaymentFilter &&
      lastOrderFetchRef.current.paymentStatus === paymentStatusFilter &&
      lastOrderFetchRef.current.limit === itemsPerPage &&
      lastOrderFetchRef.current.tab === activeTab
    )
      return;
    lastOrderFetchRef.current = {
      page: currentPage,
      search: searchTerm,
      status: statusFilter,
      date: JSON.stringify(dateFilter),
      staff: staffFilter,
      partialPayment: partialPaymentFilter,
      paymentStatus: paymentStatusFilter,
      limit: itemsPerPage,
      tab: activeTab,
    };
    fetchOrders();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    dateFilter,
    staffFilter,
    partialPaymentFilter,
    paymentStatusFilter,
    itemsPerPage,
    activeTab,
  ]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  /* ─── Modal Openers ─── */
  const openStaffModal = async (order) => {
    setSelectedOrder(order);
    setStaffModalOpen(true);
    ensureStaffFetched();
    const latest = await fetchOrderDetails(order.order_id);
    if (latest) setSelectedOrder(latest);
  };

  const openUpdateOrderModal = async (order) => {
    setSelectedOrder(order);
    setUpdateOrderModalOpen(true);
    ensureServicesFetched();
    const latest = await fetchOrderDetails(order.order_id);
    if (latest) setSelectedOrder(latest);
  };

  const openStatusModal = async (order) => {
    setSelectedOrder(order);
    setStatusModalOpen(true);
    const latest = await fetchOrderDetails(order.order_id);
    if (latest) setSelectedOrder(latest);
  };

  const openDocumentsPage = (order) => {
    navigate(`/documents/${order.order_id}`);
  };

  const handleDownloadStatement = async (order) => {
    let toastId;
    try {
      toastId = toast.loading("Generating statement...");
      const res = await apiCall(
        `/api/admin/orders/download-payments/${order.order_id}`,
        "GET",
      );
      const data = await res.json();
      if (data.success && data.data?.url) {
        const fileRes = await fetch(data.data.url);
        const blob = await fileRes.blob();
        const objectUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = data.data.filename || "statement.pdf";
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        toast.dismiss(toastId);
      } else {
        toast.error(data.message || "Failed to download statement", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error("Error downloading statement", err);
      toast.error("An error occurred while downloading", { id: toastId });
    }
  };

  /* ─── API Handlers ─── */
  const handleUpdateStaff = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall(
        "/api/admin/orders/assign/update",
        "PUT",
        payload,
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Staff assignments updated successfully");
        setStaffModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to update staff assignments");
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrder = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall(
        `/api/admin/orders/update/${selectedOrder.order_id}`,
        "PUT",
        payload,
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Order updated successfully");
        setUpdateOrderModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to update order");
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall(
        `/api/admin/orders/status/${selectedOrder.order_id}`,
        "PUT",
        payload,
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Order status updated successfully");
        setStatusModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Action Menu ─── */
  const getActions = (order) => {
    const hasAssignedStaff =
      order.assigned_staff && order.assigned_staff.length > 0;

    const actions = [
      {
        label: "View Details",
        icon: <Eye size={12} />,
        onClick: () => navigate(`/orders/${order.order_id}`),
        className:
          "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40",
      },
      {
        label: hasAssignedStaff ? "Manage Staff" : "Assign Staff",
        icon: hasAssignedStaff ? <Users size={12} /> : <UserPlus size={12} />,
        onClick: () => openStaffModal(order),
        className: hasAssignedStaff
          ? "text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40"
          : "text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50 dark:text-yellow-300 dark:hover:text-yellow-200 dark:hover:bg-yellow-950/40",
      },
      {
        label: "Update Order",
        icon: <Edit size={12} />,
        onClick: () => openUpdateOrderModal(order),
        className:
          "text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:text-indigo-200 dark:hover:bg-indigo-950/40",
      },
      {
        label: "Update Status",
        icon: <RefreshCw size={12} />,
        onClick: () => openStatusModal(order),
        className:
          "text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-300 dark:hover:text-red-200 dark:hover:bg-red-950/40",
      },
      {
        label: "Upload Docs",
        icon: <Upload size={12} />,
        onClick: () =>
          navigate(`/orders/${order.order_id}/upload-documents`, {
            state: { order },
          }),
        className:
          "text-purple-700 hover:text-purple-800 hover:bg-purple-50 dark:text-purple-300 dark:hover:text-purple-200 dark:hover:bg-purple-950/40",
      },
      {
        label: "Documents",
        icon: <FileText size={12} />,
        onClick: () => openDocumentsPage(order),
        className:
          "text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40",
      },
      {
        label: "Download Statement",
        icon: <Download size={12} />,
        onClick: () => handleDownloadStatement(order),
        className:
          "text-teal-700 hover:text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:text-teal-200 dark:hover:bg-teal-950/40",
      },
    ];

    return actions;
  };

  /* ─── Table Columns ─── */
  const columns = [
    {
      key: "serial_no",
      label: "#",
      className: "w-[40px] !max-w-[40px]",
      headerClassName: "w-[40px]",
      render: (_row, index) => (
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </span>
      ),
    },
    {
      key: "create_date",
      label: "Date",
      className: "w-[110px] !max-w-[110px]",
      headerClassName: "w-[110px]",
      render: (row) => (
        <div className="leading-snug">
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
            {new Date(row.create_date).toLocaleDateString("en-GB")}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
            {row.order_id}
          </p>
        </div>
      ),
    },
    {
      key: "service_name",
      label: "Service",
      className: "min-w-[120px]",
      headerClassName: "min-w-[120px]",
      render: (row) => (
        <div className="leading-snug">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {row.service_name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatCurrency(row.fees)}
          </p>
        </div>
      ),
    },
    {
      key: "firm",
      label: "Firm",
      className: "min-w-[110px]",
      headerClassName: "min-w-[110px]",
      render: (row) =>
        row.firm_name ? (
          <div className="leading-snug">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {row.firm_name}
            </p>
            {row.firm_pan_no && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {row.firm_pan_no}
              </p>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
        ),
    },
    {
      key: "client",
      label: "Client",
      className: "min-w-[120px]",
      headerClassName: "min-w-[120px]",
      render: (row) => (
        <div className="leading-snug">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {row.client_name || row.client_username}
          </p>
          {row.client_mobile && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {row.client_mobile}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "assigned_staff",
      label: "Staff",
      className: "w-[70px] !max-w-[70px]",
      headerClassName: "w-[70px]",
      render: (row) =>
        row.assigned_staff && row.assigned_staff.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openStaffModal(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/50 cursor-pointer"
          >
            <Users size={11} /> {row.assigned_staff.length}
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openStaffModal(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/50 cursor-pointer"
          >
            <UserPlus size={11} /> 0
          </button>
        ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-[120px] !max-w-[120px]",
      headerClassName: "w-[120px]",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const switchTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setCurrentPage(1);
    setDateFilter({ date: new Date().toISOString().split('T')[0] });
    setStaffFilter("");
    setPartialPaymentFilter("");
    setPaymentStatusFilter("");
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter(null);
    setStaffFilter("");
    setPartialPaymentFilter("");
    setPaymentStatusFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter ||
    dateFilter ||
    staffFilter ||
    partialPaymentFilter ||
    paymentStatusFilter;

  /* ─── Render ─── */
  return (
    <ManagementHub
      title={activeTabConfig?.label ?? "All Orders"}
      description="Manage and track all client orders in the system."
      accent="indigo"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="space-y-4">

        {/* ── Tab Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1 overflow-x-auto bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 shadow-sm dark:shadow-gray-950/30 no-scrollbar"
        >
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                  ? "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
              >
                <Icon size={14} className={isActive ? "text-indigo-500 dark:text-indigo-400" : ""} />
                {tab.label}
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {isActive && totalOrders > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300">
                    {totalOrders}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        <div className="space-y-3">
          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap xl:flex-nowrap items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-gray-950/30"
          >
            {/* Search */}
            <div className="relative flex-[1.5] min-w-[180px] lg:max-w-md w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={16}
              />
              <input
                type="text"
                placeholder={`Search ${activeTabConfig?.label?.toLowerCase() ?? "orders"}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm h-[42px]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Order Status */}
            <div className="flex-1 min-w-[130px] w-full lg:w-auto">
              <SelectField
                options={orderStatusOptions}
                value={
                  orderStatusOptions.find(
                    (option) => option.value === statusFilter,
                  ) || null
                }
                onChange={(selected) => {
                  setStatusFilter(selected?.value || "");
                  setCurrentPage(1);
                }}
                placeholder="Order Status"
                isClearable
              />
            </div>

            {/* Payment Status */}
            <div className="flex-1 min-w-[130px] w-full lg:w-auto">
              <SelectField
                options={paymentStatusOptions}
                value={
                  paymentStatusOptions.find(
                    (option) => option.value === paymentStatusFilter,
                  ) || null
                }
                onChange={(selected) => {
                  setPaymentStatusFilter(selected?.value || "");
                  setCurrentPage(1);
                }}
                placeholder="Payment Status"
                isClearable
              />
            </div>

            {/* Partial Payment */}
            <div className="flex-1 min-w-[130px] w-full lg:w-auto">
              <SelectField
                options={[
                  { value: "true", label: "Allowed" },
                  { value: "false", label: "Not Allowed" },
                ]}
                value={
                  [
                    { value: "true", label: "Allowed" },
                    { value: "false", label: "Not Allowed" },
                  ].find((option) => option.value === partialPaymentFilter) || null
                }
                onChange={(selected) => {
                  setPartialPaymentFilter(selected?.value || "");
                  setCurrentPage(1);
                }}
                placeholder="Partial Payment"
                isClearable
              />
            </div>

            {/* Staff Username */}
            <div className="flex-[1.5] min-w-[160px] lg:max-w-md w-full lg:w-auto">
              <AsyncSelectField
                fetchUrl="/api/admin/staff/list"
                dataKey="staffs"
                labelKey="username"
                valueKey="username"
                value={staffFilter}
                onChange={(val) => {
                  setStaffFilter(val || "");
                  setCurrentPage(1);
                }}
                placeholder="Staff Username"
                formatOptionLabel={(option) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{option.username}</span>
                    {option.email && (
                      <span className="text-[10px] text-gray-500">
                        {option.email}
                      </span>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Date */}
            {activeTab !== "today" && (
              <div className="flex-none w-full lg:w-auto">
                <AdvancedDateFilter
                  value={dateFilter}
                  onChange={(val) => {
                    setDateFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Date or range"
                  tabOptions={["date", "month", "range"]}
                  showDateStepper
                  buttonClassName="h-[42px] w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 outline-none transition-all"
                />
              </div>
            )}

            {/* Clear All & Count */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end xl:flex-shrink-0">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors whitespace-nowrap"
                >
                  <X size={14} /> Clear
                </button>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {totalOrders}
                </span>{" "}
                orders
              </p>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && <PageContentSkeleton rows={6} columns={6} />}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50"
            >
              <Briefcase
                className="text-gray-300 dark:text-gray-600 mx-auto mb-4"
                size={64}
              />
              <p className="text-xl text-gray-500 dark:text-gray-400">
                {activeTabConfig?.emptyLabel ?? "No orders found"}
              </p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Nothing to show here"}
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
                className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50"
              >
                <ManagementTable
                  columns={columns}
                  rows={orders}
                  rowKey="order_id"
                  accent="indigo"
                  getActions={getActions}
                  onRowClick={(row) => navigate(`/orders/${row.order_id}`)}
                  rowClassName={(row) => getRowHighlightClass(row)}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4"
              >
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

      {/* ── STAFF MANAGEMENT MODAL ── */}
      <AnimatePresence>
        {staffModalOpen && selectedOrder && (
          <StaffManagementModal
            order={selectedOrder}
            allStaff={allStaff}
            staffLoading={staffLoading}
            onClose={() => {
              setStaffModalOpen(false);
              setSelectedOrder(null);
            }}
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
            services={allServices}
            servicesLoading={servicesLoading}
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
