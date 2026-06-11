import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, FileText, CheckCircle, XCircle,
  Search, X, Eye, DollarSign, Users,
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementTable from '../components/common/ManagementTable';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import Button from '../components/common/Button';
import ModalScrollLock from '../components/common/ModalScrollLock';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const dummyServices = [
  { id: 1, name: 'Personal Tax Filing', description: 'Standard 1040 preparation and electronic filing.', rate: '$150', clients: 120, status: 'Active', category: 'Individual', turnaround: '3–5 business days' },
  { id: 2, name: 'Corporate Tax Return', description: 'Form 1120/1120S for C-Corps and S-Corps.', rate: '$800', clients: 45, status: 'Active', category: 'Business', turnaround: '7–10 business days' },
  { id: 3, name: 'Audit Defense', description: 'Representation and support during IRS audits.', rate: '$250/hr', clients: 8, status: 'Active', category: 'Individual', turnaround: 'Ongoing' },
  { id: 4, name: 'Bookkeeping', description: 'Monthly reconciliation and financial reporting.', rate: '$300/mo', clients: 60, status: 'Inactive', category: 'Business', turnaround: 'Monthly' },
  { id: 5, name: 'Tax Consultation', description: '1-on-1 strategy sessions for tax planning.', rate: '$100/hr', clients: 32, status: 'Active', category: 'Individual', turnaround: '1 business day' },
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

const ServiceStatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status === 'Active'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-gray-100 text-gray-600 border-gray-200'
    }`}>
    {status === 'Active'
      ? <CheckCircle size={10} />
      : <XCircle size={10} />
    }
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

// ─── View Service Modal ───────────────────────────────────────────────────────

const ViewServiceModal = ({ service, onClose }) => (
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
          <Briefcase className="text-emerald-500" size={20} /> Service Details
        </h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all shadow-sm hover:shadow-md bg-white/50 border border-slate-100">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Icon + Name */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
            <Briefcase size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{service.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{service.category}</p>
            <div className="mt-1.5">
              <ServiceStatusBadge status={service.status} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-700">{service.description}</p>
        </div>

        {/* Info Grid */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="text-emerald-500" size={15} /> Service Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoItem icon={Briefcase} label="Service Name" value={service.name} />
            <InfoItem icon={DollarSign} label="Rate" value={service.rate} />
            <InfoItem icon={Users} label="Active Clients" value={`${service.clients} clients`} />
            <InfoItem icon={CheckCircle} label="Status" value={service.status} />
            <InfoItem icon={FileText} label="Category" value={service.category} />
            <InfoItem icon={FileText} label="Turnaround" value={service.turnaround} />
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

// ─── Service Card (Card View) ─────────────────────────────────────────────────

const ServiceManagementCard = ({ service, index, onView }) => (
  <ManagementCard
    key={service.id}
    title={service.name}
    subtitle={service.rate}
    icon={<Briefcase className="w-4 h-4" />}
    accent="emerald"
    delay={index * 0.1}
    badge={<ServiceStatusBadge status={service.status} />}
    onClick={() => onView(service)}
    hoverable
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(service), className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' },
      { label: service.status === 'Active' ? 'Deactivate' : 'Activate', onClick: () => { }, className: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50' },
    ]}
    menuId={`service-card-${service.id}`}
  >
    <div className="py-1.5">
      <p className="text-sm text-gray-600">{service.description}</p>
    </div>
    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <FileText className="w-3.5 h-3.5" />
        <span>{service.clients} Active Clients</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {service.status === 'Active'
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          : <XCircle className="w-3.5 h-3.5 text-gray-400" />
        }
      </div>
    </div>
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() =>
    dummyServices.filter((s) =>
      [s.name, s.category, s.status].some((v) => v?.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [searchTerm]
  );

  const handleView = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const tableColumns = [
    {
      key: 'name', label: 'Service Name', render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
            <Briefcase size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{row.name}</div>
            <div className="text-xs text-gray-500">{row.category}</div>
          </div>
        </div>
      ),
    },
    { key: 'rate', label: 'Rate' },
    {
      key: 'clients', label: 'Active Clients', render: (row) => (
        <span className="flex items-center gap-1 text-sm text-gray-700">
          <Users size={12} className="text-emerald-500" /> {row.clients}
        </span>
      ),
    },
    { key: 'turnaround', label: 'Turnaround' },
    {
      key: 'status', label: 'Status', render: (row) => <ServiceStatusBadge status={row.status} />,
    },
  ];

  return (
    <ManagementHub
      title="Tax Services"
      description="Manage the services and packages offered to your clients."
      accent="emerald"
      actions={
        <Button variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={16} /> Add Service
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
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
                placeholder="Search services by name, category, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm min-h-[42px]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800">{filtered.length}</span> services
              {searchTerm && <span className="ml-1 text-emerald-600">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="emerald" />
          </div>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <Briefcase className="text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500">No services found</p>
            <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No services available'}</p>
          </motion.div>
        )}

        {/* Content */}
        {filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white shadow-xl">
            {/* Card View (default) */}
            {viewMode === 'card' && (
              <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                <AnimatePresence>
                  {filtered.map((service, index) => (
                    <ServiceManagementCard key={service.id} service={service} index={index} onView={handleView} />
                  ))}
                </AnimatePresence>
              </ManagementGrid>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <ManagementTable
                columns={tableColumns}
                rows={filtered}
                rowKey="id"
                onRowClick={(row) => handleView(row)}
                getActions={(row) => [
                  { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' },
                  { label: row.status === 'Active' ? 'Deactivate' : 'Activate', onClick: () => { }, className: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50' },
                ]}
                accent="emerald"
              />
            )}
          </motion.div>
        )}
      </div>

      {/* View Service Modal */}
      <AnimatePresence>
        {modalOpen && selectedService && (
          <ViewServiceModal
            service={selectedService}
            onClose={() => { setModalOpen(false); setSelectedService(null); }}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
