import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Tag, Plus, Edit, Trash2, CheckCircle, XCircle, Users, Clock, User, Mail, Phone, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { apiCall } from '../utils/apiCall';
import SelectField from '../components/common/SelectField';

// Adjust this to wherever client profile images are actually served from in your app
const CLIENT_IMAGE_BASE_URL = '/uploads/clients';

const StatusBadge = ({ status }) => {
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

const getInitials = (client) => {
  const first = client?.first_name?.[0] || '';
  const last = client?.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
};

const getFullName = (client) => {
  return [client?.first_name, client?.middle_name, client?.last_name].filter(Boolean).join(' ');
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value.replace(' ', 'T'));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ClientAvatar = ({ client }) => {
  const [imgError, setImgError] = useState(false);
  const src = client?.image ? `${CLIENT_IMAGE_BASE_URL}/${client.image}` : null;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={getFullName(client)}
        onError={() => setImgError(true)}
        className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-xs border border-blue-200 dark:border-blue-800 flex-shrink-0">
      {getInitials(client)}
    </div>
  );
};

export default function CustomPricePackageDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Package Details State
  const [packageDetails, setPackageDetails] = useState(null);

  // Services State
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [allServices, setAllServices] = useState([]); // For dropdown

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    service_id: '',
    discount_type: 'percentage',
    discount_value: 0
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  // Refs to prevent duplicate in-flight requests
  const fetchDetailsRef = useRef(false);
  const fetchServicesRef = useRef(false);
  const fetchAllServicesRef = useRef(false);

  // Fetch package details only when id changes
  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  // Fetch services only when on the services tab
  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices();
      fetchAllServices();
    }
  }, [id, activeTab]);

  const fetchPackageDetails = async () => {
    if (fetchDetailsRef.current) return;
    fetchDetailsRef.current = true;
    try {
      setLoading(true);
      const res = await apiCall(`/api/admin/custom-price-packages/details/${id}`);
      const data = await res.json();
      if (data.success) {
        setPackageDetails(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch package details');
      }
    } catch (error) {
      toast.error('Error fetching package details');
    } finally {
      setLoading(false);
      fetchDetailsRef.current = false;
    }
  };

  const fetchServices = async () => {
    if (fetchServicesRef.current) return;
    fetchServicesRef.current = true;
    setServicesLoading(true);
    try {
      const res = await apiCall(`/api/admin/custom-price-services/list/${id}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (error) {
      toast.error('Error fetching services');
    } finally {
      fetchServicesRef.current = false;
      setServicesLoading(false);
    }
  };

  const fetchAllServices = async () => {
    if (fetchAllServicesRef.current || allServices.length > 0) return;
    fetchAllServicesRef.current = true;
    try {
      const res = await apiCall('/api/admin/services/list?status=1&limit=1000');
      const data = await res.json();
      if (data.success) {
        const servicesArray = data.data?.services || data.data || [];
        setAllServices(Array.isArray(servicesArray) ? servicesArray : []);
      }
    } catch (error) {
      // silently fail
    } finally {
      fetchAllServicesRef.current = false;
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (activeTab === 'services') {
        await Promise.all([fetchPackageDetails(), fetchServices()]);
      } else {
        await fetchPackageDetails();
      }
      toast.success('Refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenAddServiceModal = () => {
    setEditingService(null);
    setServiceFormData({ service_id: '', discount_type: 'percentage', discount_value: 0 });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditServiceModal = (service) => {
    setEditingService(service);
    setServiceFormData({
      service_id: service.service_id,
      discount_type: service.discount_type,
      discount_value: service.discount_value
    });
    setIsServiceModalOpen(true);
  };

  const handleDeleteServiceClick = (serviceId) => {
    setServiceToDelete(serviceId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      const res = await apiCall(`/api/admin/custom-price-services/delete`, 'DELETE', [serviceToDelete]);
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(data.message || 'Service removed successfully');
        fetchServices();
      } else {
        toast.error(data.message || 'Failed to remove service');
      }
    } catch (error) {
      toast.error('Error removing service');
    } finally {
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!editingService && !serviceFormData.service_id) {
      return toast.error('Please select a service');
    }
    setFormSubmitting(true);
    try {
      let res, data;
      if (editingService) {
        res = await apiCall(`/api/admin/custom-price-services/update`, 'PUT', [
          {
            id: editingService.id,
            discount_type: serviceFormData.discount_type,
            discount_value: Number(serviceFormData.discount_value)
          }
        ]);
      } else {
        res = await apiCall(`/api/admin/custom-price-services/create`, 'POST', {
          package_id: id,
          services: [
            {
              service_id: serviceFormData.service_id,
              discount_type: serviceFormData.discount_type,
              discount_value: Number(serviceFormData.discount_value)
            }
          ]
        });
      }

      data = await res.json();
      if (data.success || res.ok) {
        toast.success(data.message || `Service ${editingService ? 'updated' : 'added'} successfully`);
        setIsServiceModalOpen(false);
        fetchServices();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading && !packageDetails) {
    return <PageContentSkeleton />;
  }

  const columns = [
    { key: 'service_name', label: 'Service Name', render: (row) => <span className="font-medium">{row.service_name}</span> },
    { key: 'service_type', label: 'Type' },
    { key: 'base_price', label: 'Base Price', render: (row) => `₹${row.base_price}` },
    { key: 'discount_type', label: 'Discount Type', render: (row) => <span className="capitalize">{row.discount_type}</span> },
    { key: 'discount_value', label: 'Discount Value', render: (row) => row.discount_type === 'percentage' ? `${row.discount_value}%` : `₹${row.discount_value}` }
  ];

  const getActions = (row) => [
    {
      label: 'Edit',
      icon: <Edit size={15} />,
      onClick: () => handleOpenEditServiceModal(row),
      className: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: () => handleDeleteServiceClick(row.id),
      className: 'text-red-600 dark:text-red-400'
    }
  ];

  const assignedClients = packageDetails?.assigned_clients || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/custom-price-packages')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {packageDetails?.name}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">Package ID: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
            className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {activeTab === 'services' && (
            <button
              onClick={handleOpenAddServiceModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md shadow-blue-300"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Add Service</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'services'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Service Items
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Package Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2.5 mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Package className="text-blue-500" size={16} /> Package Information
              </h2>
              <StatusBadge status={packageDetails?.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Name</p>
                <p className="text-sm text-gray-900 dark:text-white">{packageDetails?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Description</p>
                <p className="text-sm text-gray-900 dark:text-white">{packageDetails?.description || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none mb-1">Created</p>
                  <p className="text-xs text-gray-900 dark:text-white leading-tight">
                    {formatDateTime(packageDetails?.create_date)}
                    <span className="text-gray-400 dark:text-gray-500 font-mono ml-1.5">· {packageDetails?.create_by || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none mb-1">Last Modified</p>
                  <p className="text-xs text-gray-900 dark:text-white leading-tight">
                    {formatDateTime(packageDetails?.modify_date)}
                    <span className="text-gray-400 dark:text-gray-500 font-mono ml-1.5">· {packageDetails?.modify_by || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Clients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2.5 mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Users className="text-blue-500" size={16} /> Assigned Clients
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                {assignedClients.length}
              </span>
            </div>

            {assignedClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <User className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No clients assigned</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This package hasn't been assigned to any client yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {assignedClients.map((client) => (
                  <div
                    key={client.username}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40"
                  >
                    <ClientAvatar client={client} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{getFullName(client)}</p>
                        <StatusBadge status={client.status} />
                      </div>
                      {(client.email || client.mobile) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          {client.email ? <Mail size={11} className="flex-shrink-0" /> : <Phone size={11} className="flex-shrink-0" />}
                          {client.email || client.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          {servicesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading services…</p>
            </div>
          ) : (
            <ManagementTable
              columns={columns}
              rows={services}
              rowKey="id"
              getActions={getActions}
              emptyState={
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Tag className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No services added</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a service to this custom price package.</p>
                </div>
              }
            />
          )}
        </div>
      )}

      {/* Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? 'Edit Service Discount' : 'Add Service'}
        icon={Tag}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              form="service-form"
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Service'}
            </button>
          </>
        }
      >
        <form id="service-form" onSubmit={handleServiceSubmit} className="p-5 space-y-4">
          {!editingService && (
            <div className="relative z-20">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Select Service</label>
              <SelectField
                options={allServices.map(s => ({ value: s.service_id, label: s.name }))}
                value={allServices.map(s => ({ value: s.service_id, label: s.name })).find(o => o.value === serviceFormData.service_id) || null}
                onChange={(selectedOption) => setServiceFormData({ ...serviceFormData, service_id: selectedOption ? selectedOption.value : '' })}
                placeholder="-- Select a service --"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Discount Type</label>
              <SelectField
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'flat', label: 'Flat Amount (₹)' }
                ]}
                value={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'flat', label: 'Flat Amount (₹)' }
                ].find(o => o.value === serviceFormData.discount_type) || { value: 'percentage', label: 'Percentage (%)' }}
                onChange={(selectedOption) => setServiceFormData({ ...serviceFormData, discount_type: selectedOption ? selectedOption.value : 'percentage' })}
                isClearable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Discount Value</label>
              <input
                type="text"
                required
                placeholder="e.g. 10"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100"
                value={serviceFormData.discount_value}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setServiceFormData({ ...serviceFormData, discount_value: val });
                  }
                }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        icon={Trash2}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteService}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          </>
        }
      >
        <div className="p-5">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to remove this service from the package? This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}