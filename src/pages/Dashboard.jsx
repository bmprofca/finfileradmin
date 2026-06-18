import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
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

const data = {
  overview: {
    total_clients: 2,
    total_staff: 3,
    total_firms: 2,
    total_services: 1,
    total_orders: 5,
    assigned_orders: 2,
    unassigned_orders: 3,
    total_revenue: 235600,
    total_due: 265900,
    today_orders: 0,
    today_revenue: 0,
  },
  order_status: {
    created: 2,
    "in process": 2,
    "pending from client": 0,
    "pending from department": 1,
    completed: 0,
    cancelled: 0,
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

const STATUS_CONFIG = [
  { key: "created", label: "Created", icon: FileText, color: "#7c3aed", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20" },
  { key: "in process", label: "In Process", icon: RotateCcw, color: "#2563eb", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
  { key: "pending from client", label: "Pending Client", icon: UserCheck, color: "#d97706", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
  { key: "pending from department", label: "Pending Dept.", icon: Layers, color: "#ea580c", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "#059669", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "#dc2626", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
];

const METRIC_CARDS = [
  { label: "Total Clients", key: "total_clients", icon: Users, text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
  { label: "Total Staff", key: "total_staff", icon: Briefcase, text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { label: "Total Firms", key: "total_firms", icon: Building2, text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { label: "Total Services", key: "total_services", icon: Wrench, text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { label: "Total Orders", key: "total_orders", icon: ShoppingCart, text: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
  { label: "Assigned", key: "assigned_orders", icon: CheckCircle2, text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { label: "Unassigned", key: "unassigned_orders", icon: Clock, text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
  { label: "Today Orders", key: "today_orders", icon: CalendarDays, text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
];

function useCountUp(target, duration = 900, delay = 0) {
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

function SectionTitle({ children }) {
  return (
    <motion.p
      variants={fadeUp}
      custom={0}
      initial="hidden"
      animate="show"
      className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400"
    >
      {children}
    </motion.p>
  );
}

function Panel({ children, className = "", index = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="show"
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/60 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

function MetricCard({ label, value, icon: Icon, text, bg, index }) {
  const count = useCountUp(value, 800, index * 60);

  return (
    <Panel index={index} className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <div className={`rounded-xl p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${text}`} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-950 dark:text-white">
        {count.toLocaleString("en-IN")}
      </div>
    </Panel>
  );
}

function RevenueCard({ label, value, total, barColor, icon: Icon, index }) {
  const count = useCountUp(value, 1100, 180 + index * 100);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const isRevenue = index === 0;

  return (
    <Panel index={index} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${isRevenue ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
          <Icon className={`h-5 w-5 ${isRevenue ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`} />
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <div>
        <div className="mb-1 text-3xl font-semibold text-gray-950 dark:text-white">
          Rs {count.toLocaleString("en-IN")}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{pct}% of combined</div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.35 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </Panel>
  );
}

function BarPanel({ data, formatValue = (value) => value.toLocaleString("en-IN") }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="h-[220px] border-b border-gray-200 pt-4 dark:border-gray-800">
      <div className="flex h-full items-end gap-4">
        {data.map((item) => {
          const height = Math.max((item.value / max) * 145, item.value > 0 ? 12 : 4);

          return (
            <div key={item.name} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
              <div className="text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                {formatValue(item.value)}
              </div>
              <motion.div
                className="w-full max-w-[58px] rounded-t-lg shadow-sm"
                style={{ background: item.fill }}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="flex h-8 items-start text-center text-xs leading-tight text-gray-500 dark:text-gray-400">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusDonut({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No status data
      </div>
    );
  }

  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-6 sm:flex-row">
      <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="16" className="text-gray-100 dark:text-gray-800" />
        {data.map((item) => {
          const length = (item.value / total) * circumference;
          const dashOffset = -offset;
          offset += length;

          return (
            <motion.circle
              key={item.name}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </svg>
      <div className="grid gap-2 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            <span>{item.name}</span>
            <span className="font-semibold tabular-nums text-gray-950 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { overview, order_status } = data;
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const total = overview.total_revenue + overview.total_due;
  const collectedRatio = total > 0 ? Math.round((overview.total_revenue / total) * 100) : 0;

  const pieData = STATUS_CONFIG
    .map((status) => ({
      name: status.label,
      value: order_status[status.key] || 0,
      color: status.color,
    }))
    .filter((item) => item.value > 0);

  const barData = [
    { name: "Assigned", value: overview.assigned_orders, fill: "#10b981" },
    { name: "Unassigned", value: overview.unassigned_orders, fill: "#f97316" },
    { name: "Today", value: overview.today_orders, fill: "#3b82f6" },
  ];

  const revData = [
    { name: "Revenue", value: overview.total_revenue, fill: "#10b981" },
    { name: "Due", value: overview.total_due, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-8 text-gray-950 dark:text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h1
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="show"
            className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white"
          >
            Dashboard
          </motion.h1>
          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {time.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </motion.p>
        </div>

        <motion.div
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live data - {time.toLocaleTimeString("en-IN")}
        </motion.div>
      </div>

      <section>
        <SectionTitle>Overview</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {METRIC_CARDS.map((metric, index) => (
            <MetricCard key={metric.key} {...metric} value={overview[metric.key]} index={index} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Financials</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RevenueCard label="Total Revenue" value={overview.total_revenue} total={total} barColor="#10b981" icon={TrendingUp} index={0} />
          <RevenueCard label="Total Due" value={overview.total_due} total={total} barColor="#ef4444" icon={AlertCircle} index={1} />
        </div>
      </section>

      <section>
        <SectionTitle>Analytics</SectionTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel index={1}>
            <h3 className="mb-6 text-sm font-medium text-gray-700 dark:text-gray-300">Order assignment</h3>
            <BarPanel data={barData} />
          </Panel>

          <Panel index={2}>
            <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">Order status</h3>
            <StatusDonut data={pieData} />
          </Panel>

          <Panel index={3} className="lg:col-span-2">
            <h3 className="mb-6 text-sm font-medium text-gray-700 dark:text-gray-300">Revenue vs Due</h3>
            <BarPanel data={revData} formatValue={(value) => `Rs ${(value / 1000).toFixed(0)}k`} />
          </Panel>
        </div>
      </section>

      <section>
        <SectionTitle>Order Status Detail</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                className={`flex cursor-default flex-col gap-2 rounded-2xl border p-4 ${status.bg} ${status.border}`}
              >
                <Icon className={`h-5 w-5 ${status.text}`} />
                <div className="text-xl font-semibold text-gray-950 dark:text-white">{value}</div>
                <div className="text-xs leading-tight text-gray-500 dark:text-gray-400">{status.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Panel index={1} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-500/10">
            <RefreshCw className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-950 dark:text-white">Collection rate</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenue collected vs total due</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-8">
          <div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              Rs {overview.total_revenue.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Collected</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              Rs {overview.total_due.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <ChevronDown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">{collectedRatio}%</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Collected ratio</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
