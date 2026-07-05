import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaShoppingCart, FaMoneyBillWave, FaPercentage, FaReceipt, FaChartLine,
  FaCheckCircle, FaExclamationTriangle, FaUserPlus, FaCreditCard,
  FaUndo, FaUserTie, FaBoxOpen,
} from "react-icons/fa";
import { Search, X } from "lucide-react";
import apiCall from "../utils/apiCall";
import AsyncSelectField from "../components/common/AsyncSelectField";
import AdvancedDateFilter from "../components/common/AdvancedDateFilter";
import ManagementHub from "../components/common/ManagementHub";

// ─── Formatting helpers ───────────────────────────────────────────────────────

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

function labelFromStatusKey(key) {
  const cleaned = key.replace(/_orders$/, "").replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const STATUS_STYLES = {
  completed: { chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  created: { chip: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  in_process: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  pending_from_client: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  pending_from_department: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  cancelled: { chip: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  default: { chip: "bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300" },
};

function statusStyle(key) {
  const normalized = String(key || "").replace(/_orders$/, "");
  return STATUS_STYLES[normalized] || STATUS_STYLES.default;
}

// ─── Small presentational bits ────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, tone = "violet", delay = 0 }) {
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
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">{value}</p>
    </motion.div>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-3 dark:border-gray-700 dark:bg-gray-900/30">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-100">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
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

  // Load on first Apply or when user explicitly triggers — not on mount
  // (mount fetch is triggered below via the Apply button's default behaviour)
  // Actually, we load on mount once using the ref guard:
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

  // ─── Map the real API payload ─────────────────────────────────────────────
  const overview = data?.overview || {};
  const statusSummaryEntries = Object.entries(data?.order_status_summary || {});
  const staffSummary = data?.staff_summary || {};
  const serviceSummary = data?.service_summary || {};
  const firmAnalytics = data?.firm_analytics || {};
  const paymentSummary = data?.payment_summary || {};
  const gatewayEntries = Object.entries(paymentSummary.gateway_breakdown || {});
  const clientSummary = data?.client_summary || {};
  const recentOrders = data?.recent_activity?.recent_orders || [];
  const recentPayments = data?.recent_activity?.recent_payments || [];
  const kpis = data?.kpis || {};
  const outstandingPayments = kpis.outstanding_payments || [];
  const servicePerformance = kpis.service_performance || [];
  const completionRate = kpis.completion_rate ?? 0;

  return (
    <ManagementHub
      title="Reports"
      description="Overview of orders, payments, and client activity."
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
                const next = { ...filters, service_id: val };
                setFilters(next);
                fetchReport(next);
              }}
            />
          </div>

          {/* Staff username */}
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

          {/* Client username */}
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

          {/* Actions */}
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

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400 dark:text-gray-500">
            Loading report…
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview KPI cards */}
            <div>
              <SectionHeader icon={<FaChartLine />} title="Overview" subtitle="Key numbers for the selected period" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard icon={<FaShoppingCart />} label="Total orders" value={overview.total_orders ?? 0} tone="violet" delay={0.0} />
                <KpiCard icon={<FaMoneyBillWave />} label="Revenue" value={money(overview.total_order_amount)} tone="emerald" delay={0.05} />
                <KpiCard icon={<FaReceipt />} label="Tax collected" value={money(overview.total_tax_amount)} tone="amber" delay={0.1} />
                <KpiCard icon={<FaPercentage />} label="Discounts given" value={money(overview.total_discount_amount)} tone="rose" delay={0.15} />
                <KpiCard icon={<FaChartLine />} label="Avg order value" value={money(overview.avg_order_value)} tone="violet" delay={0.2} />
              </div>
            </div>

            {/* Order Status Summary */}
            <div>
              <SectionHeader icon={<FaBoxOpen />} title="Order status summary" subtitle="Counts and payment breakdown by status" />
              {statusSummaryEntries.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No order status data for this period.</p>
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
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{s.order_count ?? 0}</span>
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

            {/* Staff & Service Summary */}
            <div>
              <SectionHeader icon={<FaUserTie />} title="Staff & service summary" subtitle="Compact activity tiles" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatTile label="Total staff" value={staffSummary.total_staff ?? 0} />
                <StatTile label="Active staff" value={staffSummary.active_staff ?? 0} />
                <StatTile label="Idle staff" value={staffSummary.idle_staff ?? 0} sub={`${staffSummary.total_active_orders ?? 0} active orders`} />
                <StatTile label="Total services" value={serviceSummary.total_services ?? 0} />
                <StatTile label="Active services" value={serviceSummary.active_services ?? 0} />
                <StatTile label="Total firms" value={firmAnalytics.total_firms ?? 0} />
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <SectionHeader icon={<FaCreditCard />} title="Payment summary" subtitle="Breakdown by gateway" />
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Total paid" value={money(paymentSummary.total_paid)} />
                <StatTile label="Total refunded" value={money(paymentSummary.total_refunded)} />
                <StatTile label="Total failed" value={money(paymentSummary.total_failed)} />
                <StatTile label="Paid transactions" value={paymentSummary.paid_count ?? 0} />
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Gateway</th>
                      <th className="px-4 py-3 font-semibold">Transactions</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {gatewayEntries.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">No payment data.</td></tr>
                    ) : gatewayEntries.map(([gateway, g]) => (
                      <tr key={gateway}>
                        <td className="px-4 py-3 font-medium capitalize">{gateway}</td>
                        <td className="px-4 py-3">{g.count ?? 0}</td>
                        <td className="px-4 py-3">{money(g.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client Summary */}
            <div>
              <SectionHeader icon={<FaUserPlus />} title="Client summary" subtitle="New clients acquired" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Today" value={clientSummary.new_today ?? 0} />
                <StatTile label="This week" value={clientSummary.new_this_week ?? 0} />
                <StatTile label="This month" value={clientSummary.new_this_month ?? 0} />
                <StatTile label="This year" value={clientSummary.new_this_year ?? 0} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                          <td className="px-3 py-2.5 font-medium">#{o.order_id}</td>
                          <td className="px-3 py-2.5 truncate max-w-[140px]">{o.client_name}</td>
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
                        <th className="px-3 py-2.5 font-semibold">Gateway</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {recentPayments.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-5 text-center text-gray-400 dark:text-gray-500">No recent payments.</td></tr>
                      ) : recentPayments.map((p, i) => (
                        <tr key={p.payment_id || i}>
                          <td className="px-3 py-2.5 font-medium">#{p.order_id}</td>
                          <td className="px-3 py-2.5 truncate max-w-[140px]">{p.client_name}</td>
                          <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400">{money(p.amount)}</td>
                          <td className="px-3 py-2.5 capitalize">{p.gateway}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div>
              <SectionHeader icon={<FaCheckCircle />} title="KPIs" subtitle="Completion, outstanding payments, and service performance" />

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
                </div>

                {/* Outstanding payments */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaExclamationTriangle className="text-rose-500" />
                    <span className="text-xs font-medium uppercase tracking-wide">Outstanding payments</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {outstandingPayments.length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Nothing outstanding — all clear.</p>
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

              {/* Service performance */}
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-500 dark:from-gray-700/50 dark:to-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Orders</th>
                      <th className="px-4 py-3 font-semibold">Revenue</th>
                      <th className="px-4 py-3 font-semibold">Avg completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {servicePerformance.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">No service performance data.</td></tr>
                    ) : servicePerformance.map((sp, i) => (
                      <tr key={sp.service_id || i}>
                        <td className="px-4 py-3 font-medium">{sp.name}</td>
                        <td className="px-4 py-3">{sp.order_count ?? 0}</td>
                        <td className="px-4 py-3">{money(sp.total_revenue)}</td>
                        <td className="px-4 py-3">
                          {sp.avg_completion_time_hours != null ? `${sp.avg_completion_time_hours}h` : "—"}
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