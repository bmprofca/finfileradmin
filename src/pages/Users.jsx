import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Filter, Download,
  User, Mail, Calendar, FileText, CheckCircle,
  Eye, Phone, Hash, Building2,
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import ModalScrollLock from '../components/common/ModalScrollLock';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const dummyUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '(555) 123-4567', ssn: '***-**-1234', year: '2023', status: 'Filed', lastActivity: '2024-02-15', address: '123 Main St, New York, NY 10001' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '(555) 987-6543', ssn: '***-**-5678', year: '2023', status: 'Pending', lastActivity: '2024-03-01', address: '456 Oak Ave, Los Angeles, CA 90001' },
  { id: 3, name: 'Acme Corp', email: 'tax@acmecorp.com', phone: '(555) 246-8100', ssn: 'XX-XXX4321', year: '2023', status: 'Overdue', lastActivity: '2023-11-20', address: '789 Business Blvd, Chicago, IL 60601' },
  { id: 4, name: 'Alice Johnson', email: 'alice.j@example.com', phone: '(555) 369-1234', ssn: '***-**-9876', year: '2023', status: 'Filed', lastActivity: '2024-01-10', address: '321 Elm St, Houston, TX 77001' },
  { id: 5, name: 'Bob Brown', email: 'bbrown@example.com', phone: '(555) 741-2580', ssn: '***-**-5555', year: '2023', status: 'Pending', lastActivity: '2024-03-10', address: '654 Pine Rd, Phoenix, AZ 85001' },
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

const STATUS_COLORS = {
  Filed: { pill: 'bg-green-100 text-green-800 border border-green-200', dot: 'bg-green-500' },
  Pending: { pill: 'bg-amber-100 text-amber-800 border border-amber-200', dot: 'bg-amber-500' },
  Overdue: { pill: 'bg-red-100 text-red-800 border border-red-200', dot: 'bg-red-500' },
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]?.pill || 'bg-gray-100 text-gray-700'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]?.dot || 'bg-gray-400'}`} />
    {status}
  </span>
);

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

// ─── View Client Modal ────────────────────────────────────────────────────────

const ViewClientModal = ({ client, onClose }) => (
  <motion.div
    variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <ModalScrollLock />
    <motion.div
      variants={modalVariants} initial="hidden" animate="visible" exit="exit"
      className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <User className="text-blue-500" size={20} /> Client Details
        </h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{client.name}</h3>
            <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
              <Mail size={13} className="text-blue-400" /> {client.email}
            </p>
            <div className="mt-1.5">
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>

        {/* Summary band */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Filing Year</p>
            <p className="text-sm font-semibold text-gray-700">{client.year}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last Activity</p>
            <p className="text-sm font-semibold text-gray-700">{client.lastActivity}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="text-blue-500" size={15} /> Filing Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoItem icon={User} label="Full Name" value={client.name} />
            <InfoItem icon={Hash} label="Tax ID" value={client.ssn} />
            <InfoItem icon={Mail} label="Email" value={client.email} />
            <InfoItem icon={Phone} label="Phone" value={client.phone} />
            <InfoItem icon={Building2} label="Address" value={client.address} className="col-span-full" />
            <InfoItem icon={Calendar} label="Last Activity" value={client.lastActivity} />
            <InfoItem icon={CheckCircle} label="Status" value={client.status} />
          </div>
        </div>
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

// ─── Client Card ──────────────────────────────────────────────────────────────

const ClientCard = ({ client, index, onView }) => (
  <ManagementCard
    delay={index * 0.05}
    accent="blue"
    eyebrow={`Last Activity: ${client.lastActivity}`}
    title={client.name}
    subtitle={client.email}
    icon={
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {client.name.charAt(0).toUpperCase()}
      </div>
    }
    badge={<StatusBadge status={client.status} />}
    onClick={() => onView(client)}
    hoverable
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(client), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
    ]}
    menuId={`client-card-${client.id}`}
    footer={
      <div className="flex items-center justify-between w-full text-xs text-gray-500">
        <span className="flex items-center gap-1"><Hash size={10} className="text-blue-400" /> {client.ssn}</span>
        <span className="flex items-center gap-1"><Calendar size={10} className="text-gray-400" /> {client.year}</span>
      </div>
    }
  >
    <div className="mt-1">
      {client.phone && (
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Phone size={10} className="text-gray-400" /> {client.phone}
        </p>
      )}
    </div>
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchTerm('');
    setCurrentPage(1);
    setTimeout(() => setRefreshing(false), 800);
  };

  const itemsPerPage = 10;

  const filtered = useMemo(() =>
    dummyUsers.filter((u) =>
      [u.name, u.email, u.ssn].some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [searchTerm]
  );

  const handleView = (client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name', label: 'Client Name', render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{row.name}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'ssn', label: 'Tax ID' },
    { key: 'year', label: 'Filing Year' },
    {
      key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'lastActivity', label: 'Last Activity' },
  ];

  return (
    <ManagementHub
      title="Client Management"
      description="Manage taxpayers, corporate clients, and track their tax filing statuses."
      accent="blue"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <div className="flex gap-2">
          <Button variant="primary" className="flex items-center gap-2 text-sm py-1.5">
            <Plus size={16} /> Add Client
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
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
                placeholder="Search clients by name, email, or Tax ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800">{filtered.length}</span> clients
              {searchTerm && <span className="ml-1 text-blue-600">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <Button variant="outline" className="flex items-center gap-2 text-sm py-1.5">
              <Filter size={14} /> Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2 text-sm py-1.5">
              <Download size={14} /> Export
            </Button>
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
          </div>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <User className="text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500">No clients found</p>
            <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No clients registered yet'}</p>
          </motion.div>
        )}

        {/* Content */}
        {filtered.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white shadow-xl">

              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={filtered}
                  rowKey="id"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
                  ]}
                  accent="blue"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {filtered.map((client, index) => (
                      <ClientCard key={client.id} client={client} index={index} onView={handleView} />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
              <PaginationComponent
                currentPage={currentPage}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* View Client Modal */}
      <AnimatePresence>
        {modalOpen && selectedClient && (
          <ViewClientModal
            client={selectedClient}
            onClose={() => { setModalOpen(false); setSelectedClient(null); }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
