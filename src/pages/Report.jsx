import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaShoppingCart, FaMoneyBillWave, FaPercentage, FaReceipt, FaChartLine,
  FaCheckCircle, FaExclamationTriangle, FaUserPlus, FaCreditCard,
  FaUserTie, FaBoxOpen, FaFileAlt, FaTrophy, FaBlog, FaHistory,
} from "react-icons/fa";
import { X } from "lucide-react";
import apiCall from "../utils/apiCall";
import AsyncSelectField from "../components/common/AsyncSelectField";
import AdvancedDateFilter from "../components/common/AdvancedDateFilter";
import ManagementHub from "../components/common/ManagementHub";

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers — kept in plain language, no jargon in the output itself
// ─────────────────────────────────────────────────────────────────────────────

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const compactNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN");

function fileSize(bytes) {
  const n = Number(bytes || 0);
  if (n === 0) return "0 KB";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function formatDay(str) {
  if (!str) return "—";
  const d = new Date(`${str}T00:00:00`);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function labelFromStatusKey(key) {
  const cleaned = key.replace(/_orders$/, "").replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const STATUS_STYLES = {
  completed: { chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", bar: "#10b981" },
  created: { chip: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", bar: "#8b5cf6" },
  in_process: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", bar: "#f59e0b" },
  pending_from_client: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", bar: "#f59e0b" },
  pending_from_department: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", bar: "#f59e0b" },
  cancelled: { chip: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", bar: "#f43f5e" },
  default: { chip: "bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300", bar: "#94a3b8" },
};

function statusStyle(key) {
  const normalized = String(key || "").replace(/_orders$/, "");
  return STATUS_STYLES[normalized] || STATUS_STYLES.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational building blocks
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">{text}</p>
  );
}

function KpiCard({ icon, label, value, help, tone = "violet", delay = 0 }) {
  const toneMap = {
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500" title={help}>
          {label}
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">{value}</p>
      {help && <p className="mt-1 text-[11px] leading-snug text-gray-400 dark:text-gray-500">{help}</p>}
    </motion.div>
  );
}

function StatTile({ label, value, sub, help }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3.5 py-3 dark:border-gray-700 dark:bg-gray-800" title={help}>
      <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-100">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

// Simple, dependency-free bar chart. Built to stay readable even with a
// single data point, since real accounts start out with thin data.
function SimpleBarChart({ data, labelKey, valueKey, formatLabel, formatValue, color = "#8b5cf6", height = 140 }) {
  if (!data || data.length === 0) {
    return <EmptyState text="Not enough activity yet to draw a trend. Check back after a few more days." />;
  }
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const barWidth = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const v = Number(d[valueKey]) || 0;
          const barH = (v / max) * (height - 24);
          const x = i * barWidth + barWidth * 0.2;
          const w = barWidth * 0.6;
          return (
            <g key={i}>
              <title>{`${formatLabel ? formatLabel(d[labelKey]) : d[labelKey]}: ${formatValue ? formatValue(v) : v}`}</title>
              <rect
                x={x}
                y={height - 20 - barH}
                width={w}
                height={Math.max(barH, 2)}
                rx="1.5"
                fill={color}
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex text-[10px] text-gray-400 dark:text-gray-500">
        {data.map((d, i) => (
          <div key={i} style={{ width: `${barWidth}%` }} className="truncate text-center">
            {formatLabel ? formatLabel(d[labelKey]) : d[labelKey]}
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyFilters = {
  from_date: "",
  to_date: "",
  service_id: null,
  staff_username: "",
  client_username: "",
};

export default function Report({ tabs, activeTab, onTabChange }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [dateValue, setDateValue] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasFetchedRef = useRef(false);

  const fetchReport = useCallback(async (activeFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== "") params.append(key, val);
      });
      const res = await apiCall(`/api/admin/report?${params.toString()}`, "GET");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || "Failed to load report");
      }
    } catch (err) {
      console.error("Report fetch error:", err);
      toast.error("Something went wrong while loading the report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchReport(emptyFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (val) => {
    setDateValue(val);
    const next = { ...filters, from_date: val?.from_date || "", to_date: val?.to_date || "" };
    setFilters(next);
    fetchReport(next);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setDateValue(null);
    fetchReport(emptyFilters);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReport(filters);
  };

  const hasActiveFilters =
    filters.from_date || filters.to_date || filters.service_id ||
    filters.staff_username || filters.client_username;

  // ── Map the real API payload (see /api/admin/report) ─────────────────────
  const report = data?.report || {};
  const overview = data?.overview || {};
  const statusSummaryEntries = Object.entries(data?.order_status_summary || {});
  const staffSummary = data?.staff_summary || {};
  const serviceSummary = data?.service_summary || {};
  const firmAnalytics = data?.firm_analytics || {};
  const paymentSummary = data?.payment_summary || {};
  const gatewayEntries = Object.entries(paymentSummary.gateway_breakdown || {})
    .filter(([, g]) => (g.count ?? 0) > 0 || (g.amount ?? 0) > 0);
  const allGatewayEntries = Object.entries(paymentSummary.gateway_breakdown || {});
  const clientSummary = data?.client_summary || {};
  const documentSummary = data?.document_summary || {};
  const recentOrders = data?.recent_activity?.recent_orders || [];
  const recentPayments = data?.recent_activity?.recent_payments || [];
  const recentStatusChanges = data?.recent_activity?.recent_status_changes || [];
  const graphs = data?.graphs || {};
  const kpis = data?.kpis || {};
  const outstandingPayments = kpis.outstanding_payments || [];
  const servicePerformance = kpis.service_performance || [];
  const staffAnalytics = kpis.staff_analytics || [];
  const blogSummary = kpis.blog_summary || {};
  const completionRate = kpis.completion_rate ?? 0;
  const highestOrder = kpis.highest_order;
  const lowestOrder = kpis.lowest_order;
  const sameHighLow = highestOrder && lowestOrder && highestOrder.order_id === lowestOrder.order_id;

  const filterDescription = (() => {
    if (!hasActiveFilters) return "Showing data for all time, all services and all staff.";
    const bits = [];
    if (filters.from_date || filters.to_date) {
      bits.push(`dates ${filters.from_date || "…"} to ${filters.to_date || "…"}`);
    }
    if (filters.service_id) bits.push("a selected service");
    if (filters.staff_username) bits.push(`staff "${filters.staff_username}"`);
    if (filters.client_username) bits.push(`client "${filters.client_username}"`);
    return `Filtered by ${bits.join(", ")}.`;
  })();

  return (
    <ManagementHub
      title="Reports"
      description="A plain-language overview of orders, payments and client activity."
      accent="violet"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="space-y-4 mt-2">

        {/* ── Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap xl:flex-nowrap items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm dark:shadow-gray-950/30"
        >
          <div className="flex-none w-full lg:w-auto">
            <AdvancedDateFilter
              value={dateValue}
              onChange={handleDateChange}
              tabOptions={["range", "month", "date"]}
              placeholder="Date or range"
              buttonClassName="h-[42px] w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <AsyncSelectField
              fetchUrl="/api/admin/services/list"
              dataKey="services"
              labelKey="name"
              valueKey="service_id"
              placeholder="All services"
              value={filters.service_id}
              onChange={(val) => {
                const next = { ...filters, service_id: val };
                setFilters(next);
                fetchReport(next);
              }}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <AsyncSelectField
              fetchUrl="/api/admin/staff/list"
              dataKey="staffs"
              labelKey="username"
              valueKey="username"
              placeholder="Staff username"
              value={filters.staff_username}
              onChange={(val) => {
                const next = { ...filters, staff_username: val };
                setFilters(next);
                fetchReport(next);
              }}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <AsyncSelectField
              fetchUrl="/api/admin/clients/list"
              dataKey="clients"
              labelKey="username"
              valueKey="username"
              placeholder="Client username"
              value={filters.client_username}
              onChange={(val) => {
                const next = { ...filters, client_username: val };
                setFilters(next);
                fetchReport(next);
              }}
            />
          </div>

          <div className="flex items-center gap-2 xl:flex-shrink-0">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 h-[42px] text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors whitespace-nowrap"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Plain-language context strip ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          <span>{filterDescription}</span>
          {report.generated_at && <span>Last updated {formatDateTime(report.generated_at)}</span>}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400 dark:text-gray-500">
            Loading report…
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400 dark:text-gray-500">
            No report data available yet.
          </div>
        ) : (
          <div className="space-y-6">

            {/* Overview KPI cards */}
            <div>
              <SectionHeader icon={<FaChartLine />} title="Overview" subtitle="The headline numbers for the selected period" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard icon={<FaShoppingCart />} label="Total orders" value={compactNumber(overview.total_orders)} help="Every order placed in this period." tone="violet" delay={0.0} />
                <KpiCard icon={<FaMoneyBillWave />} label="Revenue" value={money(overview.total_order_amount)} help="Total value of all orders, before refunds." tone="emerald" delay={0.05} />
                <KpiCard icon={<FaReceipt />} label="Tax collected" value={money(overview.total_tax_amount)} help="Tax included within order fees." tone="amber" delay={0.1} />
                <KpiCard icon={<FaPercentage />} label="Discounts given" value={money(overview.total_discount_amount)} help="Amount knocked off order prices." tone="rose" delay={0.15} />
                <KpiCard icon={<FaChartLine />} label="Avg order value" value={money(overview.avg_order_value)} help="Revenue divided by number of orders." tone="violet" delay={0.2} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Active" value={compactNumber(overview.active_orders)} help="Orders still being worked on." />
                <StatTile label="Completed" value={compactNumber(overview.completed_orders)} help="Orders finished and delivered." />
                <StatTile label="Cancelled" value={compactNumber(overview.cancelled_orders)} help="Orders that were called off." />
                <StatTile label="Avg discount" value={money(overview.avg_discount_value)} help="Typical discount per order." />
              </div>
            </div>

            {/* Order Status Summary */}
            <div>
              <SectionHeader icon={<FaBoxOpen />} title="Orders by status" subtitle="Where every order currently stands, and what's been paid" />
              {statusSummaryEntries.every(([, s]) => (s.order_count ?? 0) === 0) ? (
                <EmptyState text="No orders recorded for this period." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {statusSummaryEntries.map(([key, s]) => {
                    const style = statusStyle(key);
                    const payment = s.payment || {};
                    return (
                      <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.chip}`}>
                            {labelFromStatusKey(key)}
                          </span>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{s.order_count ?? 0} orders</span>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{money(s.total_order_amount)}</p>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                          <span>Paid <span className="block font-medium text-emerald-600 dark:text-emerald-400">{money(payment.received_amount)}</span></span>
                          <span>Due <span className="block font-medium text-rose-600 dark:text-rose-400">{money(payment.due_amount)}</span></span>
                          <span>Partial <span className="block font-medium text-amber-600 dark:text-amber-400">{payment.partially_paid_orders?.count ?? 0}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff, Service & Firm Summary */}
            <div>
              <SectionHeader icon={<FaUserTie />} title="Staff, services & firms" subtitle="Who's active and what's on offer, at a glance" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                <StatTile label="Total staff" value={compactNumber(staffSummary.total_staff)} />
                <StatTile label="Active staff" value={compactNumber(staffSummary.active_staff)} help="Staff currently handling at least one order." />
                <StatTile label="Idle staff" value={compactNumber(staffSummary.idle_staff)} sub={`${compactNumber(staffSummary.total_active_orders)} active orders`} help="Staff with nothing assigned right now." />
                <StatTile label="Total services" value={compactNumber(serviceSummary.total_services)} />
                <StatTile label="Active services" value={compactNumber(serviceSummary.active_services)} />
                <StatTile label="Inactive services" value={compactNumber(serviceSummary.inactive_services)} />
                <StatTile label="Total firms" value={compactNumber(firmAnalytics.total_firms)} />
              </div>

              {staffAnalytics.length === 0 ? (
                <div className="mt-3">
                  <EmptyState text="No individual staff activity to show for this period." />
                </div>
              ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Staff</th>
                        <th className="px-4 py-3 font-semibold">Orders handled</th>
                        <th className="px-4 py-3 font-semibold">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {staffAnalytics.map((s, i) => (
                        <tr key={s.username || i}>
                          <td className="px-4 py-3 font-medium">{s.name || s.username}</td>
                          <td className="px-4 py-3">{compactNumber(s.order_count)}</td>
                          <td className="px-4 py-3">{compactNumber(s.completed_count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div>
              <SectionHeader icon={<FaCreditCard />} title="Payments" subtitle="Money collected, refunded, or that failed to go through" />
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Total collected" value={money(paymentSummary.total_paid)} />
                <StatTile label="Total refunded" value={money(paymentSummary.total_refunded)} />
                <StatTile label="Failed payments" value={money(paymentSummary.total_failed)} sub={`${compactNumber(paymentSummary.failed_count)} attempts`} />
                <StatTile label="Successful transactions" value={compactNumber(paymentSummary.paid_count)} />
              </div>
              {gatewayEntries.length === 0 ? (
                <EmptyState text="No payments have gone through any gateway yet." />
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Payment method</th>
                        <th className="px-4 py-3 font-semibold">Transactions</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {gatewayEntries.map(([gateway, g]) => (
                        <tr key={gateway}>
                          <td className="px-4 py-3 font-medium capitalize">{gateway}</td>
                          <td className="px-4 py-3">{compactNumber(g.count)}</td>
                          <td className="px-4 py-3">{money(g.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {gatewayEntries.length === 0 && allGatewayEntries.length > 0 && (
                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                  Available payment methods: {allGatewayEntries.map(([g]) => g).join(", ")}.
                </p>
              )}
            </div>

            {/* Client Summary */}
            <div>
              <SectionHeader icon={<FaUserPlus />} title="Clients" subtitle="How your client base is growing" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                <StatTile label="Total clients" value={compactNumber(clientSummary.total_clients)} />
                <StatTile label="Active" value={compactNumber(clientSummary.active_clients)} />
                <StatTile label="Inactive" value={compactNumber(clientSummary.inactive_clients)} />
                <StatTile label="New today" value={compactNumber(clientSummary.new_today)} />
                <StatTile label="New this week" value={compactNumber(clientSummary.new_this_week)} />
                <StatTile label="New this month" value={compactNumber(clientSummary.new_this_month)} />
                <StatTile label="New this year" value={compactNumber(clientSummary.new_this_year)} />
              </div>
            </div>

            {/* Document Summary */}
            <div>
              <SectionHeader icon={<FaFileAlt />} title="Documents" subtitle="Paperwork uploaded for these orders" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Total uploaded" value={compactNumber(documentSummary.total_uploaded)} />
                <StatTile label="From clients" value={compactNumber(documentSummary.input_documents)} help="Documents clients sent in." />
                <StatTile label="Delivered to clients" value={compactNumber(documentSummary.output_documents)} help="Documents your team produced." />
                <StatTile label="Storage used" value={fileSize(documentSummary.total_size_bytes)} sub={`avg ${fileSize(documentSummary.avg_size_bytes)} per file`} />
              </div>
              {documentSummary.missing_documents && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                  {documentSummary.missing_documents.total_missing > 0 ? (
                    <>
                      <FaExclamationTriangle className="text-amber-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {documentSummary.missing_documents.total_missing} of {documentSummary.missing_documents.total_required} required documents still need to be collected.
                      </span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="text-emerald-500" />
                      <span className="text-gray-600 dark:text-gray-300">All required documents have been collected.</span>
                    </>
                  )}
                </div>
              )}
              {(documentSummary.required_documents_breakdown || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {documentSummary.required_documents_breakdown.map((d, i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {d.name} · {d.count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Trends */}
            <div>
              <SectionHeader icon={<FaChartLine />} title="Trends" subtitle="How activity has moved day by day" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">New orders per day</p>
                  <SimpleBarChart
                    data={graphs.order_creation_timeline}
                    labelKey="date"
                    valueKey="count"
                    formatLabel={formatDay}
                    color="#8b5cf6"
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">New clients per day</p>
                  <SimpleBarChart
                    data={graphs.client_growth}
                    labelKey="date"
                    valueKey="count"
                    formatLabel={formatDay}
                    color="#10b981"
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Revenue per month</p>
                  <SimpleBarChart
                    data={graphs.revenue_monthly}
                    labelKey="month"
                    valueKey="amount"
                    formatValue={money}
                    color="#f59e0b"
                  />
                </div>
              </div>
              {(graphs.order_status_trend || []).length > 0 && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Order status activity by day</p>
                  <div className="flex flex-wrap gap-2">
                    {graphs.order_status_trend.map((t, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle(t.status).chip}`}
                      >
                        {formatDay(t.date)} · {labelFromStatusKey(t.status)} · {t.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <SectionHeader icon={<FaShoppingCart />} title="Recent orders" />
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Order</th>
                        <th className="px-3 py-2.5 font-semibold">Client</th>
                        <th className="px-3 py-2.5 font-semibold">Amount</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {recentOrders.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-5 text-center text-gray-400 dark:text-gray-500">No recent orders.</td></tr>
                      ) : recentOrders.map((o, i) => (
                        <tr key={o.order_id || i}>
                          <td className="px-3 py-2.5">
                            <span className="block font-medium">#{o.order_id}</span>
                            <span className="block truncate max-w-[160px] text-[11px] text-gray-400 dark:text-gray-500">{o.name}</span>
                          </td>
                          <td className="px-3 py-2.5 truncate max-w-[120px]">{o.client_name}</td>
                          <td className="px-3 py-2.5">{money(o.fees)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyle(o.status).chip}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <SectionHeader icon={<FaMoneyBillWave />} title="Recent payments" />
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Order</th>
                        <th className="px-3 py-2.5 font-semibold">Client</th>
                        <th className="px-3 py-2.5 font-semibold">Amount</th>
                        <th className="px-3 py-2.5 font-semibold">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {recentPayments.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-5 text-center text-gray-400 dark:text-gray-500">No recent payments.</td></tr>
                      ) : recentPayments.map((p, i) => (
                        <tr key={p.payment_id || i}>
                          <td className="px-3 py-2.5">
                            <span className="block font-medium">#{p.order_id}</span>
                            <span className="block truncate max-w-[160px] text-[11px] text-gray-400 dark:text-gray-500">{p.order_name}</span>
                          </td>
                          <td className="px-3 py-2.5 truncate max-w-[100px]">{p.client_name}</td>
                          <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400">{money(p.amount)}</td>
                          <td className="px-3 py-2.5 capitalize">{p.gateway}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <SectionHeader icon={<FaHistory />} title="Status changes" />
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800 max-h-[280px] overflow-y-auto">
                  {recentStatusChanges.length === 0 ? (
                    <EmptyState text="No status changes recorded." />
                  ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {recentStatusChanges.map((c, i) => (
                        <li key={i} className="px-3 py-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium text-gray-700 dark:text-gray-200">#{c.order_id}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyle(c.status).chip}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{c.remark}</p>
                          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            {c.changed_by_name} · {formatDateTime(c.create_date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div>
              <SectionHeader icon={<FaCheckCircle />} title="Performance" subtitle="Completion, outstanding money, and how each service is doing" />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Completion rate */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaCheckCircle className="text-emerald-500" />
                    <span className="text-xs font-medium uppercase tracking-wide">Completion rate</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">{pct(completionRate)}</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Number(completionRate) || 0)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                    Share of orders that reached "completed" out of all orders in this period.
                  </p>
                  {kpis.avg_completion_time_hours != null && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      Orders take about {kpis.avg_completion_time_hours}h to finish, on average.
                    </p>
                  )}
                </div>

                {/* Outstanding payments */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaExclamationTriangle className="text-rose-500" />
                    <span className="text-xs font-medium uppercase tracking-wide">Money still owed</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {outstandingPayments.length === 0 ? (
                      <EmptyState text="Nothing outstanding — every order is fully paid." />
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {outstandingPayments.map((op, i) => (
                          <li key={op.order_id || i} className="flex items-center justify-between py-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[65%]">#{op.order_id} · {op.name}</span>
                            <span className="font-medium text-rose-600 dark:text-rose-400">{money(op.due_amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Highest / lowest order + blog summary */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaTrophy className="text-amber-500" />
                    <span className="text-xs font-medium uppercase tracking-wide">Biggest order</span>
                  </div>
                  {highestOrder ? (
                    <>
                      <p className="mt-2 truncate text-sm font-medium text-gray-700 dark:text-gray-200">{highestOrder.name}</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{money(highestOrder.fees)}</p>
                    </>
                  ) : <EmptyState text="No orders yet." />}
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaMoneyBillWave className="text-slate-400" />
                    <span className="text-xs font-medium uppercase tracking-wide">Smallest order</span>
                  </div>
                  {lowestOrder ? (
                    <>
                      <p className="mt-2 truncate text-sm font-medium text-gray-700 dark:text-gray-200">{lowestOrder.name}</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{money(lowestOrder.fees)}</p>
                      {sameHighLow && <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Only one order this period.</p>}
                    </>
                  ) : <EmptyState text="No orders yet." />}
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaBlog className="text-violet-500" />
                    <span className="text-xs font-medium uppercase tracking-wide">Blog posts</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{compactNumber(blogSummary.total_blogs)} total</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {compactNumber(blogSummary.published_blogs)} published · {compactNumber(blogSummary.draft_blogs)} drafts
                  </p>
                </div>
              </div>

              {/* Service performance */}
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Orders</th>
                      <th className="px-4 py-3 font-semibold">Revenue</th>
                      <th className="px-4 py-3 font-semibold">Avg time to finish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {servicePerformance.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">No service performance data.</td></tr>
                    ) : servicePerformance.map((sp, i) => (
                      <tr key={sp.service_id || i}>
                        <td className="px-4 py-3 font-medium">{sp.name}</td>
                        <td className="px-4 py-3">{compactNumber(sp.order_count)}</td>
                        <td className="px-4 py-3">{money(sp.total_revenue)}</td>
                        <td className="px-4 py-3">
                          {sp.avg_completion_time_hours != null ? `${sp.avg_completion_time_hours}h` : "Not yet finished"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementHub>
  );
}