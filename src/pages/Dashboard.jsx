import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import apiCall from "../utils/apiCall";

/* ────────────────────────────────────────────────────────────
   Motion presets
   ──────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ────────────────────────────────────────────────────────────
   Config
   ──────────────────────────────────────────────────────────── */
const STATUS_CONFIG = [
  { key: "created", label: "Created", icon: FileText, color: "#7c3aed" },
  { key: "in process", label: "In Process", icon: RotateCcw, color: "#2563eb" },
  { key: "pending from client", label: "Pending Client", icon: UserCheck, color: "#d97706" },
  { key: "pending from department", label: "Pending Dept.", icon: Layers, color: "#ea580c" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "#059669" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "#dc2626" },
];

const KPI_STRIP = [
  { label: "Clients", key: "total_clients", icon: Users, tint: "#7c3aed", link: "/clients" },
  { label: "Staff", key: "total_staff", icon: Briefcase, tint: "#2563eb", link: "/staff" },
  { label: "Firms", key: "total_firms", icon: Building2, tint: "#d97706", link: "/firms" },
  { label: "Services", key: "total_services", icon: Wrench, tint: "#059669", link: "/services" },
  { label: "Orders", key: "total_orders", icon: ShoppingCart, tint: "#db2777", link: "/orders" },
  { label: "Assigned", key: "assigned_orders", icon: CheckCircle2, tint: "#059669", link: "/orders?tab=assigned" },
  { label: "Unassigned", key: "unassigned_orders", icon: Clock, tint: "#ea580c", link: "/orders?tab=unassigned" },
  { label: "Today", key: "today_orders", icon: CalendarDays, tint: "#2563eb", link: "/orders?tab=today" },
];

/* ────────────────────────────────────────────────────────────
   Hooks
   ──────────────────────────────────────────────────────────── */
function useCountUp(target, duration = 700, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start;
    let raf;
    const timeout = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}

/* ────────────────────────────────────────────────────────────
   Primitives
   ──────────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <motion.p
      variants={fadeUp}
      custom={0}
      initial="hidden"
      animate="show"
      className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
    >
      {children}
    </motion.p>
  );
}

function Panel({ children, className = "", index = 0, noPad = false, accent, onClick }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#0F172A] dark:hover:shadow-none ${
        noPad ? "" : "p-4 sm:p-5"
      } ${className}`}
    >
      {accent && <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />}
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   KPI strip — individual elevated cells, icon chips, count-up
   ──────────────────────────────────────────────────────────── */
