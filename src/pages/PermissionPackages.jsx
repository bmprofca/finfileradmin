import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Plus, Edit, Trash2, CheckCircle, XCircle,
  Shield, Eye, Package, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import apiCall from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const isActive = status === true || status === 1;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
      : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
      }`}>
      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

// ─── View Package Modal ───────────────────────────────────────────────────────

const ViewPackageModal = ({ pkg, allPermissions, onClose, onEdit }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Package Details"
    icon={Package}
    size="lg"
    contentClassName="p-5 space-y-4"
    footer={
      <button
        onClick={() => onEdit(pkg)}
        className="px-5 py-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2"
      >
        <Edit size={16} /> Edit Package
      </button>
    }
  >
    <div className="flex items-start gap-4 pb-4 border-b dark:border-gray-700">
      <div className="p-3 rounded-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
        <Package size={22} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{pkg.name}</h3>
        {pkg.remark && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pkg.remark}</p>}
        <div className="mt-2"><StatusBadge status={pkg.status} /></div>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <Shield size={14} className="text-indigo-500" />
        Assigned Permissions ({pkg.assigned_permissions?.length || 0})
      </h4>
      {pkg.assigned_permissions?.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pkg.assigned_permissions.map((permId) => {
            const perm = allPermissions.find((p) => p.permission_id === permId);
            return (
              <span
                key={permId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-medium"
              >
                <Shield size={11} />
                {perm ? perm.name : permId}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No permissions assigned</p>
      )}
    </div>

    <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-2 border-t dark:border-gray-700">
      <p>ID: <span className="font-mono">{pkg.permission_package_id}</span></p>
      {pkg.create_date && <p>Created: {new Date(pkg.create_date).toLocaleString()}</p>}
    </div>
  </Modal>
);

// ─── Package Form Modal ───────────────────────────────────────────────────────

const PackageFormModal = ({ pkg, allPermissions, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!pkg;
  const [form, setForm] = useState({
    name: pkg?.name || '',
    remark: pkg?.remark || '',
    status: pkg?.status ?? true,
    assigned_permissions: pkg?.assigned_permissions || [],
  });

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm dark:text-gray-100';

  const togglePermission = (permId) => {
    setForm((f) => ({
      ...f,
      assigned_permissions: f.assigned_permissions.includes(permId)
        ? f.assigned_permissions.filter((id) => id !== permId)
        : [...f.assigned_permissions, permId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Package name is required.'); return; }
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Permission Package' : 'Create Permission Package'}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="pkg-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Package' : 'Create Package'}
        </button>
      }
    >
      <form id="pkg-form" onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Package Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Standard Support Staff"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Remark
            </label>
            <textarea
              rows={2}
              value={form.remark}
              onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
              placeholder="Brief description of this permission package..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Status
            </label>
            <div className="flex gap-3">
              {[{ label: 'Active', value: true }, { label: 'Inactive', value: false }].map(({ label, value }) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: value }))}
                  className={`flex-1 py-2.5 rounded-sm border text-sm font-semibold transition-all ${form.status === value
                    ? value
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300 shadow-sm'
                      : 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />

        {/* Permissions Checkbox Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Assign Permissions
            </label>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              {form.assigned_permissions.length} selected
            </span>
          </div>

          {allPermissions.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">
              No permissions available
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {allPermissions.map((perm) => {
                const selected = form.assigned_permissions.includes(perm.permission_id);
                return (
                  <button
                    key={perm.permission_id}
                    type="button"
                    onClick={() => togglePermission(perm.permission_id)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-sm border text-left transition-all ${selected
                      ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-600'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                      {selected && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                        {perm.name}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{perm.module}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </form>
    </Modal>
  );
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteModal = ({ pkg, onClose, onConfirm, isDeleting }) => (
  <Modal
    isOpen={true}
    onClose={() => !isDeleting && onClose()}
    title="Delete Permission Package"
    icon={Trash2}
    size="md"
    closeText="Cancel"
    footer={
      <button
        disabled={isDeleting}
        onClick={onConfirm}
        className="px-5 py-2.5 rounded-sm bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
      </button>
    }
  >
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
        <AlertTriangle size={28} className="text-red-500 dark:text-red-400" />
      </div>
      <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
        Are you sure you want to delete the package{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-100">"{pkg.name}"</span>?
        This action cannot be undone.
      </div>
    </div>
  </Modal>
);

// ─── Package Card (card view) ─────────────────────────────────────────────────

const PackageManagementCard = ({ pkg, index, allPermissions, onView, onEdit, onDelete }) => (
  <ManagementCard
    key={pkg.permission_package_id}
    delay={index * 0.05}
    accent="indigo"
    eyebrow={`${pkg.assigned_permissions?.length || 0} permission${pkg.assigned_permissions?.length !== 1 ? 's' : ''}`}
    title={pkg.name}
    subtitle={pkg.remark || ''}
    icon={
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
        <Package size={14} />
      </div>
    }
    badge={<StatusBadge status={pkg.status} />}
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(pkg), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400' },
      { label: 'Edit', icon: <Edit size={12} />, onClick: () => onEdit(pkg), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400' },
      { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => onDelete(pkg), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400' },
    ]}
    menuId={`pkg-card-${pkg.permission_package_id}`}
  >
    {pkg.assigned_permissions?.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {pkg.assigned_permissions.slice(0, 3).map((permId) => {
          const perm = allPermissions.find((p) => p.permission_id === permId);
          return (
            <span
              key={permId}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[10px] font-medium"
            >
              {perm ? perm.name : permId}
            </span>
          );
        })}
        {pkg.assigned_permissions.length > 3 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-medium">
            +{pkg.assigned_permissions.length - 3} more
          </span>
        )}
      </div>
    )}
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PermissionPackages() {
  const [packages, setPackages] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPkg, setDeletingPkg] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch all permissions — lazy, only loaded when form modal is first opened ─
  // Guard ref: ensures the API is only called once, not on every modal open
  const permissionsLoadedRef = useRef(false);
  const fetchAllPermissions = async () => {
    if (permissionsLoadedRef.current) return; // already fetched, skip
    permissionsLoadedRef.current = true;
    try {
      const res = await apiCall('/api/admin/permissions/list', 'GET');
      const data = await res.json();
      if (data.success) setAllPermissions(data.data || []);
    } catch {
      // reset so a retry is possible on next open
      permissionsLoadedRef.current = false;
    }
  };

  // ── Fetch packages ─────────────────────────────────────────────────────────
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/admin/permissions/package/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setPackages(data.data || []);
        setTotalItems(data.pagination?.total_records || 0);
      } else {
        toast.error(data.message || 'Failed to fetch packages.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Guard ref: prevents fetchPackages being called twice when deps haven't changed
  const lastFetchRef = useRef({ page: null, search: null, limit: null });
  useEffect(() => {
    if (
      lastFetchRef.current.page === currentPage &&
      lastFetchRef.current.search === searchTerm &&
      lastFetchRef.current.limit === itemsPerPage
    ) return;
    lastFetchRef.current = { page: currentPage, search: searchTerm, limit: itemsPerPage };
    fetchPackages();
  }, [currentPage, searchTerm, itemsPerPage]);

  // NOTE: fetchAllPermissions is NOT called here at mount.
  // It is called lazily inside handleCreateNew / handleEdit when the form modal first opens.

  const handleRefresh = () => { setRefreshing(true); fetchPackages(); };
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (pkg) => { setSelectedPkg(pkg); setIsViewModalOpen(true); };

  // Fetch permissions lazily on first form open (create or edit)
  const handleEdit = (pkg) => {
    fetchAllPermissions(); // lazy: no-op if already fetched
    setEditingPkg(pkg);
    setIsFormModalOpen(true);
    setIsViewModalOpen(false);
  };
  const handleCreateNew = () => {
    fetchAllPermissions(); // lazy: no-op if already fetched
    setEditingPkg(null);
    setIsFormModalOpen(true);
  };
  const handleDeleteRequest = (pkg) => { setDeletingPkg(pkg); setIsDeleteModalOpen(true); };

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const isEdit = !!editingPkg;
      const endpoint = isEdit
        ? `/api/admin/permissions/package/update/${editingPkg.permission_package_id}`
        : '/api/admin/permissions/package/create';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiCall(endpoint, method, formData);
      const json = await res.json();

      if (json.success) {
        setIsFormModalOpen(false);
        fetchPackages();
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deletingPkg) return;
    setIsDeleting(true);
    try {
      const res = await apiCall(
        `/api/admin/permissions/package/delete/${deletingPkg.permission_package_id}`,
        'DELETE'
      );
      const json = await res.json();
      if (json.success) {
        setIsDeleteModalOpen(false);
        setDeletingPkg(null);
        fetchPackages();
      } else {
        toast.error(json.message || 'Failed to delete package.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Package Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <Package size={14} />
          </div>
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'assigned_permissions',
      label: 'Permissions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.assigned_permissions || []).slice(0, 2).map((permId) => {
            const perm = allPermissions.find((p) => p.permission_id === permId);
            return (
              <span
                key={permId}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[10px] font-medium"
              >
                {perm ? perm.name : permId}
              </span>
            );
          })}
          {(row.assigned_permissions?.length || 0) > 2 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              +{row.assigned_permissions.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'remark',
      label: 'Remark',
      render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400">{row.remark || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Permission Packages"
      description="Create and manage permission packages to assign to staff roles."
      accent="indigo"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button
          onClick={handleCreateNew}
          variant="primary"
          className="flex items-center gap-2 text-sm py-1.5 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Package
        </Button>
      }
    >
      <div className="space-y-3 mt-2">

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-sm border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search permission packages..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> packages
              {searchTerm && <span className="ml-1 text-indigo-600 dark:text-indigo-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={6} columns={4} />}

        {/* Empty State */}
        {!loading && packages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50"
          >
            <Package className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No packages found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No permission packages created yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
              >
                <Plus size={16} /> Create First Package
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && packages.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-sm bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50"
            >
              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={packages}
                  rowKey="permission_package_id"
                  getActions={(row) => [
                    { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400' },
                    { label: 'Edit Package', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400' },
                    { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => handleDeleteRequest(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400' },
                  ]}
                  accent="indigo"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {packages.map((pkg, index) => (
                      <PackageManagementCard
                        key={pkg.permission_package_id}
                        pkg={pkg}
                        index={index}
                        allPermissions={allPermissions}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                      />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <PaginationComponent
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onLimitChange={handleLimitChange}
                availableLimits={[10, 20, 50, 100]}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedPkg && (
          <ViewPackageModal
            pkg={selectedPkg}
            allPermissions={allPermissions}
            onClose={() => { setIsViewModalOpen(false); setSelectedPkg(null); }}
            onEdit={handleEdit}
          />
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <PackageFormModal
            pkg={editingPkg}
            allPermissions={allPermissions}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingPkg && (
          <DeleteModal
            pkg={deletingPkg}
            onClose={() => { setIsDeleteModalOpen(false); setDeletingPkg(null); }}
            onConfirm={confirmDelete}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
