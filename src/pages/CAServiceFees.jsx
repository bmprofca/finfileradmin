import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Plus,
  Trash2,
  Tag,
  Layers,
  Edit2,
  Eye,
  CheckSquare,
  Square,
  Calendar,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import { PageContentSkeleton } from "../components/SkeletonComponent";
import Modal from "../components/common/Modal";
import SelectField from "../components/common/SelectField";
import apiCall from "../utils/apiCall";
import ManagementTable from "../components/common/ManagementTable";
import ActionCard from "../components/common/ActionCard";

const inputCls =
  "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm dark:text-gray-100";

const SERVICES_PAGE_LIMIT = 10;

/* ─────────────────────────────────────────────
   Add Service Fee Modal
───────────────────────────────────────────── */
const AddServiceFeeModal = ({ username, existingServiceIds, onClose, onSuccess }) => {
  const [rows, setRows] = useState([{ service: null, fees: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [servicePage, setServicePage] = useState(0);
  const [serviceTotalPages, setServiceTotalPages] = useState(1);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const fetchServicesPage = async (pageNo) => {
    if (isLoadingServices) return;
    setIsLoadingServices(true);
    try {
      const response = await apiCall(
        `/api/admin/services/list?page_no=${pageNo}&limit=${SERVICES_PAGE_LIMIT}`,
        "GET"
      );
      const json = await response.json();
      if (json.success) {
        const newOptions = (json.data.services || []).map((s) => ({
          value: s.service_id,
          label: s.name,
          type: s.type,
        }));
        setServiceOptions((prev) => (pageNo === 1 ? newOptions : [...prev, ...newOptions]));
        setServiceTotalPages(json.data.pagination?.total_pages || 1);
        setServicePage(pageNo);
      } else {
        toast.error(json.message || "Failed to load services");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServicesPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleServicesMenuScrollToBottom = () => {
    if (isLoadingServices || servicePage >= serviceTotalPages) return;
    fetchServicesPage(servicePage + 1);
  };

  const addRow = () => setRows((r) => [...r, { service: null, fees: "" }]);
  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));
  const updateRow = (idx, key, value) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));

  const takenIds = useMemo(() => {
    const ids = new Set(existingServiceIds || []);
    rows.forEach((r) => r.service && ids.add(r.service.value));
    return ids;
  }, [existingServiceIds, rows]);

  const optionsForRow = (idx) =>
    serviceOptions.filter(
      (opt) => !takenIds.has(opt.value) || rows[idx].service?.value === opt.value
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const services = rows
      .filter((r) => r.service && r.fees !== "")
      .map((r) => ({ id: r.service.value, fees: Number(r.fees) }));

    if (services.length === 0) {
      toast.error("Select at least one service and enter a fee");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiCall("/api/admin/ca-service-fees/create", "POST", {
        username,
        services,
      });
      const json = await response.json();
      if (json.success) {
        toast.success("Service fee(s) added successfully");
        onSuccess();
      } else {
        toast.error(json.message || "Failed to add service fee(s)");
      }
    } catch {
      toast.error("Error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add Service Fees"
      icon={Plus}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="add-service-fee-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 dark:hover:bg-violet-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Fee(s)"}
        </button>
      }
    >
      <form id="add-service-fee-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pick a service and enter the fee amount for each row. Scroll to the bottom of the
          service list to load more. Add more rows to assign several services at once.
        </p>
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Service *
                </label>
                <SelectField
                  options={optionsForRow(idx)}
                  value={row.service}
                  onChange={(option) => updateRow(idx, "service", option)}
                  onMenuScrollToBottom={handleServicesMenuScrollToBottom}
                  isLoading={isLoadingServices && idx === rows.length - 1}
                  placeholder="Select a service"
                  isClearable
                  formatOptionLabel={(opt) => (
                    <div className="flex items-center justify-between gap-2">
                      <span>{opt.label}</span>
                      {opt.type && (
                        <span className="text-xs text-gray-400">{opt.type}</span>
                      )}
                    </div>
                  )}
                />
              </div>
              <div className="w-36">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Fee (₹) *
                </label>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  pattern="^\d*\.?\d*$"
                  value={row.fees}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      updateRow(idx, 'fees', val);
                    }
                  }}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={rows.length === 1}
                className="mb-0.5 h-[42px] w-[42px] shrink-0 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
        >
          <Plus size={16} /> Add another service
        </button>
      </form>
    </Modal>
  );
};

/* ─────────────────────────────────────────────
   View Details Modal
───────────────────────────────────────────── */
const ViewDetailsModal = ({ fee, onClose, onEdit, onDelete }) => {
  if (!fee) return null;
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Service Fee Details"
      icon={Eye}
      size="md"
      contentClassName="p-5"
      closeText="Close"
      footer={
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onClose(); onDelete(fee.ca_fee_id); }}
            className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-100 transition-all border border-red-200 dark:border-red-800/50 flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={() => { onClose(); onEdit(fee); }}
            className="px-4 py-2 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 transition-all flex items-center gap-1.5"
          >
            <Edit2 size={14} /> Edit Fee
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-sm shrink-0">
            <Tag size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">
              {fee.service_name || "—"}
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mt-1">
              <Layers size={10} /> {fee.service_type || "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Fee Amount
            </p>
            <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">
              ₹{fee.fees ?? "—"}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar size={11} /> Last Modified
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {fee.modify_date ? new Date(fee.modify_date).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric"
              }) : "—"}
            </p>
          </div>
        </div>

        {fee.ca_fee_id && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            ID: {fee.ca_fee_id}
          </p>
        )}
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────
   Edit Fee Modal
