import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, User, Phone, Mail,
  Plus, Edit, CheckCircle, XCircle, Briefcase, LogOut,
  Shield, ShieldCheck, ChevronDown, Loader2, Trash2, Users2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import SelectField from '../components/common/SelectField';
import apiCall, { uploadFile } from '../utils/apiCall';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StaffStatusBadge = ({ status }) => {
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

// Small pill that shows a staff member's currently assigned permission package.
// Assumes the staff list / detail payload exposes either `permission_package_name`
// (preferred, joined server-side) or falls back to the raw `permission_package_id`.
const PermissionPackageBadge = ({ staff }) => {
  const label = staff.permission_package_name || staff.permission_package_id || null;
  if (!label) {
    return <span className="text-xs text-gray-400 dark:text-gray-500 italic">No package</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
      <Shield size={10} /> {label}
    </span>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const StaffAvatar = ({ staff, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const cls = sizes[size] || sizes.md;
  if (staff.image) {
    return <img src={staff.image} alt={staff.full_name} className={`${cls} rounded-sm object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {staff.full_name?.charAt(0)?.toUpperCase() || <User size={16} />}
    </div>
  );
};

// ─── Permission Package Picker (searchable + infinite scroll + summary) ───────

const PACKAGE_PAGE_LIMIT = 20;

// Reusable hook: paginated + searchable fetch of /permissions/package/list
function usePermissionPackages(search) {
  const [packages, setPackages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadPage = async (pageToLoad, replace) => {
    setLoading(true);
    try {
      const response = await apiCall(
        `/api/admin/permissions/package/list?page_no=${pageToLoad}&limit=${PACKAGE_PAGE_LIMIT}&search=${encodeURIComponent(search || '')}`,
        'GET'
      );
      const json = await response.json();
      if (json.success) {
        setPackages((prev) => (replace ? json.data : [...prev, ...json.data]));
        const totalPages = json.pagination?.total_pages || 1;
        setHasMore(pageToLoad < totalPages);
        setPage(pageToLoad);
      } else {
        toast.error(json.message || 'Failed to load permission packages.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch from page 1 whenever the search term changes
  useEffect(() => {
    setHasMore(true);
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadMore = () => {
    if (!loading && hasMore) loadPage(page + 1, false);
  };

  return { packages, loading, hasMore, loadMore };
}

/**
 * value:
 *   - string  -> a permission package is selected (its id)
 *   - null    -> permission package explicitly removed
 *   - undefined is never produced by this component; the parent decides
 *     whether "unchanged" applies by comparing against the original value.
 */
const PermissionPackagePicker = ({
  value,
  onChange,
  placeholder = 'Select permission package',
  allowRemove = true,
  compact = false,
  initialDetail = null,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(initialDetail);
  const debounceRef = useRef(null);
  const { packages, loading, loadMore } = usePermissionPackages(committedSearch);

  // If the current value matches a package that has since loaded, hydrate the summary
  useEffect(() => {
    if (!value) return;
    const found = packages.find((p) => p.permission_package_id === value);
    if (found) setSelectedDetail(found);
  }, [value, packages]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCommittedSearch(val), 300);
  };

  const options = useMemo(() => {
    return packages.map(pkg => ({
      value: pkg.permission_package_id,
      label: pkg.name,
      pkg
    }));
  }, [packages]);

  const combinedOptions = useMemo(() => {
    if (allowRemove) {
      return [{ value: null, label: 'Remove permission package' }, ...options];
    }
    return options;
  }, [options, allowRemove]);

  const selectedOption = useMemo(() => {
    if (value === null && allowRemove) return { value: null, label: 'Remove permission package' };
    if (!value) return null;
    return options.find(o => o.value === value) || (selectedDetail ? { value, label: selectedDetail.name, pkg: selectedDetail } : null);
  }, [value, options, allowRemove, selectedDetail]);

  const handleChange = (selected) => {
    if (!selected) {
      setSelectedDetail(null);
      onChange(allowRemove ? null : undefined);
      return;
    }
    if (selected.value === null) {
      setSelectedDetail(null);
      onChange(null);
      return;
    }
    setSelectedDetail(selected.pkg);
    onChange(selected.value);
  };

  return (
    <div>
      <SelectField
        options={combinedOptions}
        value={selectedOption}
        onChange={handleChange}
        onInputChange={(val, { action }) => {
          if (action === 'input-change') {
            handleSearchChange(val);
          }
        }}
        isLoading={loading}
        placeholder={placeholder}
        isClearable={allowRemove}
        onMenuScrollToBottom={loadMore}
        styles={{ menu: (base) => ({ ...base, zIndex: 50 }) }}
      />
      {value && selectedDetail && !compact && (
        <div className="mt-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-200 truncate">{selectedDetail.name}</span>
            {'status' in selectedDetail && <StaffStatusBadge status={selectedDetail.status} />}
          </div>
          {selectedDetail.remark && (
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">{selectedDetail.remark}</p>
          )}
          {Array.isArray(selectedDetail.assigned_permissions) && (
            <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1">
              {selectedDetail.assigned_permissions.length} permission{selectedDetail.assigned_permissions.length === 1 ? '' : 's'} assigned
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── View Staff Modal ─────────────────────────────────────────────────────────

const ViewStaffModal = ({ staff, onClose, onEdit }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Staff Details"
    icon={User}
    size="2xl"
    contentClassName="p-5 space-y-4"
    footer={
      <button
        onClick={() => onEdit(staff)}
        className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2"
      >
        <Edit size={16} /> Edit Staff
      </button>
    }
  >
    {/* Avatar + Name */}
    <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-700">
      <StaffAvatar staff={staff} size="lg" />
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{staff.full_name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{staff.username}</p>
        <div className="mt-1.5 flex gap-2 items-center flex-wrap">
          <StaffStatusBadge status={staff.status} />
          <PermissionPackageBadge staff={staff} />
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

    {/* Permission Package */}
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Shield className="text-indigo-500 dark:text-indigo-400" size={15} /> Permission Package
      </h4>
      <InfoItem icon={Shield} label="Assigned Package" value={staff.permission_package_name || staff.permission_package_id || 'None'} />
    </div>
  </Modal>
);

// ─── Staff Form Modal (Create / Edit) ──────────────────────────────────────────

const StaffFormModal = ({ staff, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!staff;
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(staff?.image || '');
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

  // Permission package selection. For edit, prefill with the staff's current
  // package so the picker reflects reality; we only include it in the submitted
  // payload if it ends up different from this original value (or explicitly removed).
  const originalPermissionPackageId = staff?.permission_package_id ?? null;
  const [permissionPackageId, setPermissionPackageId] = useState(originalPermissionPackageId);
  const initialPackageDetail = staff?.permission_package_name
    ? { name: staff.permission_package_name }
    : null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setStatus = (val) => setForm((f) => ({ ...f, status: val }));

  const uploadImageFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, image: url }));
      setImagePreview(url);
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    uploadImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    if (isUploading) return;
    uploadImageFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEdit && !permissionPackageId) {
      toast.error('Please select a permission package.');
      return;
    }

    const payload = { ...form };
    delete payload.username;

    if (isEdit) {
      // Only send permission_package_id if it actually changed from the original.
      if (permissionPackageId !== originalPermissionPackageId) {
        payload.permission_package_id = permissionPackageId; // string id, or null to remove
      }
      onSubmit(payload);
    } else {
      payload.permission_package_id = permissionPackageId;
      onSubmit(payload);
    }
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm dark:text-gray-100';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Staff' : 'Create Staff'}
      icon={isEdit ? Edit : Plus}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="staff-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Staff' : 'Create Staff'}
        </button>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Account Information */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Account Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEdit && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Username</label>
                <input
                  disabled
                  value={form.username}
                  className={`${inputCls} opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800`}
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Username is generated by the backend and cannot be changed.</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Account Status</label>
              <div className="flex gap-3">
                {[{ label: 'Active', value: 1 }, { label: 'Inactive', value: 0 }].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${form.status === value
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

        {/* Permission Package */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Shield size={15} className="text-indigo-500 dark:text-indigo-400" /> Permission Package {!isEdit && <span className="text-red-500">*</span>}
          </h4>
          <PermissionPackagePicker
            value={permissionPackageId}
            onChange={setPermissionPackageId}
            allowRemove={isEdit}
            placeholder={isEdit ? 'Keep current / select new package' : 'Select a permission package'}
            initialDetail={initialPackageDetail}
          />
          {isEdit && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              Leave as-is to keep the current package. Choose "Remove permission package" to revoke it.
            </p>
          )}
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        {/* Profile Image */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Profile Image</h4>
          <label
            htmlFor="staff-image-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className={`mt-2 flex cursor-pointer justify-center rounded-sm border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-within:ring-4 focus-within:ring-blue-500/10 ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="text-center flex flex-col items-center">
              {imagePreview && !isUploading ? (
                <div className="mb-4">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto" />
                </div>
              ) : (
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {isUploading ? 'Uploading image...' : imagePreview ? 'Change profile image' : 'Upload a profile image'}
                </span>
                <input id="staff-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click anywhere or drag and drop. PNG, JPG, GIF up to 5MB</p>
            </div>
          </label>
        </div>

      </form>
    </Modal>
  );
};

// ─── Bulk Permissions Modal ─────────────────────────────────────────────────────

const BulkPermissionsModal = ({ staffList, onClose, onSaved }) => {
  // One package applied to every selected staff member.
  // string id = assign that package to all; null = remove package from all; undefined = nothing picked yet
  const [packageValue, setPackageValue] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (packageValue === undefined) {
      toast.error('Please select a permission package (or choose to remove).');
      return;
    }

    const usernames = staffList.map((s) => s.username);

    setIsSaving(true);
    try {
      const response = await apiCall('/api/admin/permissions/package/assign', 'PUT', {
        staff_usernames: usernames,
        permission_package_id: packageValue, // string id for all, or null to remove from all
      });
      const json = await response.json();
      if (json.success) {
        toast.success('Permissions updated successfully.');
        onSaved();
      } else {
        toast.error(json.message || 'Failed to update permissions.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => !isSaving && onClose()}
      title="Manage Permissions"
      icon={ShieldCheck}
      size="2xl"
      contentClassName="p-5 space-y-5"
      closeText="Cancel"
      footer={
        <button
          disabled={isSaving || packageValue === undefined}
          onClick={handleSave}
          className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Apply to Selected'}
        </button>
      }
    >
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Users2 size={16} />
        <span>Applying to {staffList.length} staff member{staffList.length === 1 ? '' : 's'}</span>
      </div>

      {/* Selected staff preview */}
      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 bg-gray-50 dark:bg-gray-900/40">
        {staffList.map((s) => (
          <span
            key={s.username}
            className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200"
          >
            <StaffAvatar staff={s} size="sm" />
            {s.full_name}
          </span>
        ))}
      </div>

      {/* Single package picker for the whole batch */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
          Permission Package
        </label>
        <PermissionPackagePicker
          value={packageValue}
          onChange={setPackageValue}
          placeholder="Select a package to assign to everyone selected"
        />
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
          This will assign the chosen package to every selected staff member, replacing whatever they currently have. Choose "Remove permission package" to revoke it from all of them instead.
        </p>
      </div>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Staffs() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [staffs, setStaffs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [staffToLogout, setStaffToLogout] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Bulk selection + bulk permissions
  const [selectedUsernames, setSelectedUsernames] = useState(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

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

  const lastFetchRef = useRef({ page: null, search: null, limit: null });
  useEffect(() => {
    if (lastFetchRef.current.page === currentPage && lastFetchRef.current.search === searchTerm && lastFetchRef.current.limit === itemsPerPage) return;
    lastFetchRef.current = { page: currentPage, search: searchTerm, limit: itemsPerPage };
    fetchStaffs();
    // Selection is scoped to the current page/filter view
    setSelectedUsernames(new Set());
  }, [currentPage, searchTerm, itemsPerPage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStaffs();
  };

  // ── Selection Handlers ───────────────────────────────────────────────────
  const toggleSelectOne = (username) => {
    setSelectedUsernames((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedUsernames((prev) => {
      if (prev.size === staffs.length) return new Set();
      return new Set(staffs.map((s) => s.username));
    });
  };

  const clearSelection = () => setSelectedUsernames(new Set());

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (staff) => { setSelectedStaff(staff); setIsViewModalOpen(true); };
  const handleEdit = (staff) => { setEditingStaff(staff); setIsFormModalOpen(true); setIsViewModalOpen(false); };
  const handleCreateNew = () => { setEditingStaff(null); setIsFormModalOpen(true); };
  const handleLogoutRequest = (staff) => { setStaffToLogout(staff); setIsLogoutModalOpen(true); setIsViewModalOpen(false); };

  const confirmLogout = async () => {
    if (!staffToLogout) return;
    setIsLoggingOut(true);
    try {
      const response = await apiCall(`/api/admin/staff/logout/${staffToLogout.username}`, 'POST');
      const json = await response.json();
      if (json.success) {
        toast.success('Staff sessions logged out successfully');
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
        toast.success(isEdit ? 'Staff updated successfully' : 'Staff created successfully');
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

  const handleBulkPermissionsSaved = () => {
    setIsBulkModalOpen(false);
    clearSelection();
    fetchStaffs();
  };

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: '__select',
      headerClassName: 'w-12 text-center px-0 sm:px-2',
      className: 'w-12 text-center px-0 sm:px-2',
      label: (
        <input
          type="checkbox"
          checked={staffs.length > 0 && selectedUsernames.size === staffs.length}
          onChange={toggleSelectAll}
          className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedUsernames.has(row.username)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); toggleSelectOne(row.username); }}
          className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'full_name', label: 'Staff Member', render: (row) => (
        <div className="flex items-center gap-2">
          <StaffAvatar staff={row} size="sm" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.full_name}</span>
        </div>
      ),
    },
    { key: 'username', label: 'Username', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">@{row.username}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.email || '—'}</span> },
    { key: 'mobile', label: 'Mobile', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.mobile || '—'}</span> },
    {
      key: 'assigned_orders', label: 'Assigned Orders', render: (row) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{row.assigned_orders ?? 0}</span>
      ),
    },
    {
      key: 'pending_orders', label: 'Pending Orders', render: (row) => (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">{row.pending_orders ?? 0}</span>
      ),
    },
    {
      key: 'completed_orders', label: 'Completed Orders', render: (row) => (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row.completed_orders ?? 0}</span>
      ),
    },
    { key: 'permission_package', label: 'Permission Package', render: (row) => <PermissionPackageBadge staff={row} /> },
    { key: 'status', label: 'Status', render: (row) => <StaffStatusBadge status={row.status} /> },
  ];

  const selectedStaffObjects = useMemo(
    () => staffs.filter((s) => selectedUsernames.has(s.username)),
    [staffs, selectedUsernames]
  );

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
          <Plus size={16} /> <span className='hidden md:block'>Add Staff</span>
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800   p-1 lg:p-4 rounded-sm border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className="flex-1 max-w-lg items-center gap-4 ">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search staff by name, email, username, or status..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>

          </div>

        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedUsernames.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5"
            >
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedUsernames.size} staff member{selectedUsernames.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={clearSelection} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5">
                  Clear
                </button>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                >
                  <ShieldCheck size={14} /> Manage Permissions
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <PageContentSkeleton rows={6} columns={6} />
        )}

        {/* Empty State */}
        {!loading && staffs.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50">
            <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No staff found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No staff members registered yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                <Plus size={16} /> Add First Staff Member
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && staffs.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-sm bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              <ManagementTable
                columns={columns}
                rows={staffs}
                rowKey="username"
                onRowClick={(row) => navigate(`/staffs/${row.username}`)}
                getActions={(row) => [
                  { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
                  { label: 'Edit Staff', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                  { label: 'Force Logout', icon: <LogOut size={12} />, onClick: () => handleLogoutRequest(row), className: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:hover:text-orange-300' },
                ]}
                accent="blue"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
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

      {/* View Staff Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedStaff && (
          <ViewStaffModal
            staff={selectedStaff}
            onClose={() => { setIsViewModalOpen(false); setSelectedStaff(null); }}
            onEdit={handleEdit}
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

      {/* Bulk Permissions Modal */}
      <AnimatePresence>
        {isBulkModalOpen && selectedStaffObjects.length > 0 && (
          <BulkPermissionsModal
            staffList={selectedStaffObjects}
            onClose={() => setIsBulkModalOpen(false)}
            onSaved={handleBulkPermissionsSaved}
          />
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
            closeText="Cancel"
            footer={
              <button
                disabled={isLoggingOut}
                onClick={confirmLogout}
                className="px-5 py-2.5 rounded-sm bg-orange-600 dark:bg-orange-500 text-white text-sm font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Yes, Force Logout'}
              </button>
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