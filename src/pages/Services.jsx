import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, FileText, CheckCircle, XCircle,
  Search, X, Eye, DollarSign, Users, Trash2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementTable from '../components/common/ManagementTable';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ServiceFormModal from '../components/common/ServiceFormModal';
import { apiCall } from '../utils/apiCall';

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

const ServiceStatusBadge = ({ status }) => {
  const isActive = status === 1 || status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}>
      {isActive
        ? <CheckCircle size={10} />
        : <XCircle size={10} />
      }
      {isActive ? 'Active' : 'Inactive'}
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

// ─── View Service Modal ───────────────────────────────────────────────────────

const ViewServiceModal = ({ service, onClose, onEdit, onDelete }) => (
  <Modal 
    isOpen={true} 
    onClose={onClose} 
    title="Service Details"
    icon={Briefcase}
    size="2xl"
    contentClassName="p-5 space-y-4"
    footer={
      <div className="flex items-center justify-between w-full">
        <button onClick={() => onDelete(service)} className="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all flex items-center gap-2">
          <Trash2 size={16} /> Delete
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            Close
          </button>
          <button onClick={() => onEdit(service)} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2">
            <Edit size={16} /> Edit Service
          </button>
        </div>
      </div>
    }
  >
    {/* Icon + Name */}
    <div className="flex items-center gap-4 pb-4 border-b">
      {service.image ? (
        <img src={service.image} alt={service.name} className="w-16 h-16 rounded-xl object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
          <Briefcase size={28} />
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold text-gray-800">{service.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{service.type}</p>
        <div className="mt-1.5 flex gap-2 items-center">
          <ServiceStatusBadge status={service.status} />
          <span className="text-xs text-gray-500 font-mono text-[10px]">ID: {service.service_id}</span>
        </div>
      </div>
    </div>

    {/* Description */}
    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Description</p>
      <p className="text-sm text-gray-700">{service.description || "No description provided."}</p>
    </div>

    {/* Info Grid */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FileText className="text-emerald-500" size={15} /> Financial & General Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem icon={Briefcase} label="Service Name" value={service.name} />
        <InfoItem icon={DollarSign} label="Base Price" value={`₹${service.base_price}`} />
        <InfoItem icon={DollarSign} label="Tax Rate / Value" value={`${service.tax_rate}% / ₹${service.tax_value}`} />
        <InfoItem icon={DollarSign} label="Total Fees" value={`₹${service.total_fees}`} />
        <InfoItem icon={DollarSign} label="Discount" value={`${service.discount_value} (${service.discount_percentage}% ${service.discount_type})`} />
        <InfoItem icon={DollarSign} label="Final Fees" value={`₹${service.fees}`} />
        <InfoItem icon={FileText} label="Category" value={service.type} />
        <InfoItem icon={FileText} label="Delivery Time" value={service.delivery_time} />
      </div>
    </div>

    {/* Fields and Documents */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <CheckCircle className="text-emerald-500" size={15} /> Fields Requirement
        </h4>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex flex-wrap gap-2">
          {service.fields && Object.keys(service.fields).length > 0 ? (
            Object.entries(service.fields).map(([key, val]) => (
              <span key={key} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-600">
                {key}: <span className={val ? 'text-emerald-600' : 'text-red-600'}>{val ? 'Yes' : 'No'}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">No specific fields</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="text-emerald-500" size={15} /> Required Documents
        </h4>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
          {service.documents && service.documents.length > 0 ? (
            service.documents.map((doc, idx) => (
              <div key={idx} className="text-xs bg-white border border-gray-200 rounded-md p-2">
                <div className="font-semibold text-gray-700">{doc.name} {doc.is_required && <span className="text-red-500">*</span>}</div>
                <div className="text-gray-500 mt-1">Accepts: {doc.accept_extensions?.join(', ')}</div>
                {doc.description && <div className="text-gray-400 mt-0.5">{doc.description}</div>}
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500">No documents required</span>
          )}
        </div>
      </div>
    </div>

  </Modal>
);

// ─── Service Card (Card View) ─────────────────────────────────────────────────

const ServiceManagementCard = ({ service, index, onView, onEdit, onDelete }) => (
  <ManagementCard
    key={service.service_id}
    title={service.name}
    subtitle={`₹${service.fees}`}
    icon={<Briefcase className="w-4 h-4" />}
    accent="emerald"
    delay={index * 0.1}
    badge={<ServiceStatusBadge status={service.status} />}
    onClick={() => onView(service)}
    hoverable
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(service), className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' },
      { label: 'Edit Service', icon: <Edit size={12} />, onClick: () => onEdit(service), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
      { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => onDelete(service), className: 'text-red-600 hover:text-red-700 hover:bg-red-50' },
    ]}
    menuId={`service-card-${service.service_id}`}
  >
    <div className="py-1.5">
      <p className="text-sm text-gray-600 line-clamp-2">{service.description || "No description."}</p>
    </div>
    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <FileText className="w-3.5 h-3.5" />
        <span className="truncate max-w-[120px]">{service.type}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-gray-500">{service.delivery_time}</span>
      </div>
    </div>
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedService, setSelectedService] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Services
  const fetchServices = async () => {
    setLoading(true);
    try {
      // Pass pagination params if needed, for now just fetch large limit to handle search locally
      const response = await apiCall('/api/admin/services/list?page_no=1&limit=100');
      const json = await response.json();
      if (json.success) {
        setServices(json.data.services || []);
      } else {
        toast.error('Failed to fetch services.');
      }
    } catch (error) {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filtered = useMemo(() =>
    services.filter((s) =>
      [s.name, s.type, s.status === 1 ? 'Active' : 'Inactive'].some((v) => v?.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [services, searchTerm]
  );

  const handleView = (service) => {
    setSelectedService(service);
    setIsViewModalOpen(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsFormModalOpen(true);
    setIsViewModalOpen(false);
  };

  const handleCreateNew = () => {
    setEditingService(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
    setIsViewModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall('/api/admin/services/delete', 'POST', { service_id: serviceToDelete.service_id });
      const json = await response.json();
      if (json.success) {
        toast.success('Service deleted successfully.');
        setIsDeleteModalOpen(false);
        setServiceToDelete(null);
        fetchServices();
      } else {
        toast.error(json.message || 'Failed to delete service.');
      }
    } catch (error) {
      toast.error('Error connecting to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const endpoint = editingService ? '/api/admin/services/update' : '/api/admin/services/create';
      const method = 'POST'; // Assuming POST for both create and update based on prompt payload
      
      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();
      
      if (json.success) {
        toast.success(editingService ? 'Service updated successfully!' : 'Service created successfully!');
        setIsFormModalOpen(false);
        fetchServices();
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns = [
    {
      key: 'name', label: 'Service Name', render: (row) => (
        <div className="flex items-center gap-2">
          {row.image ? (
            <img src={row.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
              <Briefcase size={14} />
            </div>
          )}
          <div className="min-w-[120px]">
            <div className="font-semibold text-gray-800 text-sm whitespace-nowrap">{row.name}</div>
            <div className="text-[11px] text-gray-500 whitespace-nowrap">{row.type}</div>
          </div>
        </div>
      ),
    },
    { key: 'base_price', label: 'Base', render: (row) => <span className="text-xs whitespace-nowrap text-gray-600">₹{row.base_price}</span> },
    { key: 'discount', label: 'Discount', render: (row) => <span className="text-xs whitespace-nowrap text-emerald-600 font-medium">₹{row.discount_value}</span> },
    { key: 'tax', label: 'Tax', render: (row) => <span className="text-[11px] whitespace-nowrap text-gray-500">{row.tax_rate}% (₹{row.tax_value})</span> },
    { key: 'fees', label: 'Final Fees', render: (row) => <span className="text-sm font-semibold whitespace-nowrap text-gray-800">₹{row.fees}</span> },
    { key: 'delivery_time', label: 'Delivery', render: (row) => <span className="text-xs whitespace-nowrap text-gray-600">{row.delivery_time}</span> },
    { key: 'docs', label: 'Docs', render: (row) => <span className="text-[11px] whitespace-nowrap bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{row.documents?.length || 0} req</span> },
    {
      key: 'status', label: 'Status', render: (row) => <ServiceStatusBadge status={row.status} />,
    },
  ];

  return (
    <ManagementHub
      title="Services Management"
      description="Manage the services and packages offered to your clients."
      accent="emerald"
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-emerald-600 hover:bg-emerald-700">
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

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl">
            <Briefcase className="text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500">No services found</p>
            <p className="text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No services available'}</p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white shadow-xl">
            {/* Card View (default) */}
            {viewMode === 'card' && (
              <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                <AnimatePresence>
                  {filtered.map((service, index) => (
                    <ServiceManagementCard 
                      key={service.service_id} 
                      service={service} 
                      index={index} 
                      onView={handleView} 
                      onEdit={handleEdit}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </AnimatePresence>
              </ManagementGrid>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <ManagementTable
                columns={tableColumns}
                rows={filtered}
                rowKey="service_id"
                onRowClick={(row) => handleView(row)}
                getActions={(row) => [
                  { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' },
                  { label: 'Edit Service', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
                  { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => handleDeleteRequest(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50' },
                ]}
                accent="emerald"
              />
            )}
          </motion.div>
        )}
      </div>

      {/* View Service Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedService && (
          <ViewServiceModal
            service={selectedService}
            onClose={() => { setIsViewModalOpen(false); setSelectedService(null); }}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && serviceToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete Service"
            icon={Trash2}
            size="md"
            footer={
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Service'}
                </button>
              </div>
            }
          >
            <div className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{serviceToDelete.name}</span>? This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <ServiceFormModal 
            service={editingService}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
