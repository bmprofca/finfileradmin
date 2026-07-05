import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaFilePdf, FaSearch, FaUndo, FaSpinner } from "react-icons/fa";
import apiCall from "../utils/apiCall";
import ManagementTable from "../components/common/ManagementTable";
import AsyncSelectField from "../components/common/AsyncSelectField";
import AdvancedDateFilter from "../components/common/AdvancedDateFilter";
// NOTE: adjust this import path to wherever PaginationComponent actually lives
// in your project. This file assumes the common prop shape:
//   <PaginationComponent
//     currentPage={number}
//     totalPages={number}
//     totalItems={number}
//     pageSize={number}
//     onPageChange={(page) => void}
//   />
// If your component's props differ, only the <PaginationComponent /> block
// below needs to change.
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

export default function SalesReport() {
  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const [dateValue, setDateValue] = useState(null);

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
    }
  }, []);

  useEffect(() => {
    fetchSalesReport(emptyFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (val) => {
    setDateValue(val);
    setFilters((prev) => ({ ...prev, from_date: val?.from_date || "", to_date: val?.to_date || "" }));
  };

  const applyFilters = () => {
    const next = { ...filters, search: searchInput };
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

  const goToPage = (page) => {
    setPageNo(page);
    fetchSalesReport(filters, page);
  };

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
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sales report</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">Full order-level sales breakdown</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 self-start rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          {downloading ? <FaSpinner className="animate-spin text-xs" /> : <FaFilePdf className="text-xs" />}
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Date range</label>
            <AdvancedDateFilter
              value={dateValue}
              onChange={handleDateChange}
              tabOptions={["range", "month", "date"]}
              placeholder="Filter by date"
              buttonClassName="w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Service</label>
            <AsyncSelectField
              fetchUrl="/api/admin/services/list"
              dataKey="services"
              labelKey="name"
              valueKey="id"
              placeholder="All services"
              value={filters.service_id}
              onChange={(val) => setFilters((prev) => ({ ...prev, service_id: val }))}
            />
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Client</label>
            <AsyncSelectField
              fetchUrl="/api/admin/clients/list"
              dataKey="clients"
              labelKey="username"
              valueKey="username"
              placeholder="All clients"
              value={filters.client_username}
              onChange={(val) => setFilters((prev) => ({ ...prev, client_username: val }))}
            />
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Search</label>
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Order id, client, firm…"
                className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              <FaSearch className="text-xs" /> Apply
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-slate-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700/50"
            >
              <FaUndo className="text-xs" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
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
