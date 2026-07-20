import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FaFilePdf, FaSpinner } from "react-icons/fa";
import { Search, X, Eye } from "lucide-react";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementTable from "../components/common/ManagementTable";
import Modal from "../components/common/Modal";
import AsyncSelectField from "../components/common/AsyncSelectField";
import AdvancedDateFilter from "../components/common/AdvancedDateFilter";
import PaginationComponent from "../components/common/PaginationComponent";

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const dash = (val) => (val === null || val === undefined || val === "" ? "—" : val);

function formatDay(str) {
  if (!str) return "—";
  const d = new Date(`${str}T00:00:00`);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const emptyFilters = {
  from_date: "",
  to_date: "",
  service_id: null,
  client_username: null,
  search: "",
};

const LIMIT = 20;

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

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
  </div>
);

export default function SalesReport({ tabs, activeTab, onTabChange }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedRow, setSelectedRow] = useState(null);
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
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

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
        setTotalItems(json.pagination?.total ?? 0);
        setTotalPages(json.pagination?.total_pages ?? 1);
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

  // Whole-report PDF (all rows matching current filters)
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

  // Single-order invoice PDF, triggered from the row's three-dot menu
  const handleDownloadInvoice = async (orderId) => {
    setDownloadingInvoiceId(orderId);
    try {
      const res = await apiCall(`/invoice/${orderId}/download`, "GET");
      if (!res.ok) {
        toast.error("Failed to download the invoice");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (err) {
      console.error("Invoice download error:", err);
      toast.error("Something went wrong while downloading the invoice");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // ── Table columns ──
  // Requested primary fields: sl_no, date, client name, gst_no, tax_value,
  // igst, cost (base_price), sgst, total. The Order column is added since
  // staff need it to tell orders apart and to trigger the invoice download;
  // CGST is folded into the Tax value tooltip rather than its own column,
  // since IGST/CGST/SGST are mutually exclusive on any single order.
  const columns = [
    { key: "sl_no", label: "Sl. No.", render: (row) => row.sl_no },
    { key: "date", label: "Date", render: (row) => formatDay(row.date) },
    {
      key: "order",
      label: "Order",
      render: (row) => (
        <div>
          <span className="block font-medium">#{row.order_id}</span>
          <span className="block max-w-[160px] truncate text-[11px] text-gray-400 dark:text-gray-500">
            {row.order_name}
          </span>
        </div>
      ),
    },
    {
      key: "client_name",
      label: "Client",
      render: (row) => (
        <div>
          <span className="block max-w-[140px] truncate font-medium">{row.client_name}</span>
          <span className="block max-w-[140px] truncate text-[11px] text-gray-400 dark:text-gray-500">
            {dash(row.client_mobile)}
          </span>
        </div>
      ),
    },
    { key: "gst_no", label: "GST No.", render: (row) => dash(row.gst_no) },
    { key: "base_price", label: "Cost", render: (row) => money(row.base_price) },
    {
      key: "tax_value",
      label: "Tax value",
      render: (row) => (
        <span
          title={`CGST ${money(row.cgst)} · SGST ${money(row.sgst)} · IGST ${money(row.igst)}`}
        >
          {money(row.tax_value)}
        </span>
      ),
    },
    { key: "sgst", label: "SGST", render: (row) => money(row.sgst) },
    { key: "igst", label: "IGST", render: (row) => money(row.igst) },
    { key: "total", label: "Total", render: (row) => <span className="font-medium">{money(row.total)}</span> },
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
          {downloading ? "Generating…" : "Download all orders in PDF"}
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
              placeholder="Select Date"
              buttonClassName="h-[42px] w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all"
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
              className="w-full pl-9 pr-8 py-2 h-[42px] bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm"
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
              onRowClick={(row) => setSelectedRow(row)}
              accent="violet"
              getActions={(row) => {
                const isDownloading = downloadingInvoiceId === row.order_id;
                return [
                  {
                    label: 'View Details',
                    icon: <Eye size={12} />,
                    onClick: () => setSelectedRow(row),
                    className: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300'
                  },
                  {
                    label: isDownloading ? 'Downloading...' : 'Download Invoice',
                    icon: isDownloading ? <FaSpinner size={12} className="animate-spin" /> : <FaFilePdf size={12} />,
                    onClick: () => handleDownloadInvoice(row.order_id),
                    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300'
                  }
                ];
              }}
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
                  <TotalStat label="Cost" value={money(totals.base_price)} />
                  <TotalStat label="Tax value" value={money(totals.tax_value)} />
                  <TotalStat label="CGST" value={money(totals.cgst)} />
                  <TotalStat label="SGST" value={money(totals.sgst)} />
                  <TotalStat label="IGST" value={money(totals.igst)} />
                  <TotalStat label="Total" value={money(totals.total)} bold />
                  <TotalStat label="Paid" value={money(totals.amount_paid)} tone="emerald" />
                </div>
                <div className="border-t border-violet-200 px-4 py-2 dark:border-violet-900/40">
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
                itemsPerPage={LIMIT}
                onPageChange={goToPage}
              />
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRow && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedRow(null)}
            title={`Order Details: #${selectedRow.order_id}`}
            size="2xl"
            contentClassName="p-5"
            closeText="Close"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label="Sl. No." value={selectedRow.sl_no} />
              <DetailItem label="Date" value={formatDay(selectedRow.date)} />
              <DetailItem label="Order ID" value={selectedRow.order_id} />
              <DetailItem label="Order Name" value={selectedRow.order_name} />
              <DetailItem label="Service Name" value={selectedRow.service_name} />
              <DetailItem label="Firm Name" value={selectedRow.firm_name || "—"} />
              <DetailItem label="Client Name" value={selectedRow.client_name} />
              <DetailItem label="Client Email" value={selectedRow.client_email || "—"} />
              <DetailItem label="Client Mobile" value={selectedRow.client_mobile || "—"} />
              <DetailItem label="GST No." value={selectedRow.gst_no || "—"} />
              <DetailItem label="Cost (Base Price)" value={money(selectedRow.base_price)} />
              <DetailItem label="Tax Rate" value={`${selectedRow.tax_rate || 0}%`} />
              <DetailItem label="Tax Value" value={money(selectedRow.tax_value)} />
              <DetailItem label="CGST" value={money(selectedRow.cgst)} />
              <DetailItem label="SGST" value={money(selectedRow.sgst)} />
              <DetailItem label="IGST" value={money(selectedRow.igst)} />
              <DetailItem label="Discount Type" value={selectedRow.discount_type || "—"} />
              <DetailItem label="Discount Value" value={money(selectedRow.discount_value)} />
              <DetailItem label="Amount Paid" value={money(selectedRow.amount_paid)} />
              <DetailItem label="Balance Due" value={money(selectedRow.balance_due)} />
              <DetailItem label="Total" value={money(selectedRow.total)} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}