import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, FileText,
  Download, Search, X, Eye, User, Calendar,
  CheckCircle, Clock, AlertTriangle, Hash,
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import Button from '../components/common/Button';
import ModalScrollLock from '../components/common/ModalScrollLock';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const summaryMetrics = [
  { id: 1, title: 'Total Revenue', value: '$124,500', trend: '+14% from last month', icon: DollarSign, color: 'indigo' },
  { id: 2, title: 'Filings Processed', value: '842', trend: '+22% from last month', icon: FileText, color: 'blue' },
  { id: 3, title: 'Active Clients', value: '1,204', trend: '+5% from last month', icon: TrendingUp, color: 'emerald' },
];

const recentFilings = [
  { id: 101, client: 'John Doe', type: '1040 Personal', amount: '$150.00', date: '2024-03-12', status: 'Completed', notes: 'Standard individual filing, W-2 income only.' },
  { id: 102, client: 'Acme Corp', type: '1120 Corporate', amount: '$800.00', date: '2024-03-11', status: 'Completed', notes: 'Annual corporate return, includes Schedule M.' },
  { id: 103, client: 'Jane Smith', type: 'Tax Consultation', amount: '$100.00', date: '2024-03-10', status: 'Pending', notes: 'Initial consultation for tax planning strategy.' },
  { id: 104, client: 'Global LLC', type: 'Bookkeeping (Feb)', amount: '$300.00', date: '2024-03-09', status: 'Overdue', notes: 'February monthly reconciliation — awaiting bank statements.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const STATUS_CONFIG = {
  Completed: { pill: 'bg-green-100 text-green-800 border border-green-200', icon: CheckCircle, iconColor: 'text-green-500' },
  Pending: { pill: 'bg-amber-100 text-amber-800 border border-amber-200', icon: Clock, iconColor: 'text-amber-500' },
  Overdue: { pill: 'bg-red-100 text-red-800 border border-red-200', icon: AlertTriangle, iconColor: 'text-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { pill: 'bg-gray-100 text-gray-700', icon: CheckCircle, iconColor: 'text-gray-400' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
      <Icon size={10} /> {status}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 border border-gray-200">
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 leading-snug break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

// ─── View Filing Modal ────────────────────────────────────────────────────────

const ViewFilingModal = ({ filing, onClose }) => (
  <motion.div
    variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <ModalScrollLock />
    <motion.div
      variants={modalVariants} initial="hidden" animate="visible" exit="exit"
      className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <FileText className="text-indigo-500" size={20} /> Filing Details
        </h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Client Avatar + Name */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {filing.client.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{filing.client}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Hash size={12} className="text-indigo-400" /> Invoice #{filing.id}
            </p>
            <div className="mt-1.5">
              <StatusBadge status={filing.status} />
            </div>
          </div>
        </div>

        {/* Summary band */}
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-lg font-bold text-indigo-700">{filing.amount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-semibold text-gray-700">{filing.date}</p>
          </div>
        </div>

        {/* Info grid */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="text-indigo-500" size={15} /> Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoItem icon={User} label="Client" value={filing.client} />
            <InfoItem icon={FileText} label="Service Type" value={filing.type} />
            <InfoItem icon={DollarSign} label="Amount" value={filing.amount} />
            <InfoItem icon={Calendar} label="Date" value={filing.date} />
            <InfoItem icon={CheckCircle} label="Status" value={filing.status} />
            <InfoItem icon={Hash} label="Invoice ID" value={`#${filing.id}`} />
          </div>
        </div>

        {/* Notes */}
        {filing.notes && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{filing.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Filing Card ──────────────────────────────────────────────────────────────

const FilingCard = ({ filing, index, onView }) => (
  <ManagementCard
    delay={index * 0.05}
    accent="indigo"
    eyebrow={`Date: ${filing.date}`}
    title={filing.client}
    subtitle={filing.type}
    icon={
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {filing.client.charAt(0).toUpperCase()}
      </div>
    }
    badge={<StatusBadge status={filing.status} />}
    onClick={() => onView(filing)}
    hoverable
    actions={[
      { label: 'View Invoice', icon: <Eye size={12} />, onClick: () => onView(filing), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' },
    ]}
    menuId={`filing-card-${filing.id}`}
    footer={
      <div className="flex items-center justify-between w-full text-xs text-gray-500">
        <span className="flex items-center gap-1"><Hash size={10} className="text-indigo-400" /> #{filing.id}</span>
        <span className="font-semibold text-indigo-700">{filing.amount}</span>
      </div>
    }
  >
    <div className="mt-1" />
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 5;

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchTerm('');
    setCurrentPage(1);
    setTimeout(() => setRefreshing(false), 800);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue' },
    { id: 'filings', label: 'Filing Stats' },
  ];

  const filtered = useMemo(() =>
    recentFilings.filter((f) =>
      [f.client, f.type, f.status].some((v) => v?.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [searchTerm]
  );

  const handleView = (filing) => {
    setSelectedFiling(filing);
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'client', label: 'Client Name', render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {row.client.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900 text-sm">{row.client}</span>
        </div>
      ),
    },
    { key: 'type', label: 'Service Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    {
      key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <ManagementHub
      title="Financial Reports & Analytics"
      description="Track revenue, monitor filing progress, and export data."
      accent="indigo"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button variant="outline" className="flex items-center gap-2 text-sm py-1.5">
          <Download size={16} /> Export CSV
        </Button>
      }
    >
      <div className="space-y-6 mt-6">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <ManagementCard key={metric.id} accent={metric.color} delay={index * 0.1}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-indigo-600 font-medium">{metric.trend}</div>
              </ManagementCard>
            );
          })}
        </div>

        {/* Transactions Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>

          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by client, service type, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px]"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 hidden xl:block whitespace-nowrap">
                <span className="font-semibold text-gray-800">{filtered.length}</span> transactions
                {searchTerm && <span className="ml-1 text-indigo-600">· "{searchTerm}"</span>}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="flex items-center gap-2 text-sm whitespace-nowrap py-1.5">
                <Download size={16} /> Export CSV
              </Button>
              <div className="flex w-full lg:w-auto justify-end">
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="indigo" />
              </div>
            </div>

          </motion.div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
              <FileText className="text-gray-300 mx-auto mb-4" size={64} />
              <p className="text-xl text-gray-500">No transactions found</p>
              <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No transactions yet'}</p>
            </motion.div>
          )}

          {/* Content */}
          {filtered.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white shadow-xl">
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={filtered}
                  rowKey="id"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { label: 'View Invoice', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' },
                  ]}
                  accent="indigo"
                />
              )}

              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {filtered.map((filing, index) => (
                      <FilingCard key={filing.id} filing={filing} index={index} onView={handleView} />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* View Filing Modal */}
      <AnimatePresence>
        {modalOpen && selectedFiling && (
          <ViewFilingModal
            filing={selectedFiling}
            onClose={() => { setModalOpen(false); setSelectedFiling(null); }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
