import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, User, Phone, Mail,
  Plus, Trash2, Edit, CheckCircle, XCircle, Briefcase, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import apiCall, { uploadFile } from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StaffStatusBadge = ({ status }) => {
  const isActive = status === 1 || status === true || status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      isActive
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : 'bg-gray-100 text-gray-600 border-gray-200'
    }`}>
      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="dark:text-gray-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

const StaffAvatar = ({ staff, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const cls = sizes[size] || sizes.md;
  if (staff.image) {
    return <img src={staff.image} alt={staff.full_name} className={`${cls} rounded-xl object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {staff.full_name?.charAt(0)?.toUpperCase() || <User size={16} />}
    </div>
  );
};

// ─── View Staff Modal ─────────────────────────────────────────────────────────

const ViewStaffModal = ({ staff, onClose, onEdit, onDelete }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Staff Details"
    icon={User}
    size="2xl"
    contentClassName="p-5 space-y-4"
    footer={
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => onDelete(staff)}
          className="px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
        >
          <Trash2 size={16} /> Delete
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(staff)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Edit size={16} /> Edit Staff
          </button>
        </div>
      </div>
    }
  >
    {/* Avatar + Name */}
    <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
      <StaffAvatar staff={staff} size="lg" />
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{staff.full_name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{staff.username}</p>
        <div className="mt-1.5 flex gap-2 items-center">
          <StaffStatusBadge status={staff.status} />
        </div>
      </div>
    </div>

    {/* Info Grid */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <User className="text-blue-500 dark:text-blue-400" size={15} /> Contact & Personal Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem icon={User} label="Full Name" value={staff.full_name} />
        <InfoItem icon={User} label="Username" value={`@${staff.username}`} />
        <InfoItem icon={Mail} label="Email" value={staff.email} />
        <InfoItem icon={Phone} label="Mobile" value={staff.mobile} />
        {staff.first_name && <InfoItem icon={User} label="First Name" value={staff.first_name} />}
        {staff.middle_name && <InfoItem icon={User} label="Middle Name" value={staff.middle_name} />}
        {staff.last_name && <InfoItem icon={User} label="Last Name" value={staff.last_name} />}
      </div>
    </div>
  </Modal>
);

// ─── Staff Form Modal ─────────────────────────────────────────────────────────

const StaffFormModal = ({ staff, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!staff;
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    username: staff?.username || '',
    first_name: staff?.first_name || '',
    middle_name: staff?.middle_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    mobile: staff?.mobile || '',
    status: staff?.status ?? 1,
    image: staff?.image || '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setStatus = (val) => setForm((f) => ({ ...f, status: val }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, image: url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Staff' : 'Create Staff'}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="staff-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Staff' : 'Create Staff'}
          </button>
        </div>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit} className="space-y-6">
        
        {/* Account Information */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Account Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Username *</label>
              <input
                required
                disabled={isEdit}
                value={form.username}
                onChange={set('username')}
                placeholder="e.g. john_doe"
                className={`${inputCls} ${isEdit ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
              />
              {isEdit && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Username cannot be changed after creation.</p>}
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Account Status</label>
              <div className="flex gap-3">
                {[{ label: 'Active', value: 1 }, { label: 'Inactive', value: 0 }].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      form.status === value
                        ? value === 1
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
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        {/* Personal Details */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">First Name *</label>
              <input required value={form.first_name} onChange={set('first_name')} placeholder="First name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Middle Name</label>
              <input value={form.middle_name} onChange={set('middle_name')} placeholder="Middle name (optional)" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Last Name *</label>
              <input required value={form.last_name} onChange={set('last_name')} placeholder="Last name" className={inputCls} />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} placeholder="staff@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Mobile *</label>
              <input required value={form.mobile} onChange={set('mobile')} placeholder="e.g. +91 9876543210" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        {/* Profile Image */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Profile Image</h4>
          <div className={`mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isUploading ? 'opacity-50' : ''}`}>
            <div className="text-center flex flex-col items-center">
              {form.image && !isUploading ? (
                <div className="mb-4">
                  <img src={form.image} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto" />
                </div>
              ) : (
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <label htmlFor="staff-image-upload" className="relative cursor-pointer rounded-md font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
                  <span>{isUploading ? 'Uploading image...' : form.image ? 'Change profile image' : 'Upload a profile image'}</span>
                  <input id="staff-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
};

// ─── Staff Card (Card View) ───────────────────────────────────────────────────

const StaffManagementCard = ({ staff, index, onView, onEdit, onDelete, onLogout, onNavigate }) => (
  <ManagementCard
    key={staff.username}
    delay={index * 0.05}
    accent="blue"
    eyebrow={`@${staff.username}`}
    title={staff.full_name}
    subtitle={staff.email}
    icon={<StaffAvatar staff={staff} size="sm" />}
    badge={<StaffStatusBadge status={staff.status} />}
    onClick={() => onNavigate(staff)}
    hoverable
    actions={[
      { label: 'View Details', icon: <Eye size={12} />, onClick: () => onView(staff), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
      { label: 'Edit Staff', icon: <Edit size={12} />, onClick: () => onEdit(staff), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300' },
      { label: 'Force Logout', icon: <LogOut size={12} />, onClick: () => onLogout(staff), className: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:hover:text-orange-300' },
      { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => onDelete(staff), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
    ]}
    menuId={`staff-card-${staff.username}`}
  >
    <div className="mt-1">
      {staff.mobile && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Phone size={10} className="text-gray-400 dark:text-gray-500" /> {staff.mobile}
        </p>
      )}
    </div>
  </ManagementCard>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Staffs() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [staffs, setStaffs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [staffToLogout, setStaffToLogout] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const itemsPerPage = 10;

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/admin/staff/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const data = await response.json();
      if (data.success) {
        setStaffs(data.data.staffs);
        setTotalItems(data.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch staff.');
      }
    } catch (error) {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lastFetchRef = useRef({ page: null, search: null });
  useEffect(() => { 
    if (lastFetchRef.current.page === currentPage && lastFetchRef.current.search === searchTerm) return;
    lastFetchRef.current = { page: currentPage, search: searchTerm };
    fetchStaffs(); 
  }, [currentPage, searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStaffs();
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (staff) => { setSelectedStaff(staff); setIsViewModalOpen(true); };
  const handleEdit = (staff) => { setEditingStaff(staff); setIsFormModalOpen(true); setIsViewModalOpen(false); };
  const handleCreateNew = () => { setEditingStaff(null); setIsFormModalOpen(true); };
  const handleDeleteRequest = (staff) => { setStaffToDelete(staff); setIsDeleteModalOpen(true); setIsViewModalOpen(false); };
  const handleLogoutRequest = (staff) => { setStaffToLogout(staff); setIsLogoutModalOpen(true); setIsViewModalOpen(false); };

  const confirmLogout = async () => {
    if (!staffToLogout) return;
    setIsLoggingOut(true);
    try {
      const response = await apiCall(`/api/admin/staff/logout/${staffToLogout.username}`, 'POST');
      const json = await response.json();
      if (json.success) {
        toast.success(json.message || 'Staff sessions terminated successfully.');
        setIsLogoutModalOpen(false);
        setStaffToLogout(null);
      } else {
        toast.error(json.message || 'Failed to logout staff.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiCall(`/api/admin/staff/delete/${staffToDelete.username}`, 'DELETE');
      const json = await response.json();
      if (json.success) {
        toast.success('Staff deleted successfully.');
        setIsDeleteModalOpen(false);
        setStaffToDelete(null);
        fetchStaffs();
      } else {
        toast.error(json.message || 'Failed to delete staff.');
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
      const isEdit = !!editingStaff;
      const endpoint = isEdit
        ? `/api/admin/staff/update/${editingStaff.username}`
        : '/api/admin/staff/create';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();

      if (json.success) {
        toast.success(isEdit ? 'Staff updated successfully!' : 'Staff created successfully!');
        setIsFormModalOpen(false);
        fetchStaffs();
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'full_name', label: 'Staff Member', render: (row) => (
        <div className="flex items-center gap-2">
          <StaffAvatar staff={row} size="sm" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.full_name}</span>
        </div>
      ),
    },
    { key: 'username', label: 'Username', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">@{row.username}</span> },
    { key: 'first_name', label: 'First Name', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.first_name || '—'}</span> },
    { key: 'middle_name', label: 'Middle Name', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.middle_name || '—'}</span> },
    { key: 'last_name', label: 'Last Name', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.last_name || '—'}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.email || '—'}</span> },
    { key: 'mobile', label: 'Mobile', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.mobile || '—'}</span> },
    { key: 'status', label: 'Status', render: (row) => <StaffStatusBadge status={row.status} /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Staff Management"
      description="Manage staff members, their profiles, and account status."
      accent="blue"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} /> Add Staff
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search staff by name, email, username, or status..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> staff
              {searchTerm && <span className="ml-1 text-blue-600 dark:text-blue-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && staffs.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50">
            <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No staff found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No staff members registered yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                <Plus size={16} /> Add First Staff Member
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && staffs.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={staffs}
                  rowKey="username"
                  onRowClick={(row) => navigate(`/staffs/${row.username}`)}
                  getActions={(row) => [
                    { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                    { label: 'Edit Staff', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300' },
                    { label: 'Force Logout', icon: <LogOut size={12} />, onClick: () => handleLogoutRequest(row), className: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:hover:text-orange-300' },
                    { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => handleDeleteRequest(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
                  ]}
                  accent="blue"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {staffs.map((staff, index) => (
                      <StaffManagementCard
                        key={staff.username}
                        staff={staff}
                        index={index}
                        onView={handleView}
                        onEdit={handleEdit}
                        onLogout={handleLogoutRequest}
                        onDelete={handleDeleteRequest}
                        onNavigate={(row) => navigate(`/staffs/${row.username}`)}
                      />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
              <PaginationComponent
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* View Staff Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedStaff && (
          <ViewStaffModal
            staff={selectedStaff}
            onClose={() => { setIsViewModalOpen(false); setSelectedStaff(null); }}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </AnimatePresence>

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <StaffFormModal
            staff={editingStaff}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && staffToDelete && (
          <Modal
            isOpen={true}
            onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            title="Delete Staff"
            icon={Trash2}
            size="md"
            footer={
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 dark:bg-red-500 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Staff'}
                </button>
              </div>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-100">{staffToDelete.full_name}</span>
              {' '}(@{staffToDelete.username})? This action cannot be undone.
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && staffToLogout && (
          <Modal
            isOpen={true}
            onClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}
            title="Force Logout Staff"
            icon={LogOut}
            size="md"
            footer={
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={isLoggingOut}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isLoggingOut}
                  onClick={confirmLogout}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 dark:bg-orange-500 text-white text-sm font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoggingOut ? 'Logging out...' : 'Yes, Force Logout'}
                </button>
              </div>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to force logout{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-100">{staffToLogout.full_name}</span>
              {' '}(@{staffToLogout.username})? This will immediately terminate all active sessions for this staff member.
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}