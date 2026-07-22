import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Users, CheckCircle, XCircle, Search, X, ChevronRight, ChevronLeft, UserPlus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { apiCall } from '../utils/apiCall';
import SelectField from '../components/common/SelectField';

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

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
  { value: 'deleted', label: 'Deleted' }
];

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

  // View Assigned Clients Modal
  const [isViewAssignedModalOpen, setIsViewAssignedModalOpen] = useState(false);
  const [viewAssignedPackage, setViewAssignedPackage] = useState(null);

  // Quick Add Service Modal
  const [isQuickServiceModalOpen, setIsQuickServiceModalOpen] = useState(false);
  const [quickServicePackageId, setQuickServicePackageId] = useState(null);
  const [quickServiceFormData, setQuickServiceFormData] = useState({ service_id: '', discount_type: 'percentage', discount_value: '' });
  const [quickServiceSubmitting, setQuickServiceSubmitting] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [fetchingServices, setFetchingServices] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({ name: '', description: '', status: true });
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Assign Modal State
  const [availableClients, setAvailableClients] = useState([]);
  const [assignedClients, setAssignedClients] = useState([]);
  const [availableSearch, setAvailableSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [selectedAvailable, setSelectedAvailable] = useState([]);
  const [selectedAssigned, setSelectedAssigned] = useState([]);
  const [fetchingClients, setFetchingClients] = useState(false);

  // Pagination & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Refs to prevent duplicate in-flight requests
  const fetchPackagesRef = useRef(false);
  const fetchClientsRef = useRef(false);
  const fetchAllServicesRef = useRef(false);

  const fetchPackages = useCallback(async () => {
    if (fetchPackagesRef.current) return;
    fetchPackagesRef.current = true;
    try {
      setLoading(true);
      const res = await apiCall(`/api/admin/custom-price-packages/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setPackages(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || 1);
          setTotalItems(data.pagination.total_records || 0);
        }
      } else {
        toast.error(data.message || 'Failed to fetch packages');
      }
    } catch (error) {
      toast.error('Error fetching packages');
    } finally {
      setLoading(false);
      fetchPackagesRef.current = false;
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchPackages]);

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

  const fetchClientsForAssign = async (pkg) => {
    if (fetchClientsRef.current) return;
    fetchClientsRef.current = true;
    setFetchingClients(true);
    try {
      const res = await apiCall('/api/admin/clients/list?page_no=1&limit=1000&search=');
      const data = await res.json();
      if (data.success && data.data && data.data.clients) {
        const allClients = data.data.clients;
        const currentlyAssigned = pkg?.assigned_clients || [];
        const assignedUsernames = currentlyAssigned.map(c => c.username);
        const available = allClients.filter(c => !assignedUsernames.includes(c.username));
        const finalAssigned = currentlyAssigned.map(ac => allClients.find(c => c.username === ac.username) || ac);
        setAvailableClients(available);
        setAssignedClients(finalAssigned);
        setSelectedAvailable([]);
        setSelectedAssigned([]);
        setAvailableSearch('');
        setAssignedSearch('');
      } else {
        toast.error('Failed to fetch clients');
      }
    } catch (error) {
      toast.error('Error fetching clients');
    } finally {
      setFetchingClients(false);
      fetchClientsRef.current = false;
    }
  };

  const fetchAllServicesForQuickAdd = async () => {
    if (fetchAllServicesRef.current || allServices.length > 0) return;
    fetchAllServicesRef.current = true;
    setFetchingServices(true);
    try {
      const res = await apiCall('/api/admin/services/list?status=1&limit=1000');
      const data = await res.json();
      if (data.success) {
        const arr = data.data?.services || data.data || [];
        setAllServices(Array.isArray(arr) ? arr : []);
      }
    } catch {
      // silently fail
    } finally {
      setFetchingServices(false);
      fetchAllServicesRef.current = false;
    }
  };

  const handleOpenAssignModal = (pkg) => {
    setAssignPackageId(pkg.package_id);
    setIsAssignModalOpen(true);
    fetchClientsForAssign(pkg);
  };

  const handleMoveToAssigned = () => {
    const toMove = availableClients.filter(c => selectedAvailable.includes(c.username));
    setAssignedClients(prev => [...prev, ...toMove]);
    setAvailableClients(prev => prev.filter(c => !selectedAvailable.includes(c.username)));
    setSelectedAvailable([]);
  };

  const handleMoveToAvailable = () => {
    const toMove = assignedClients.filter(c => selectedAssigned.includes(c.username));
    setAvailableClients(prev => [...prev, ...toMove]);
    setAssignedClients(prev => prev.filter(c => !selectedAssigned.includes(c.username)));
    setSelectedAssigned([]);
  };

  const toggleSelectAvailable = (username) => {
    setSelectedAvailable(prev => 
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const toggleSelectAssigned = (username) => {
    setSelectedAssigned(prev => 
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };
  
  const filteredAvailable = availableClients.filter(c => 
    (c.full_name || '').toLowerCase().includes(availableSearch.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(availableSearch.toLowerCase()) ||
    (c.mobile || '').toLowerCase().includes(availableSearch.toLowerCase())
  );
  
  const filteredAssigned = assignedClients.filter(c => 
    (c.full_name || '').toLowerCase().includes(assignedSearch.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(assignedSearch.toLowerCase()) ||
    (c.mobile || '').toLowerCase().includes(assignedSearch.toLowerCase())
  );

  const handleSelectAllAvailable = () => {
    if (selectedAvailable.length === filteredAvailable.length && filteredAvailable.length > 0) {
      setSelectedAvailable([]);
    } else {
      setSelectedAvailable(filteredAvailable.map(c => c.username));
    }
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
    if (e) e.preventDefault();
    if (assignedClients.length === 0) return toast.error("At least one client must be assigned");
    const usernames = assignedClients.map(c => c.username);

    setFormSubmitting(true);
    try {
      const res = await apiCall('/api/admin/custom-price-packages/assign', 'PUT', {
        package_id: assignPackageId,
        client_usernames: usernames
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        toast.success(data.message || 'Package assigned successfully');
        setIsAssignModalOpen(false);
        fetchPackages(); // refresh list to show updated count
      } else {
        toast.error(data.message || 'Failed to assign package');
      }
    } catch (error) {
      toast.error('Error assigning package');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenQuickServiceModal = (pkg) => {
    setQuickServicePackageId(pkg.package_id);
    setQuickServiceFormData({ service_id: '', discount_type: 'percentage', discount_value: '' });
    setIsQuickServiceModalOpen(true);
    fetchAllServicesForQuickAdd();
  };

  const handleQuickServiceSubmit = async (e) => {
    e.preventDefault();
    if (!quickServiceFormData.service_id) return toast.error('Please select a service');
    if (!quickServiceFormData.discount_value) return toast.error('Please enter a discount value');
    setQuickServiceSubmitting(true);
    try {
      const res = await apiCall('/api/admin/custom-price-services/create', 'POST', {
        package_id: quickServicePackageId,
        services: [{
          service_id: quickServiceFormData.service_id,
          discount_type: quickServiceFormData.discount_type,
          discount_value: Number(quickServiceFormData.discount_value)
        }]
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(data.message || 'Service added successfully');
        setIsQuickServiceModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to add service');
      }
    } catch {
      toast.error('Failed to add service');
    } finally {
      setQuickServiceSubmitting(false);
    }
  };

  const isActive = (row) => row.status === 1 || row.status === true;

  const columns = [
    { key: 'name', label: 'Package Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'description', label: 'Description' },
    { key: 'assigned', label: 'Assigned To', render: (row) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setViewAssignedPackage(row); setIsViewAssignedModalOpen(true); }}
        className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group"
      >
        <Users size={14} />
        <span className="text-sm font-medium underline-offset-2 group-hover:underline">{row.assigned_clients?.length || 0}</span>
      </button>
    ) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'create_date', label: 'Created At', render: (row) => new Date(row.create_date).toLocaleDateString() }
  ];

  const getActions = (row) => {
    if (!isActive(row)) return [];
    return [
      {
        label: 'Assign Clients',
        icon: <Users size={15} />,
        onClick: () => handleOpenAssignModal(row),
        className: 'text-blue-600 dark:text-blue-400'
      },
      {
        label: 'Add Service',
        icon: <Tag size={15} />,
        onClick: () => handleOpenQuickServiceModal(row),
        className: 'text-emerald-600 dark:text-emerald-400'
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
  };



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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-10 py-2 h-[42px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100"
                />
                {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="w-full lg:w-48 relative z-10">
                <SelectField
                  options={statusOptions}
                  value={statusOptions.find(o => o.value === statusFilter) || statusOptions[0]}
                  onChange={(selectedOption) => {
                    setStatusFilter(selectedOption ? selectedOption.value : '');
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <PageContentSkeleton />
          ) : (
            <>
              <ManagementTable
                columns={columns}
                rows={packages}
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
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
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
        size="lg"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Package Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Premium Plan"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100 resize-none"
              rows="3"
              placeholder="Brief description of this package..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="package-status"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
            />
            <label htmlFor="package-status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Package to Clients"
        icon={Users}
        size="4xl"
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
              onClick={handleAssignSubmit}
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Assigning...' : 'Assign'}
            </button>
          </>
        }
      >
        <div className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Use the arrow buttons to move clients between available and assigned lists.
          </p>
          <div className="flex flex-col md:flex-row gap-4 h-[450px]">
            {/* Left: Available */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <UserPlus size={16} className="text-blue-500" />
                  Available ({filteredAvailable.length})
                </div>
                <button 
                  type="button" 
                  onClick={handleSelectAllAvailable} 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {selectedAvailable.length === filteredAvailable.length && filteredAvailable.length > 0 ? 'None' : 'All'}
                </button>
              </div>
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search available..." 
                    value={availableSearch}
                    onChange={e => setAvailableSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {fetchingClients ? (
                  <div className="text-center py-10 text-sm text-gray-500">Loading...</div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">No available clients</div>
                ) : (
                  filteredAvailable.map(client => (
                    <div 
                      key={client.username}
                      onClick={() => toggleSelectAvailable(client.username)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${selectedAvailable.includes(client.username) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0 overflow-hidden">
                        {client.image ? <img src={client.image.startsWith('http') ? client.image : `https://server.finfiler.com/api/media/${client.image}`} className="w-full h-full object-cover" alt="" /> : (client.first_name ? client.first_name.charAt(0) : client.username.charAt(0))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{client.full_name || client.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          {client.mobile} {client.username && `• ${client.username}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center Actions */}
            <div className="flex md:flex-col justify-center items-center gap-3 py-2 md:py-0">
              <button
                type="button"
                disabled={selectedAvailable.length === 0}
                onClick={handleMoveToAssigned}
                className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <ChevronRight size={18} className="hidden md:block" />
                <ChevronRight size={18} className="block md:hidden rotate-90" />
              </button>
              <div className="text-xs text-gray-400 dark:text-gray-500 font-medium w-12 text-center">
                {selectedAvailable.length > 0 || selectedAssigned.length > 0 ? `${selectedAvailable.length || selectedAssigned.length}` : '0 / 0'}
              </div>
              <button
                type="button"
                disabled={selectedAssigned.length === 0}
                onClick={handleMoveToAvailable}
                className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <ChevronLeft size={18} className="hidden md:block" />
                <ChevronLeft size={18} className="block md:hidden rotate-90" />
              </button>
            </div>

            {/* Right: Assigned */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Users size={16} className="text-emerald-500" />
                  Assigned ({filteredAssigned.length})
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (selectedAssigned.length === filteredAssigned.length && filteredAssigned.length > 0) {
                      setSelectedAssigned([]);
                    } else {
                      setSelectedAssigned(filteredAssigned.map(c => c.username));
                    }
                  }} 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {selectedAssigned.length === filteredAssigned.length && filteredAssigned.length > 0 ? 'None' : 'All'}
                </button>
              </div>
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search assigned..." 
                    value={assignedSearch}
                    onChange={e => setAssignedSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredAssigned.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Users size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                    <div className="text-sm text-gray-500 dark:text-gray-400">No staff assigned</div>
                  </div>
                ) : (
                  filteredAssigned.map(client => (
                    <div 
                      key={client.username}
                      onClick={() => toggleSelectAssigned(client.username)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${selectedAssigned.includes(client.username) ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0 overflow-hidden">
                        {client.image ? <img src={client.image.startsWith('http') ? client.image : `https://server.finfiler.com/api/media/${client.image}`} className="w-full h-full object-cover" alt="" /> : (client.first_name ? client.first_name.charAt(0) : client.username.charAt(0))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{client.full_name || client.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          {client.mobile} {client.username && `• ${client.username}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
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

      {/* View Assigned Clients Modal */}
      <Modal
        isOpen={isViewAssignedModalOpen}
        onClose={() => { setIsViewAssignedModalOpen(false); setViewAssignedPackage(null); }}
        title={`Assigned Clients — ${viewAssignedPackage?.name || ''}`}
        icon={Users}
        size="lg"
      >
        <div className="p-5">
          {(!viewAssignedPackage?.assigned_clients || viewAssignedPackage.assigned_clients.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No clients assigned to this package.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {viewAssignedPackage.assigned_clients.map((client, idx) => (
                <div key={client.username || idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0 overflow-hidden">
                    {client.image
                      ? <img src={client.image.startsWith('http') ? client.image : `https://server.finfiler.com/api/media/${client.image}`} className="w-full h-full object-cover" alt="" />
                      : (client.first_name ? client.first_name.charAt(0).toUpperCase() : client.username?.charAt(0).toUpperCase())}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {[client.first_name, client.middle_name, client.last_name].filter(Boolean).join(' ') || client.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {client.mobile && <span>{client.mobile}</span>}
                      {client.mobile && client.email && <span className="mx-1">·</span>}
                      {client.email && <span>{client.email}</span>}
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${client.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {client.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Quick Add Service Modal */}
      <Modal
        isOpen={isQuickServiceModalOpen}
        onClose={() => setIsQuickServiceModalOpen(false)}
        title="Quick Add Service"
        icon={Tag}
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setIsQuickServiceModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button form="quick-service-form" type="submit" disabled={quickServiceSubmitting} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {quickServiceSubmitting ? 'Adding...' : 'Add Service'}
            </button>
          </>
        }
      >
        <form id="quick-service-form" onSubmit={handleQuickServiceSubmit} className="p-5 space-y-4">
          <div className="relative z-20">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Select Service</label>
            <SelectField
              options={allServices.map(s => ({ value: s.service_id, label: s.name }))}
              value={allServices.map(s => ({ value: s.service_id, label: s.name })).find(o => o.value === quickServiceFormData.service_id) || null}
              onChange={(opt) => setQuickServiceFormData(prev => ({ ...prev, service_id: opt ? opt.value : '' }))}
              placeholder={fetchingServices ? 'Loading services...' : '-- Select a service --'}
              isDisabled={fetchingServices}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Discount Type</label>
              <SelectField
                options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'flat', label: 'Flat Amount (₹)' }]}
                value={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'flat', label: 'Flat Amount (₹)' }].find(o => o.value === quickServiceFormData.discount_type) || { value: 'percentage', label: 'Percentage (%)' }}
                onChange={(opt) => setQuickServiceFormData(prev => ({ ...prev, discount_type: opt ? opt.value : 'percentage' }))}
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
                value={quickServiceFormData.discount_value}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setQuickServiceFormData(prev => ({ ...prev, discount_value: val }));
                }}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
