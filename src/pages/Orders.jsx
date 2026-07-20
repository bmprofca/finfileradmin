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
  CheckCircle,
  Activity,
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

import CAManagementModal from "../components/orders/CAManagementModal";
import StaffManagementModal from "../components/orders/StaffManagementModal";
import OrderUpdateModal from "../components/orders/OrderUpdateModal";
import OrderStatusModal from "../components/orders/OrderStatusModal";
import CaStatusModal from "../components/orders/CaStatusModal";


/* ─── Tab Configuration ─── */
const getTodayISO = () => new Date().toISOString().split("T")[0];

const TAB_CONFIG = [
  {
    key: "unassigned",
    label: "Unassigned",
    icon: UserPlus,
    getParams: () => ({ assigned: false }),
    emptyLabel: "No unassigned orders found",
  },

  {
    key: "assigned",
    label: "Assigned",
    icon: Users,
    getParams: () => ({ assigned: true }),
    emptyLabel: "No assigned orders found",
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
  {
    key: "all",
    label: "All Orders",
    icon: List,
    getParams: () => ({}),
    emptyLabel: "No orders found",
  },
];

/* ─── CA Status Options (for bulk update) ─── */
const CA_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
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

/* ─── CA Status Badge (compact, used inside the CA table cell) ─── */
const CA_STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
};