───────────────────────────────────────────── */
const EditFeeModal = ({ fee, onClose, onSuccess }) => {
  const [feeValue, setFeeValue] = useState(fee?.fees ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiCall("/api/admin/ca-service-fees/update", "PUT", [
        { ca_fee_id: fee.ca_fee_id, fees: Number(feeValue) },
      ]);
      const json = await response.json();
      if (json.success) {
        toast.success("Service fee updated");
        onSuccess();
      } else {
        toast.error(json.message || "Failed to update service fee");
      }
    } catch {
      toast.error("Error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Edit Fee · ${fee?.service_name || ""}`}
      icon={Edit2}
      size="sm"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="edit-fee-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      }
    >
      <form id="edit-fee-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <Tag size={16} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {fee?.service_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{fee?.service_type}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Fee Amount (₹) *
          </label>
          <input
            required
            type="text"
            inputMode="decimal"
            pattern="^\d*\.?\d*$"
            value={feeValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setFeeValue(val);
              }
            }}
            placeholder="Enter fee"
            className={inputCls}
            autoFocus
          />
        </div>
        {fee?.fees !== undefined && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Current fee: <span className="font-semibold text-gray-600 dark:text-gray-300">₹{fee.fees}</span>
          </p>
        )}
      </form>
    </Modal>
  );
};