function KpiCell({ metric, value, index, onNavigate }) {
  const count = useCountUp(value ?? 0, 650, index * 35);
  const Icon = metric.icon;
  const isClickable = Boolean(metric.link);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      onClick={isClickable ? () => onNavigate(metric.link) : undefined}
      className={`relative flex items-center gap-2.5 overflow-hidden rounded-2xl border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:bg-[#0F172A] sm:gap-3 sm:p-4 ${
        isClickable ? "cursor-pointer hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)] transition-shadow" : ""
      }`}
      style={{ borderColor: `${metric.tint}26` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${metric.tint}14, transparent 65%)` }}
      />
      <div
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9"
        style={{ background: `${metric.tint}22` }}
      >
        <Icon className="h-4 w-4" style={{ color: metric.tint }} />
      </div>
      <div className="relative min-w-0">
        <div className="text-base font-bold leading-none tabular-nums text-gray-900 dark:text-white sm:text-lg">
          {count.toLocaleString("en-IN")}
        </div>
        <div className="mt-1.5 truncate text-[10.5px] font-medium leading-none text-gray-500 dark:text-gray-400 sm:text-[11px]">
          {metric.label}
        </div>
      </div>
      {isClickable && (
        <div className="absolute top-2 right-2 opacity-30">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </motion.div>
  );
}

function KpiStrip({ overview, onNavigate }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {KPI_STRIP.map((metric, index) => (
        <KpiCell key={metric.key} metric={metric} value={overview[metric.key]} index={index} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Signature element — radial collection ring
   Replaces the old donut chart with something that reads
   at a glance and doubles as the page's visual anchor.
   ──────────────────────────────────────────────────────────── */
function CollectionRing({ revenue, due }) {
  const total = revenue + due;
  const pct = total > 0 ? Math.round((revenue / total) * 100) : 0;
  const [mounted, setMounted] = useState(false);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-32 sm:w-32">
      <svg viewBox="0 0 128 128" className="h-24 w-24 -rotate-90 sm:h-32 sm:w-32">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-white/10" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: mounted ? circumference - (pct / 100) * circumference : circumference }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold tabular-nums text-gray-900 dark:text-white sm:text-2xl">{pct}%</span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 sm:text-[10px]">collected</span>
      </div>
    </div>
  );
}

function FinancialHero({ overview }) {
  const revenue = useCountUp(overview.total_revenue, 900, 150);
  const due = useCountUp(overview.total_due, 900, 200);
  const today = useCountUp(overview.today_revenue, 900, 250);

  return (
    <Panel index={1} className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <CollectionRing revenue={overview.total_revenue} due={overview.total_due} />

        <div className="grid w-full flex-1 grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Total Revenue
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              &#8377;{revenue.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              Total Due
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              &#8377;{due.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
              Today&rsquo;s Revenue
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              &#8377;{today.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PaymentDueCard({ value, index, onNavigate }) {
  return (
    <Panel
      index={index}
      className="flex flex-col justify-between cursor-pointer hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)] transition-shadow"
      onClick={() => onNavigate("/orders?tab=payment_due")}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
        Payment Due Leads
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{value}</div>
      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Leads awaiting payment follow-up</p>
    </Panel>
  );
}

/* ────────────────────────────────────────────────────────────
   Order assignment — ranked horizontal bars (clean, legible)
   ──────────────────────────────────────────────────────────── */
function RankedBars({ data, onNavigate }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {data.map((item, i) => (
        <div
          key={item.name}
          onClick={item.link && onNavigate ? () => onNavigate(item.link) : undefined}
          className={item.link ? "cursor-pointer group" : ""}
        >
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={`font-medium text-gray-600 dark:text-gray-300 ${item.link ? "group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" : ""}`}>{item.name}</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ background: item.fill }}
              initial={{ width: 0 }}
              animate={{ width: mounted ? `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` : 0 }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Order status — segmented stacked bar instead of a donut
   ──────────────────────────────────────────────────────────── */
function SegmentedStatusBar({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (total === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        No status data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        {data.map((item, i) => (
          <motion.div
            key={item.name}
            style={{ background: item.color }}
            initial={{ width: 0 }}
            animate={{ width: mounted ? `${(item.value / total) * 100}%` : 0 }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="truncate text-gray-500 dark:text-gray-400">{item.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-gray-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Skeleton / error states
   ──────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="h-4 w-44 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-8 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0F172A]" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0F172A]" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0F172A]" />
        <div className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0F172A]" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main
   ──────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(new Date());
  const dashboardFetchInFlightRef = useRef(false);
  const dashboardLoadedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboard = useCallback(async ({ silent = false, force = false } = {}) => {
    if (dashboardFetchInFlightRef.current || (!force && dashboardLoadedRef.current)) {
      return;
    }

    dashboardFetchInFlightRef.current = true;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await apiCall("/api/admin/dashboard", "GET");
      const json = await response.json();

      if (!response.ok || !json.success || !json.data?.overview || !json.data?.order_status) {
        throw new Error(json.message || "Failed to load dashboard data.");
      }

      setDashboardData(json.data);
      dashboardLoadedRef.current = true;
    } catch (err) {
      const message = err.message || "Error connecting to server.";
      setDashboardData(null);
      setError(message);
      toast.error(message);
    } finally {
      dashboardFetchInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-5 text-gray-900 dark:text-white">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {time.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </p>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Unable to load dashboard data</p>
              <p className="mt-0.5 text-xs opacity-80">{error || "Please try again."}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchDashboard({ force: true })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, order_status } = dashboardData;

  const statusData = STATUS_CONFIG.map((status) => ({
    name: status.label,
    value: order_status[status.key] || 0,
    color: status.color,
  })).filter((item) => item.value > 0);

  const assignmentData = [
    { name: "Assigned", value: overview.assigned_orders, fill: "#10b981", link: "/orders?tab=assigned" },
    { name: "Unassigned", value: overview.unassigned_orders, fill: "#f97316", link: "/orders?tab=unassigned" },
    { name: "Today", value: overview.today_orders, fill: "#3b82f6", link: "/orders?tab=today" },
  ];

  return (
    <div className="space-y-7 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {time.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live &middot; {time.toLocaleTimeString("en-IN")}
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard({ silent: true, force: true })}
            disabled={refreshing}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-[#0F172A] dark:text-gray-200 dark:hover:bg-white/5"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <section>
        <SectionTitle>Overview</SectionTitle>
        <KpiStrip overview={overview} onNavigate={navigate} />
      </section>

      {/* Financial hero + payment due */}
      <section>
        <SectionTitle>Financials</SectionTitle>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <FinancialHero overview={overview} />
          </div>
          <PaymentDueCard value={overview.payment_due_leads} index={2} onNavigate={navigate} />
        </div>
      </section>

      {/* Analytics */}
      <section>
        <SectionTitle>Analytics</SectionTitle>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Panel index={1}>
            <h3 className="mb-5 text-xs font-semibold text-gray-700 dark:text-gray-300">Order assignment</h3>
            <RankedBars data={assignmentData} onNavigate={navigate} />
          </Panel>

          <Panel index={2}>
            <h3 className="mb-5 text-xs font-semibold text-gray-700 dark:text-gray-300">Order status</h3>
            <SegmentedStatusBar data={statusData} />
          </Panel>
        </div>
      </section>

      {/* Order status detail */}
      <section>
        <SectionTitle>Order Status Detail</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {STATUS_CONFIG.map((status, index) => {
            const Icon = status.icon;
            const value = order_status[status.key] || 0;

            return (
              <motion.div
                key={status.key}
                variants={fadeUp}
                custom={index}
                initial="hidden"
                animate="show"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="flex cursor-default flex-col gap-2 rounded-2xl border border-gray-200/70 bg-white p-3.5 dark:border-white/10 dark:bg-[#0F172A]"
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${status.color}14` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: status.color }} />
                </div>
                <div className="text-lg font-bold leading-none tabular-nums text-gray-900 dark:text-white">{value}</div>
                <div className="text-[10.5px] leading-tight text-gray-400 dark:text-gray-500">{status.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}