import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, FileText, CheckCircle, XCircle,
  Search, X, Eye, DollarSign, Trash2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SelectField from '../components/common/SelectField';
import ServiceFormModal from '../components/common/ServiceFormModal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { ConstantOptions } from '../contexts/ConstantOptionsContext';
import { apiCall } from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ServiceStatusBadge = ({ status }) => {
  const isActive = status === 1 || status === true || status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}>
      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-sm border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="dark:text-gray-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

const STATUS_FILTER_OPTIONS = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
];

const filterSelectStyles = {
  control: (provided, state, theme) => {
    const isDark = theme === 'dark';
    return {
      ...provided,
      minHeight: '42px',
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      borderColor: state.isFocused ? '#10b981' : (isDark ? '#374151' : '#e5e7eb'),
      boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#10b981' : (isDark ? '#4b5563' : '#d1d5db'),
      },
    };
  },
};

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
      <>
        <button onClick={() => onDelete(service)} className="px-5 py-2.5 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2">
          <Trash2 size={16} /> Delete
        </button>
        <button onClick={() => onEdit(service)} className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2">
          <Edit size={16} /> Edit Service
        </button>
      </>
    }
  >
    <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
      {service.image ? (
        <img src={service.image} alt={service.name} className="w-16 h-16 rounded-sm object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-sm bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
          <Briefcase size={28} />
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{service.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{service.type}</p>
        <div className="mt-1.5 flex gap-2 items-center">
          <ServiceStatusBadge status={service.status} />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono text-[10px]">ID: {service.service_id}</span>
        </div>
      </div>
    </div>

    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-sm border border-emerald-100 dark:border-emerald-800/50">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Description</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">{service.description || 'No description provided.'}</p>
    </div>

    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <FileText className="text-emerald-500 dark:text-emerald-400" size={15} /> Financial & General Details
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

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <CheckCircle className="text-emerald-500 dark:text-emerald-400" size={15} /> Fields Requirement
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-sm border border-gray-200 dark:border-gray-700 p-3 flex flex-wrap gap-2">
          {service.fields && Object.keys(service.fields).length > 0 ? (
            Object.entries(service.fields).map(([key, val]) => (
              <span key={key} className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300">
                {key}: <span className={val ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{val ? 'Yes' : 'No'}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">No specific fields</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <FileText className="text-emerald-500 dark:text-emerald-400" size={15} /> Required Documents
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-sm border border-gray-200 dark:border-gray-700 p-3 space-y-2">
          {service.documents && service.documents.length > 0 ? (
            service.documents.map((doc, idx) => (
              <div key={idx} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-2">
                <div className="font-semibold text-gray-700 dark:text-gray-300">{doc.name} {doc.is_required && <span className="text-red-500">*</span>}</div>
                <div className="text-gray-500 dark:text-gray-400 mt-1">Accepts: {doc.accept_extensions?.join(', ')}</div>
                {doc.description && <div className="text-gray-400 dark:text-gray-500 mt-0.5">{doc.description}</div>}
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">No documents required</span>
          )}
        </div>
      </div>
    </div>
  </Modal>
);

// ─── Active Filter Pills ──────────────────────────────────────────────────────

const ActiveFilters = ({ searchTerm, typeFilter, statusFilter, onClearSearch, onClearType, onClearStatus, onClearAll }) => {
  const hasFilters = searchTerm || typeFilter || statusFilter;
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Active filters:</span>
      {searchTerm && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Search: "{searchTerm}"
          <button onClick={onClearSearch} className="ml-0.5 hover:text-emerald-900 dark:hover:text-emerald-200"><X size={11} /></button>
        </span>
      )}
      {typeFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-xs font-medium text-blue-700 dark:text-blue-400">
          Type: {typeFilter}
          <button onClick={onClearType} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-200"><X size={11} /></button>
        </span>
      )}
      {statusFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 text-xs font-medium text-purple-700 dark:text-purple-400">
          Status: {statusFilter === '1' ? 'Active' : 'Inactive'}
          <button onClick={onClearStatus} className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-200"><X size={11} /></button>
        </span>
      )}
      <button onClick={onClearAll} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors">
        Clear all
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Services() {
  const { serviceTypeOptions } = ConstantOptions();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedService, setSelectedService] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalServices, setTotalServices] = useState(0);
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // Debounce search input — 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchServices = useCallback(async ({ silent = false, force = false } = {}) => {
    const params = new URLSearchParams({
      page_no: currentPage,
      limit: itemsPerPage,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);

    const requestKey = params.toString();
    if (activeFetchRef.current === requestKey) {
      setRefreshing(false);
      return;
    }
    if (!force && lastFetchRef.current === requestKey) return;

    activeFetchRef.current = requestKey;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const response = await apiCall(`/api/admin/services/list?${params.toString()}`);
      const json = await response.json();
      if (json.success) {
        setServices(json.data.services || []);
        setTotalServices(json.data.pagination?.total || 0);
        lastFetchRef.current = requestKey;
      } else {
        toast.error('Failed to fetch services.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  }, [currentPage, itemsPerPage, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleView = (service) => { setSelectedService(service); setIsViewModalOpen(true); };
  const handleEdit = (service) => { setEditingService(service); setIsFormModalOpen(true); setIsViewModalOpen(false); };
  const handleCreateNew = () => { setEditingService(null); setIsFormModalOpen(true); };
  const handleRefresh = () => fetchServices({ silent: true, force: true });
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

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
        setIsDeleteModalOpen(false);
        setServiceToDelete(null);
        fetchServices({ silent: true, force: true });
      } else {
        toast.error(json.message || 'Failed to delete service.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const endpoint = editingService ? '/api/admin/services/update' : '/api/admin/services/create';
      const response = await apiCall(endpoint, 'POST', formData);
      const json = await response.json();
      if (json.success) {
        setIsFormModalOpen(false);
        fetchServices({ silent: true, force: true });
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch || typeFilter || statusFilter;

  // ─── Table Columns ───────────────────────────────────────────────────────────

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
            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.name}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.type}</div>
          </div>
        </div>
      ),
    },
    { key: 'base_price', label: 'Base', render: (row) => <span className="text-xs whitespace-nowrap text-gray-600 dark:text-gray-300">₹{row.base_price}</span> },
    { key: 'discount', label: 'Discount', render: (row) => <span className="text-xs whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-medium">₹{row.discount_value}</span> },
    { key: 'tax', label: 'Tax', render: (row) => <span className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">{row.tax_rate}% (₹{row.tax_value})</span> },
    { key: 'fees', label: 'Final Fees', render: (row) => <span className="text-sm font-semibold whitespace-nowrap text-gray-800 dark:text-gray-100">₹{row.fees}</span> },
    { key: 'delivery_time', label: 'Delivery', render: (row) => <span className="text-xs whitespace-nowrap text-gray-600 dark:text-gray-300">{row.delivery_time}</span> },
    { key: 'docs', label: 'Docs', render: (row) => <span className="text-[11px] whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-md font-medium border border-gray-200 dark:border-gray-700">{row.documents?.length || 0} req</span> },
    { key: 'status', label: 'Status', render: (row) => <ServiceStatusBadge status={row.status} /> },
  ];

  return (
    <ManagementHub
      title="Services Management"
      description="Manage the services and packages offered to your clients."
      accent="emerald"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} /> <span className='hidden md:block'>Add Service</span>
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 rounded-sm border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          {/* Top row: search + dropdowns + view switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 h-[42px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-start md:items-center lg:items-center flex-col md:flex-row lg:flex-row gap-2">
              {/* Type filter */}
              <div className="min-w-[190px] w-full md:w-auto">
                <SelectField
                  value={serviceTypeOptions.find((option) => option.value === typeFilter) || null}
                  onChange={(selected) => setTypeFilter(selected?.value || '')}
                  options={serviceTypeOptions}
                  placeholder="All Types"
                  isClearable
                  styles={filterSelectStyles}
                />
              </div>

              {/* Status filter */}
              <div className="min-w-[160px] w-full md:w-auto">
                <SelectField
                  value={STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter) || null}
                  onChange={(selected) => setStatusFilter(selected?.value || '')}
                  options={STATUS_FILTER_OPTIONS}
                  placeholder="All Status"
                  isClearable
                  styles={filterSelectStyles}
                />
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Count */}
              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden xl:block">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{totalServices}</span> services
              </p>
              
            </div>
          </div>

          {/* Active filter pills */}
          <ActiveFilters
            searchTerm={debouncedSearch}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onClearSearch={() => setSearchTerm('')}
            onClearType={() => setTypeFilter('')}
            onClearStatus={() => setStatusFilter('')}
            onClearAll={clearAllFilters}
          />
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton rows={6} columns={8} />}

        {/* Empty state */}
        {!loading && services.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50">
            <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No services found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'No services available'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && services.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-sm bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">
            <ManagementTable
              columns={tableColumns}
              rows={services}
              rowKey="service_id"
              onRowClick={(row) => handleView(row)}
              getActions={(row) => [
                { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
                { label: 'Edit Service', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => handleDeleteRequest(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
              ]}
              accent="emerald"
            />
          </motion.div>
        )}

        {!loading && totalServices > 0 && (
          <PaginationComponent
            currentPage={currentPage}
            totalItems={totalServices}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            availableLimits={[10, 20, 50, 100]}
          />
        )}
      </div>

      {/* View Modal */}
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

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && serviceToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete Service"
            icon={Trash2}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Service'}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-gray-800 dark:text-gray-100">{serviceToDelete.name}</span>? This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
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
