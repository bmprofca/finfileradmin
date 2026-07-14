import React, { useState, useEffect } from "react";
import { Search, X, Briefcase, User, CheckCircle } from "lucide-react";
import Modal from "../common/Modal";
import apiCall from "../../utils/apiCall";
import toast from "react-hot-toast";

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

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

const CAManagementModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const [service, setService] = useState(null);
  const [cas, setCas] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedCa, setSelectedCa] = useState("");
  const [feesValue, setFeesValue] = useState("");
  const [initialCa, setInitialCa] = useState("");
  const [initialFees, setInitialFees] = useState("");

  useEffect(() => {
    if (!order?.order_id) return;
    let cancelled = false;

    const fetchAssignableCas = async () => {
      setLoading(true);
      try {
        const response = await apiCall(
          `/api/admin/orders/assignable-cas/${order.order_id}`,
          "GET"
        );
        const data = await response.json();
        if (cancelled) return;

        if (data.success) {
          const fetchedCas = data.data?.cas || [];
          const assignedCa = fetchedCas.find((c) => c.assigned);
          const currentUsername = assignedCa?.username || order?.ca?.username || "";

          const hasSavedFees =
            order?.ca && order?.ca_fees !== undefined && order?.ca_fees !== null;
          const currentFees = hasSavedFees
            ? String(order.ca_fees)
            : assignedCa?.fees === undefined || assignedCa?.fees === null
            ? ""
            : String(assignedCa.fees);

          setService(data.data?.service || null);
          setCas(fetchedCas);
          setSelectedCa(currentUsername);
          setFeesValue(currentFees);
          setInitialCa(currentUsername);
          setInitialFees(currentFees);
        } else {
          toast.error(data.message || "Failed to fetch assignable CAs");
        }
      } catch (e) {
        if (!cancelled) toast.error("Failed to fetch assignable CAs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAssignableCas();
    return () => {
      cancelled = true;
    };
  }, [order?.order_id]);

  const filteredCas = cas.filter((ca) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (ca.name || "").toLowerCase().includes(q) ||
      (ca.username || "").toLowerCase().includes(q)
    );
  });

  const handleToggle = (ca) => {
    if (selectedCa === ca.username) {
      setSelectedCa("");
      setFeesValue("");
    } else {
      setSelectedCa(ca.username);
      setFeesValue(
        ca.fees === undefined || ca.fees === null ? "" : String(ca.fees)
      );
    }
  };

  const handleClearSelection = () => {
    setSelectedCa("");
    setFeesValue("");
  };

  const handleSubmit = () => {
    const caChanged = (selectedCa || "") !== (initialCa || "");
    const feesNumber = feesValue === "" ? 0 : Number(feesValue);

    if (selectedCa === "") {
      onSubmit({ order_id: order.order_id, ca: null });
    } else if (caChanged) {
      onSubmit({ order_id: order.order_id, ca: selectedCa, ca_fees: feesNumber });
    } else {
      onSubmit({ order_id: order.order_id, ca_fees: feesNumber });
    }
  };

  const hasChanges =
    (selectedCa || "") !== (initialCa || "") ||
    (feesValue === "" ? "" : String(feesValue)) !==
      (initialFees === "" ? "" : String(initialFees));

  const selectedCaDetails = cas.find((c) => c.username === selectedCa);

  const SearchInput = ({ value, onChange, placeholder }) => (
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-gray-100 transition-all"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
          <X size={14} />
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Assign CA · ${order?.order_name || ""}`}
      icon={Briefcase}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleClearSelection}
            className="text-sm text-red-500 hover:text-red-600 font-medium px-2 py-1"
          >
            Clear Selection
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges}
            className="px-5 py-2.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 dark:hover:bg-violet-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Briefcase size={14} />
            {isSubmitting ? "Assigning..." : "Assign CA"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Search and select a Chartered Accountant eligible for this order.
        </p>

        {service && (
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {service.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Base Price {formatCurrency(service.base_price)}
              <span className="mx-1.5 opacity-50">•</span>
              Order Fees {formatCurrency(service.fees)}
            </p>
          </div>
        )}

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search CAs by name or username..."
        />

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
          <div className="max-h-80 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <StaffCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredCas.length > 0 ? (
              filteredCas.map((ca) => {
                const isSelected = selectedCa === ca.username;
                return (
                  <div
                    key={ca.username}
                    onClick={() => handleToggle(ca)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-50 border-violet-300 dark:bg-violet-900/30 dark:border-violet-600 shadow-sm"
                        : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected
                            ? "bg-violet-500 text-white"
                            : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {ca.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`font-medium text-sm truncate flex items-center gap-1.5 ${
                            isSelected
                              ? "text-violet-900 dark:text-violet-100"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {ca.name}
                          {ca.assigned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">
                              Currently Assigned
                            </span>
                          )}
                        </p>
                        <p
                          className={`text-xs truncate flex items-center gap-1 mt-0.5 ${
                            isSelected
                              ? "text-violet-600 dark:text-violet-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          @{ca.username}
                          <span className="mx-1 opacity-50">•</span>
                          Suggested {formatCurrency(ca.fees)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-violet-500 bg-violet-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && <CheckCircle size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                <User className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={40} />
                {search ? "No CAs matched your search" : "No eligible CAs available"}
              </div>
            )}
          </div>
        </div>

        {selectedCa && (
          <div className="p-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                  {selectedCaDetails?.name}
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-300">
                  @{selectedCa}
                </p>
              </div>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-1.5">
              CA Fees (₹)
            </label>
            <input
              type="text"
              inputMode="decimal"
              pattern="^\d*\.?\d*$"
              value={feesValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) setFeesValue(val);
              }}
              placeholder="Enter CA fees"
              className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-700 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-gray-100 transition-all"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CAManagementModal;
