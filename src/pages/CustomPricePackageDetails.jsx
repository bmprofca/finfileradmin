import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Tag, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { apiCall } from '../utils/apiCall';

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

export default function CustomPricePackageDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Package Details State
  const [packageDetails, setPackageDetails] = useState(null);

  // Services State
  const [services, setServices] = useState([]);
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

  useEffect(() => {
    fetchPackageDetails();
    if (activeTab === 'services') {
      fetchServices();
      fetchAllServices();
    }
  }, [id, activeTab]);

  const fetchPackageDetails = async () => {
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
    }
  };

  const fetchServices = async () => {
    try {
      const res = await apiCall(`/api/admin/custom-price-services/list/${id}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (error) {
      toast.error('Error fetching services');
    }
  };

  const fetchAllServices = async () => {
    try {
      const res = await apiCall('/api/admin/services/list?status=1&limit=1000');
      const data = await res.json();
      if (data.success) {
        const servicesArray = data.data?.services || data.data || [];
        setAllServices(Array.isArray(servicesArray) ? servicesArray : []);
      }
    } catch (error) {
      // It's okay if this fails quietly
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/custom-price-packages')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {packageDetails?.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Package ID: {id}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="text-blue-500" size={20} /> Package Information
            </h2>
            <StatusBadge status={packageDetails?.status} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</p>
              <p className="text-base text-gray-900 dark:text-white">{packageDetails?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
              <p className="text-base text-gray-900 dark:text-white">{packageDetails?.description || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</p>
              <p className="text-base text-gray-900 dark:text-white">
                {packageDetails?.create_date ? new Date(packageDetails.create_date).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created By</p>
              <p className="text-base text-gray-900 dark:text-white font-mono text-sm">{packageDetails?.create_by || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Items</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage the services and custom discounts for this package.</p>
            </div>
            <button
              onClick={handleOpenAddServiceModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> Add Service
            </button>
          </div>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Service</label>
              <select
                required
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2"
                value={serviceFormData.service_id}
                onChange={(e) => setServiceFormData({ ...serviceFormData, service_id: e.target.value })}
              >
                <option value="">-- Select a service --</option>
                {allServices.map(s => (
                  <option key={s.service_id} value={s.service_id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Type</label>
              <select
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2"
                value={serviceFormData.discount_type}
                onChange={(e) => setServiceFormData({ ...serviceFormData, discount_type: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Value</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2"
                value={serviceFormData.discount_value}
                onChange={(e) => setServiceFormData({ ...serviceFormData, discount_value: e.target.value })}
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
