import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaFilePdf, FaSpinner } from "react-icons/fa";
import { Search, X } from "lucide-react";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementTable from "../components/common/ManagementTable";
import AsyncSelectField from "../components/common/AsyncSelectField";
import AdvancedDateFilter from "../components/common/AdvancedDateFilter";
import PaginationComponent from "../components/common/PaginationComponent";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const emptyFilters = {
  from_date: "",
  to_date: "",
  service_id: null,
  client_username: null,
  search: "",
};

const LIMIT = 20;

export default function SalesReport({ tabs, activeTab, onTabChange }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const [dateValue, setDateValue] = useState(null);

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Guard against React StrictMode double-invoking effects
  const hasFetchedRef = useRef(false);

  const fetchSalesReport = useCallback(async (activeFilters, page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page_no", page);
      params.append("limit", LIMIT);
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== "") params.append(key, val);
      });

      const res = await apiCall(`/api/admin/sales-report?${params.toString()}`, "GET");
      const json = await res.json();
      if (json.success) {
        setRows(json.data?.rows || []);
        setTotals(json.data?.totals || null);
        setTotalItems(json.data?.total_count ?? 0);
        setTotalPages(json.data?.total_pages ?? 1);
      } else {
        toast.error(json.message || "Failed to load sales report");
      }
    } catch (err) {
      console.error("Sales report fetch error:", err);
      toast.error("Something went wrong while loading the sales report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchSalesReport(emptyFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (val) => {
    setDateValue(val);
    const next = { ...filters, search: searchInput, from_date: val?.from_date || "", to_date: val?.to_date || "" };
    setFilters(next);
    setPageNo(1);
    fetchSalesReport(next, 1);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSearchInput("");
    setDateValue(null);
    setPageNo(1);
    fetchSalesReport(emptyFilters, 1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSalesReport(filters, pageNo);
  };

  const goToPage = (page) => {
    setPageNo(page);
    fetchSalesReport(filters, page);
  };

  const hasActiveFilters =
    filters.from_date || filters.to_date || filters.service_id ||
    filters.client_username || searchInput;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== "") params.append(key, val);
      });
      const res = await apiCall(`/api/admin/sales-report/download?${params.toString()}`, "GET");
      const json = await res.json();
      if (json.success && json.data?.url) {
        const link = document.createElement("a");
        link.href = json.data.url;
        link.download = json.data.filename || "sales-report.pdf";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(json.message || "Failed to generate PDF");
      }
    } catch (err) {
      console.error("Sales report download error:", err);
      toast.error("Something went wrong while generating the PDF");
    } finally {
      setDownloading(false);
    }
  };

  const columns = [
    { key: "sl_no", label: "Sl. No.", render: (row) => row.sl_no },
    { key: "date", label: "Date", render: (row) => row.date },
    { key: "order_id", label: "Order", render: (row) => `#${row.order_id}` },
    { key: "name", label: "Name" },
    { key: "client", label: "Client" },
    { key: "firm", label: "Firm" },
    { key: "service", label: "Service" },
    { key: "base_price", label: "Base price", render: (row) => money(row.base_price) },
    { key: "tax", label: "Tax", render: (row) => money(row.tax) },
    { key: "discount", label: "Discount", render: (row) => money(row.discount) },
    { key: "total", label: "Total", render: (row) => <span className="font-medium">{money(row.total)}</span> },
    { key: "paid", label: "Paid", render: (row) => <span className="text-emerald-600 dark:text-emerald-400">{money(row.paid)}</span> },
    {
      key: "balance_due",
      label: "Balance due",
      render: (row) => (
        <span className={Number(row.balance_due) > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400 dark:text-gray-500"}>
          {money(row.balance_due)}
        </span>
      ),
    },
  ];

  return (
    <ManagementHub
      title="Sales Report"
      description="Full order-level sales breakdown."
      accent="violet"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? <FaSpinner className="animate-spin text-xs" /> : <FaFilePdf className="text-xs" />}
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <div className="space-y-4 mt-2">

        {/* ── Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap xl:flex-nowrap items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-gray-950/30"
        >
          {/* Date */}
          <div className="flex-none w-full lg:w-auto">
            <AdvancedDateFilter
              value={dateValue}
              onChange={handleDateChange}
              tabOptions={["range", "month", "date"]}
              placeholder="Date or range"
              buttonClassName="h-[42px] w-full bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all"
            />
          </div>

          {/* Service */}
          <div className="flex-1 min-w-[180px]">
            <AsyncSelectField
              fetchUrl="/api/admin/services/list"
              dataKey="services"
              labelKey="name"
              valueKey="service_id"
              placeholder="All services"
              value={filters.service_id}
              onChange={(val) => {
                const next = { ...filters, search: searchInput, service_id: val };
                setFilters(next);
                setPageNo(1);
                fetchSalesReport(next, 1);
              }}
            />
          </div>

          {/* Client */}
          <div className="flex-1 min-w-[180px]">
            <AsyncSelectField
              fetchUrl="/api/admin/clients/list"
              dataKey="clients"
              labelKey="username"
              valueKey="username"
              placeholder="All clients"
              value={filters.client_username}
              onChange={(val) => {
                const next = { ...filters, search: searchInput, client_username: val };
                setFilters(next);
                setPageNo(1);
                fetchSalesReport(next, 1);
              }}
            />
          </div>

          {/* Search */}
          <div className="relative flex-[1.5] min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                const next = { ...filters, search: val };
                setFilters(next);
                setPageNo(1);
                fetchSalesReport(next, 1);
              }}
              placeholder="Order id, client, firm…"
              className="w-full pl-9 pr-8 py-2 h-[42px] bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  const next = { ...filters, search: "" };
                  setFilters(next);
                  setPageNo(1);
                  fetchSalesReport(next, 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 xl:flex-shrink-0">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 h-[42px] text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors whitespace-nowrap"
              >
                <X size={14} /> Clear
              </button>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> records
            </p>
          </div>
        </motion.div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400 dark:text-gray-500">
            Loading sales report…
          </div>
        ) : (
          <>
            <ManagementTable
              rows={rows}
              columns={columns}
              rowKey={(row, index) => row.order_id ?? index}
              accent="violet"
              showActionsColumn={false}
              emptyState={
                <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
                  No sales records match your filters.
                </div>
              }
            />

            {/* Totals row */}
            {rows.length > 0 && totals && (
              <div className="overflow-hidden rounded-lg border border-violet-200 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-900/10">
                <div className="grid grid-cols-2 gap-y-2 px-4 py-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
                  <TotalStat label="Base price" value={money(totals.base_price)} />
                  <TotalStat label="Tax" value={money(totals.tax)} />
                  <TotalStat label="Discount" value={money(totals.discount)} />
                  <TotalStat label="Total" value={money(totals.total)} bold />
                  <TotalStat label="Paid" value={money(totals.paid)} tone="emerald" />
                  <TotalStat label="Balance due" value={money(totals.balance_due)} tone="rose" />
                </div>
              </div>
            )}

            {/* Pagination */}
            {rows.length > 0 && (
              <PaginationComponent
                currentPage={pageNo}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={LIMIT}
                onPageChange={goToPage}
              />
            )}
          </>
        )}
      </div>
    </ManagementHub>
  );
}

function TotalStat({ label, value, tone, bold }) {
  const toneClass = tone === "emerald"
    ? "text-emerald-600 dark:text-emerald-400"
    : tone === "rose"
    ? "text-rose-600 dark:text-rose-400"
    : "text-gray-800 dark:text-gray-100";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-violet-400 dark:text-violet-400/70">{label}</p>
      <p className={`${bold ? "font-semibold" : "font-medium"} ${toneClass}`}>{value}</p>
    </div>
  );
}