/* ─────────────────────────────────────────────
   Bulk Edit Fee Modal
───────────────────────────────────────────── */
const BulkEditFeeModal = ({ feesToEdit, onClose, onSuccess }) => {
  const [values, setValues] = useState(
    () => Object.fromEntries(feesToEdit.map((f) => [f.ca_fee_id, String(f.fees ?? "")]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = (ca_fee_id, val) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setValues((v) => ({ ...v, [ca_fee_id]: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = feesToEdit
      .filter((f) => values[f.ca_fee_id] !== "")
      .map((f) => ({ ca_fee_id: f.ca_fee_id, fees: Number(values[f.ca_fee_id]) }));

    if (payload.length === 0) {
      toast.error("Enter at least one fee amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiCall("/api/admin/ca-service-fees/update", "PUT", payload);
      const json = await response.json();
      if (json.success) {
        toast.success(`Updated ${payload.length} service fee${payload.length > 1 ? "s" : ""}`);
        onSuccess();
      } else {
        toast.error(json.message || "Failed to update service fee(s)");
      }
    } catch {
      toast.error("Error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Edit Fees (${feesToEdit.length})`}
      icon={Edit2}
      size="lg"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="bulk-edit-fee-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      }
    >
      <form id="bulk-edit-fee-form" onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {feesToEdit.map((fee) => (
          <div
            key={fee.ca_fee_id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {fee.service_name || "—"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fee.service_type || "—"}</p>
            </div>
            <div className="w-32 shrink-0">
              <input
                required
                type="text"
                inputMode="decimal"
                pattern="^\d*\.?\d*$"
                value={values[fee.ca_fee_id]}
                onChange={(e) => updateValue(fee.ca_fee_id, e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
        ))}
      </form>
    </Modal>
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function CAServiceFees() {
  const { username } = useParams();

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  // Modal state for individual row actions
  const [viewFee, setViewFee] = useState(null);
  const [editFee, setEditFee] = useState(null);
  const [deleteFeeId, setDeleteFeeId] = useState(null);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/admin/ca-service-fees/service-fees/${username}`, "GET");
      const data = await response.json();
      if (data.success) {
        setFees(data.data || []);
        setSelected(new Set());
      } else {
        toast.error(data.message || "Failed to fetch service fees");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFees();
  };

  const toggleSelect = (ca_fee_id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(ca_fee_id)) next.delete(ca_fee_id);
      else next.add(ca_fee_id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((s) => (s.size === fees.length ? new Set() : new Set(fees.map((f) => f.ca_fee_id))));
  };

  const openDeleteModal = (ca_fee_id) => {
    setDeleteFeeId(ca_fee_id);
    setSelected(new Set([ca_fee_id]));
    setIsDeleteModalOpen(true);
  };

  const openBulkDeleteModal = () => {
    if (selected.size === 0) return;
    setDeleteFeeId(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const ids = deleteFeeId ? [deleteFeeId] : Array.from(selected);
    setIsDeleting(true);
    try {
      const response = await apiCall("/api/admin/ca-service-fees/delete", "DELETE", ids);
      const json = await response.json();
      if (json.success) {
        toast.success(`Deleted ${ids.length} service fee${ids.length > 1 ? "s" : ""}`);
        setIsDeleteModalOpen(false);
        setDeleteFeeId(null);
        fetchFees();
      } else {
        toast.error(json.message || "Failed to delete service fee(s)");
      }
    } catch {
      toast.error("Error connecting to server.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <PageContentSkeleton rows={4} columns={2} />
      </div>
    );
  }

  const allSelected = fees.length > 0 && selected.size === fees.length;
  const deleteCount = deleteFeeId ? 1 : selected.size;

  return (
    <div className="space-y-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Service Fees</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage service fees for @{username}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 text-sm py-1.5"
            disabled={refreshing}
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 text-sm py-1.5 bg-violet-600 hover:bg-violet-700"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Fee</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-wrap items-center justify-between gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-lg px-4 py-3"
            >
              <span className="text-sm font-medium text-violet-800 dark:text-violet-300">
                {selected.size} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold hover:bg-violet-200 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800/50 transition-colors"
                >
                  <Edit2 size={14} /> Edit Selected
                </button>
                <button
                  onClick={openBulkDeleteModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 transition-colors"
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table / Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {fees.length === 0 ? (
            <div className="max-w-md mx-auto py-12">
              <ActionCard
                icon={<DollarSign size={24} className="text-white" />}
                title="No service fees yet"
                description="This CA doesn't have any service fees configured. Add one to get started."
                buttonText="Add Fee"
                onClick={() => setIsAddModalOpen(true)}
                gradient="indigo"
              />
            </div>
          ) : (
            <ManagementTable
              rows={fees}
              columns={[
                {
                  key: "select",
                  label: (
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {allSelected ? (
                        <CheckSquare size={14} className="text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  ),
                  className: "w-10 !max-w-[40px]",
                  headerClassName: "w-10",
                  render: (row) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(row.ca_fee_id);
                      }}
                      className="flex items-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {selected.has(row.ca_fee_id) ? (
                        <CheckSquare size={14} className="text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  ),
                },
                {
                  key: "service_name",
                  label: "Service",
                  render: (row) => (
                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                      <Tag size={14} className="text-gray-400" />
                      {row.service_name || "—"}
                    </div>
                  ),
                },
                {
                  key: "service_type",
                  label: "Type",
                  render: (row) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <Layers size={10} /> {row.service_type || "—"}
                    </span>
                  ),
                },
                {
                  key: "fees",
                  label: "Fee (₹)",
                  render: (row) => (
                    <span className="text-base font-bold text-violet-700 dark:text-violet-400">
                      ₹{row.fees ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "modify_date",
                  label: "Last Modified",
                  render: (row) => (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {row.modify_date
                        ? new Date(row.modify_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "—"}
                    </span>
                  ),
                },
              ]}
              rowKey="ca_fee_id"
              getActions={(row) => [
                {
                  label: "View Details",
                  icon: <Eye size={14} />,
                  onClick: () => setViewFee(row),
                },
                {
                  label: "Edit Fee",
                  icon: <Edit2 size={14} />,
                  onClick: () => setEditFee(row),
                },
                {
                  label: "Delete",
                  icon: <Trash2 size={14} />,
                  onClick: () => openDeleteModal(row.ca_fee_id),
                  className: "text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
                },
              ]}
              activeId={activeMenuId}
              onToggleAction={(e, id) => setActiveMenuId(prev => prev === id ? null : id)}
              accent="violet"
              rowClassName={(row) =>
                selected.has(row.ca_fee_id) ? "!bg-violet-50/60 dark:!bg-violet-900/10" : ""
              }
            />
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddServiceFeeModal
            username={username}
            existingServiceIds={fees.map((f) => f.service_id)}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              setIsAddModalOpen(false);
              fetchFees();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isBulkEditModalOpen && (
          <BulkEditFeeModal
            feesToEdit={fees.filter((f) => selected.has(f.ca_fee_id))}
            onClose={() => setIsBulkEditModalOpen(false)}
            onSuccess={() => {
              setIsBulkEditModalOpen(false);
              fetchFees();
            }}
          />
        )}
      </AnimatePresence>
      {/* View Details Modal */}
      <AnimatePresence>
        {viewFee && (
          <ViewDetailsModal
            fee={viewFee}
            onClose={() => setViewFee(null)}
            onEdit={(fee) => setEditFee(fee)}
            onDelete={(id) => openDeleteModal(id)}
          />
        )}
      </AnimatePresence>

      {/* Edit Fee Modal */}
      <AnimatePresence>
        {editFee && (
          <EditFeeModal
            fee={editFee}
            onClose={() => setEditFee(null)}
            onSuccess={() => {
              setEditFee(null);
              fetchFees();
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && (setIsDeleteModalOpen(false), setDeleteFeeId(null))}
            title="Delete Service Fee(s)"
            icon={Trash2}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : `Yes, Delete${deleteCount > 1 ? ` (${deleteCount})` : ""}`}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{" "}
              {deleteCount > 1 ? `these ${deleteCount} service fees` : "this service fee"}? This
              action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}