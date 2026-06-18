import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Briefcase, Building2, Wrench, ShoppingCart,
  CheckCircle2, Clock, CalendarDays, TrendingUp, AlertCircle,
  LayoutDashboard, Bell, Search, ChevronUp, ChevronDown,
  FileText, RotateCcw, UserCheck, Layers, XCircle, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from "recharts";

const data = {
  overview: {
    total_clients: 2, total_staff: 3, total_firms: 2,
    total_services: 1, total_orders: 5, assigned_orders: 2,
    unassigned_orders: 3, total_revenue: 235600,
    total_due: 265900, today_orders: 0, today_revenue: 0
  },
  order_status: {
    created: 2, "in process": 2, "pending from client": 0,
    "pending from department": 1, completed: 0, cancelled: 0
  }
};

function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const timeout = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * ease));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } })
};

const STATUS_CONFIG = [
  { key: "created", label: "Created", icon: FileText, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { key: "in process", label: "In Process", icon: RotateCcw, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { key: "pending from client", label: "Pending Client", icon: UserCheck, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { key: "pending from department", label: "Pending Dept.", icon: Layers, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
];

const PIE_COLORS = ["#7c3aed", "#3b82f6", "#f59e0b", "#f97316", "#10b981", "#ef4444"];

const METRIC_CARDS = [
  { label: "Total Clients", key: "total_clients", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", prefix: "" },
  { label: "Total Staff", key: "total_staff", icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10", prefix: "" },
  { label: "Total Firms", key: "total_firms", icon: Building2, color: "text-amber-400", bg: "bg-amber-500/10", prefix: "" },
  { label: "Total Services", key: "total_services", icon: Wrench, color: "text-emerald-400", bg: "bg-emerald-500/10", prefix: "" },
  { label: "Total Orders", key: "total_orders", icon: ShoppingCart, color: "text-pink-400", bg: "bg-pink-500/10", prefix: "" },
  { label: "Assigned", key: "assigned_orders", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", prefix: "" },
  { label: "Unassigned", key: "unassigned_orders", icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10", prefix: "" },
  { label: "Today Orders", key: "today_orders", icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-500/10", prefix: "" },
];

function MetricCard({ label, value, icon: Icon, color, bg, prefix, index }) {
  const count = useCountUp(value, 900, index * 80);
  return (
    <motion.div
      variants={fadeUp} custom={index} initial="hidden" animate="show"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 cursor-default"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`${bg} p-2 rounded-xl`}>
          <Icon className={`${color} w-4 h-4`} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-white">{prefix}{count.toLocaleString("en-IN")}</div>
    </motion.div>
  );
}

function RevenueCard({ label, value, total, color, barColor, icon: Icon, index }) {
  const count = useCountUp(value, 1400, 300 + index * 100);
  const pct = Math.round((value / total) * 100);
  return (
    <motion.div
      variants={fadeUp} custom={index} initial="hidden" animate="show"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${index === 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
          <Icon className={`w-5 h-5 ${index === 0 ? "text-emerald-400" : "text-red-400"}`} />
        </div>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <div>
        <div className="text-3xl font-semibold text-white mb-1">
          ₹{count.toLocaleString("en-IN")}
        </div>
        <div className="text-xs text-gray-500">{pct}% of combined</div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.6 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.value > 999
              ? `₹${p.value.toLocaleString("en-IN")}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { overview, order_status } = data;
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const total = overview.total_revenue + overview.total_due;

  const pieData = STATUS_CONFIG
    .map((s, i) => ({ name: s.label, value: order_status[s.key] || 0, color: PIE_COLORS[i] }))
    .filter(d => d.value > 0);

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
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Live indicator */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
        className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs text-gray-500">Live data · {time.toLocaleTimeString("en-IN")}</span>
      </motion.div>

      {/* Metric cards */}
      <section>
        <motion.p variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Overview</motion.p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRIC_CARDS.map((m, i) => (
            <MetricCard key={m.key} {...m} value={overview[m.key]} index={i} />
          ))}
        </div>
      </section>

      {/* Revenue cards */}
      <section>
        <motion.p variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Financials</motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RevenueCard label="Total Revenue" value={overview.total_revenue} total={total}
            barColor="#10b981" icon={TrendingUp} index={0} />
          <RevenueCard label="Total Due" value={overview.total_due} total={total}
            barColor="#ef4444" icon={AlertCircle} index={1} />
        </div>
      </section>

      {/* Charts row */}
      <section>
        <motion.p variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Analytics</motion.p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bar — orders */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-6">Order assignment</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" name="Orders" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie — status */}
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Order status</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={4} dataKey="value"
                    animationBegin={300} animationDuration={900}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">No status data</div>
            )}
          </motion.div>

          {/* Bar — revenue vs due */}
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-400 mb-6">Revenue vs Due (₹)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revData} barSize={56}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" name="Amount" radius={[8, 8, 0, 0]}>
                  {revData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </section>

      {/* Order status pills */}
      <section>
        <motion.p variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Order status detail</motion.p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATUS_CONFIG.map((s, i) => {
            const val = order_status[s.key] || 0;
            const Icon = s.icon;
            return (
              <motion.div key={s.key}
                variants={fadeUp} custom={i} initial="hidden" animate="show"
                whileHover={{ scale: 1.04, transition: { duration: 0.18 } }}
                className={`${s.bg} border ${s.border} rounded-2xl p-4 flex flex-col gap-2 cursor-default`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
                <div className="text-xl font-semibold text-white">{val}</div>
                <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Summary row */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/10 p-3 rounded-xl">
            <RefreshCw className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Collection rate</p>
            <p className="text-xs text-gray-500">Revenue collected vs total due</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="text-right">
            <div className="text-lg font-semibold text-emerald-400">₹{overview.total_revenue.toLocaleString("en-IN")}</div>
            <div className="text-xs text-gray-500">Collected</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-red-400">₹{overview.total_due.toLocaleString("en-IN")}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <ChevronDown className="w-4 h-4 text-amber-400" />
              <span className="text-lg font-semibold text-amber-400">
                {Math.round((overview.total_revenue / (overview.total_revenue + overview.total_due)) * 100)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">Collected ratio</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}