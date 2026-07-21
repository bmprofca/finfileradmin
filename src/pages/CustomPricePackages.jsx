import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Users, CheckCircle, XCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
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

export default function CustomPricePackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignPackageId, setAssignPackageId] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({ name: '', description: '', status: true });
  const [assignUsernames, setAssignUsernames] = useState(''); // Comma-separated
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Pagination & Filter (Optional if supported by API, typically client-side if not)
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/api/admin/custom-price-packages/list');
      const data = await res.json();
      if (data.success) {
        setPackages(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch packages');
      }
    } catch (error) {
      toast.error('Error fetching packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setFormData({ name: '', description: '', status: true });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({ name: pkg.name, description: pkg.description, status: pkg.status });
    setIsFormModalOpen(true);
  };

  const handleOpenAssignModal = (pkg) => {
    setAssignPackageId(pkg.package_id);
    setAssignUsernames('');
    setIsAssignModalOpen(true);
  };

  const handleDeleteClick = (package_id) => {
    setPackageToDelete(package_id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    
    try {
      const res = await apiCall(`/api/admin/custom-price-packages/delete/${packageToDelete}`, 'DELETE');
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(data.message || 'Package deleted successfully');
        fetchPackages();
      } else {
        toast.error(data.message || 'Failed to delete package');
      }
    } catch (error) {
      toast.error('Error deleting package');
    } finally {
      setIsDeleteModalOpen(false);
      setPackageToDelete(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");

    setFormSubmitting(true);
    try {
      let res, data;
      if (editingPackage) {
        res = await apiCall(`/api/admin/custom-price-packages/update/${editingPackage.package_id}`, 'PUT', formData);
      } else {
        res = await apiCall('/api/admin/custom-price-packages/create', 'POST', formData);
      }
      data = await res.json();
      
      if (data.success || res.ok) {
        toast.success(data.message || `Package ${editingPackage ? 'updated' : 'created'} successfully`);
        setIsFormModalOpen(false);
        fetchPackages();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const usernames = assignUsernames.split(',').map(u => u.trim()).filter(Boolean);
    if (usernames.length === 0) return toast.error("At least one username is required");

    setFormSubmitting(true);
    try {
      const res = await apiCall('/api/admin/custom-price-packages/assign', 'POST', {
        package_id: assignPackageId,
        client_usernames: usernames
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        toast.success(data.message || 'Package assigned successfully');
        setIsAssignModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to assign package');
      }
    } catch (error) {
      toast.error('Error assigning package');
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Package Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'create_date', label: 'Created At', render: (row) => new Date(row.create_date).toLocaleDateString() }
  ];

  const getActions = (row) => [
    {
      label: 'Assign Clients',
      icon: <Users size={15} />,
      onClick: () => handleOpenAssignModal(row),
      className: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Edit',
      icon: <Edit size={15} />,
      onClick: () => handleOpenEditModal(row),
      className: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: () => handleDeleteClick(row.package_id),
      className: 'text-red-600 dark:text-red-400'
    }
  ];

  const filteredPackages = packages.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <ManagementHub
        title="Custom Price Packages"
        description="Manage custom pricing packages for your clients"
        onRefresh={fetchPackages}
        refreshing={loading}
        actions={
          <button 
            onClick={handleOpenCreateModal} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md shadow-blue-300"
          >
            <Plus size={16} /> <span className="hidden md:block">Create Package</span>
          </button>
        }
      >
        <div className="space-y-3 mt-2">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search packages by name, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 h-[42px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <PageContentSkeleton />
          ) : (
            <>
              <ManagementTable
                columns={columns}
                rows={paginatedPackages}
                rowKey="package_id"
                getActions={getActions}
                onRowClick={(row) => navigate(`/custom-price-packages/${row.package_id}`)}
                emptyState={
                  <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Package className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No packages found</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get started by creating a new custom price package.</p>
                  </div>
                }
              />
              
              <PaginationComponent
                currentPage={currentPage}
                totalPages={Math.ceil(filteredPackages.length / itemsPerPage) || 1}
                onPageChange={setCurrentPage}
                totalItems={filteredPackages.length}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
        </div>
      </ManagementHub>

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingPackage ? 'Edit Package' : 'Create Package'}
        icon={Package}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              form="package-form"
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Package'}
            </button>
          </>
        }
      >
        <form id="package-form" onSubmit={handleFormSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Name</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="package-status"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
            />
            <label htmlFor="package-status" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Package to Clients"
        icon={Users}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              form="assign-form"
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Assigning...' : 'Assign'}
            </button>
          </>
        }
      >
        <form id="assign-form" onSubmit={handleAssignSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Usernames</label>
            <textarea
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2"
              rows="3"
              placeholder="e.g. USER1, USER2"
              value={assignUsernames}
              onChange={(e) => setAssignUsernames(e.target.value)}
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">Enter a comma-separated list of client usernames.</p>
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
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="p-5">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this package? This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}