const CaStatusBadge = ({ status }) => {
  if (!status) return null;
  const key = status.toString().toLowerCase();
  const cls =
    CA_STATUS_COLORS[key] ||
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  const display = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <span
      className={`inline-block px-1.5 py-[1px] rounded-full text-[10px] font-semibold border ${cls}`}
    >
      {display}
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


/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function Orders() {
  const { orderStatusOptions, paymentStatusOptions } = ConstantOptions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive active tab from URL ?tab= param
  const tabFromUrl = searchParams.get("tab") || "unassigned";
  const activeTab = TAB_CONFIG.find((t) => t.key === tabFromUrl) ? tabFromUrl : "unassigned";
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
  const [caModalOpen, setCaModalOpen] = useState(false);
  const [updateOrderModalOpen, setUpdateOrderModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [caStatusModalOpen, setCaStatusModalOpen] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bulk CA status selection
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

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
          ca_fees: Number(o.ca_fees || 0),
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
          ca_fees: Number(order.ca_fees || 0),
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

  // Clear bulk selection whenever the visible order set changes
  useEffect(() => {
    setSelectedOrderIds([]);
  }, [currentPage, activeTab, itemsPerPage]);

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

  const openCaModal = async (order) => {
    setSelectedOrder(order);
    setCaModalOpen(true);
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

  const openCaStatusModal = (order) => {
    setSelectedOrder(order);
    setCaStatusModalOpen(true);
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

  // Assign CA + CA fees in a single call
  const handleUpdateCa = async (payload) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await apiCall(
        "/api/admin/orders/assign-ca",
        "PUT",
        payload,
      );
      const data = await res.json();
      if (data.success) {
        toast.success("CA assigned successfully");
        setCaModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to assign CA");
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

  /* ─── Bulk CA Status Update ─── */
  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const toggleSelectAllOnPage = () => {
    const pageOrderIds = orders.map((o) => o.order_id);
    const allSelected = pageOrderIds.every((id) =>
      selectedOrderIds.includes(id),
    );
    if (allSelected) {
      setSelectedOrderIds((prev) =>
        prev.filter((id) => !pageOrderIds.includes(id)),
      );
    } else {
      setSelectedOrderIds((prev) =>
        Array.from(new Set([...prev, ...pageOrderIds])),
      );
    }
  };

  const clearSelection = () => setSelectedOrderIds([]);

  // Shared caller for PUT /api/admin/orders/ca-status, used by both the
  // bulk selection bar and the single-order "Update CA Status" action.
  const performCaStatusUpdate = async (orderIds, caStatus) => {
    try {
      const res = await apiCall("/api/admin/orders/ca-status", "PUT", {
        ca_status: caStatus,
        order_ids: orderIds,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          orderIds.length > 1
            ? `CA status updated for ${orderIds.length} order(s)`
            : "CA status updated successfully",
        );
        fetchOrders();
        return true;
      }
      toast.error(data.message || "Failed to update CA status");
      return false;
    } catch (e) {
      toast.error("An error occurred. Please try again.");
      return false;
    }
  };

  const handleBulkCaStatusUpdate = async (caStatus) => {
    if (selectedOrderIds.length === 0 || !caStatus) return;
    setBulkUpdating(true);
    const ok = await performCaStatusUpdate(selectedOrderIds, caStatus);
    if (ok) setSelectedOrderIds([]);
    setBulkUpdating(false);
  };

  const handleUpdateSingleCaStatus = async (caStatus) => {
    if (!selectedOrder) return;
    setSaving(true);
    const ok = await performCaStatusUpdate([selectedOrder.order_id], caStatus);
    if (ok) {
      setCaStatusModalOpen(false);
      setSelectedOrder(null);
    }
    setSaving(false);
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
        label: order.ca ? "Manage CA" : "Assign CA",
        icon: <Briefcase size={12} />,
        onClick: () => openCaModal(order),
        className: order.ca
          ? "text-violet-700 hover:text-violet-800 hover:bg-violet-50 dark:text-violet-300 dark:hover:text-violet-200 dark:hover:bg-violet-950/40"
          : "text-orange-700 hover:text-orange-800 hover:bg-orange-50 dark:text-orange-300 dark:hover:text-orange-200 dark:hover:bg-orange-950/40",
      },
      ...(order.ca
        ? [
          {
            label: "Update CA Status",
            icon: <Activity size={12} />,
            onClick: () => openCaStatusModal(order),
            className:
              "text-fuchsia-700 hover:text-fuchsia-800 hover:bg-fuchsia-50 dark:text-fuchsia-300 dark:hover:text-fuchsia-200 dark:hover:bg-fuchsia-950/40",
          },
        ]
        : []),
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
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={
            orders.length > 0 &&
            orders.every((o) => selectedOrderIds.includes(o.order_id))
          }
          onChange={toggleSelectAllOnPage}
          className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      ),
      className: "w-[40px] !max-w-[40px] !px-2 text-center",
      headerClassName: "w-[40px] !px-2 text-center",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedOrderIds.includes(row.order_id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleOrderSelection(row.order_id)}
          className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      ),
    },
    {
      key: "serial_no",
      label: "#",
      className: "w-[48px] !max-w-[48px] !px-2 text-center",
      headerClassName: "w-[48px] !px-2 text-center",
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
      className: "w-[20%] min-w-[160px]",
      headerClassName: "w-[20%] min-w-[160px]",
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
      className: "w-[15%] min-w-[140px]",
      headerClassName: "w-[15%] min-w-[140px]",
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
      className: "w-[15%] min-w-[140px]",
      headerClassName: "w-[15%] min-w-[140px]",
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
      key: "ca",
      label: "CA",
      className: "w-[15%] min-w-[150px]",
      headerClassName: "w-[15%] min-w-[150px]",
      render: (row) =>
        row.ca ? (
          <div className="leading-snug">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openCaModal(row);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700 dark:hover:bg-violet-900/50 cursor-pointer max-w-[130px]"
              title={row.ca.name || row.ca.username}
            >
              <Briefcase size={11} className="shrink-0" />
              <span className="truncate">{row.ca.name || row.ca.username}</span>
            </button>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatCurrency(row.ca_fees)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCaStatusModal(row);
                }}
                title="Update CA status"
                className="cursor-pointer"
              >
                <CaStatusBadge status={row.ca_status} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openCaModal(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-900/50 cursor-pointer"
          >
            <UserPlus size={11} /> Assign
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
    setSelectedOrderIds([]);
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

        {/* ── Bulk CA Status Action Bar ── */}
        <AnimatePresence>
          {selectedOrderIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="flex flex-wrap items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3"
            >
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex-1 min-w-[180px] max-w-xs">
                <SelectField
                  options={CA_STATUS_OPTIONS}
                  value={null}
                  onChange={(selected) =>
                    selected && handleBulkCaStatusUpdate(selected.value)
                  }
                  placeholder={bulkUpdating ? "Updating..." : "Set CA status..."}
                  isDisabled={bulkUpdating}
                />
              </div>
              <button
                onClick={clearSelection}
                disabled={bulkUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <X size={14} /> Clear selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            <div className="flex-1 whitespace-nowrap min-w-[130px] w-full lg:w-auto">
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
            <div className="flex-1 whitespace-nowrap min-w-[130px] w-full lg:w-auto">
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
            <div className="flex-1 whitespace-nowrap min-w-[130px] w-full lg:w-auto">
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
                  placeholder="Select Date"
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

      {/* ─── CA MANAGEMENT MODAL ─── */}
      <AnimatePresence>
        {caModalOpen && selectedOrder && (
          <CAManagementModal
            order={selectedOrder}
            onClose={() => {
              setCaModalOpen(false);
              setSelectedOrder(null);
            }}
            onSubmit={handleUpdateCa}
            isSubmitting={saving}
          />
        )}
      </AnimatePresence>

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

      {/* ── UPDATE CA STATUS MODAL (single order) ── */}
      <AnimatePresence>
        {caStatusModalOpen && selectedOrder && (
          <CaStatusModal
            order={selectedOrder}
            onClose={() => {
              setCaStatusModalOpen(false);
              setSelectedOrder(null);
            }}
            onSubmit={handleUpdateSingleCaStatus}
            isSubmitting={saving}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}