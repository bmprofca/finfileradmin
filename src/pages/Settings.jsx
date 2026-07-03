import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, User, Phone, Mail, Plus, CheckCircle, XCircle, Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import RefreshButton from '../components/common/RefreshButton';
import Modal from '../components/common/Modal';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import apiCall from '../utils/apiCall';

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

const AdminAvatar = ({ admin }) => {
  if (admin.image) {
    return <img src={admin.image} alt={admin.full_name || admin.first_name} className="w-10 h-10 rounded-sm object-cover shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
      {(admin.full_name || admin.first_name || 'A').charAt(0).toUpperCase()}
    </div>
  );
};

export default function Settings() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalAdmins, setTotalAdmins] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Assuming standard listing endpoint
      const res = await apiCall(`/api/auth/admin/list?page_no=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`, 'GET');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data.admins || data.data || []);
        setTotalAdmins(data.data.pagination?.total || data.data.admins?.length || data.data?.length || 0);
      } else {
        // Fallback in case endpoint is slightly different or fails gracefully
        setAdmins([]);
      }
    } catch (error) {
      console.error('Failed to fetch admins', error);
      // Just keep it empty if endpoint not fully ready
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const lastFetchRef = useRef({ page: null, limit: null, search: null });
  useEffect(() => {
    if (
      lastFetchRef.current.page === currentPage &&
      lastFetchRef.current.limit === itemsPerPage &&
      lastFetchRef.current.search === searchTerm
    ) return;

    lastFetchRef.current = { page: currentPage, limit: itemsPerPage, search: searchTerm };
    fetchAdmins();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchInput]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData({});
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile: formData.mobile,
      };

      const res = await apiCall('/api/admin/auth/admin/create', 'POST', payload);
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Admin created successfully');
        setCreateModalOpen(false);
        fetchAdmins();
      } else {
        toast.error(data.message || 'Failed to create admin');
      }
    } catch (error) {
      toast.error('An error occurred while creating admin');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'avatar', label: 'Admin', render: (row) => (
        <div className="flex items-center gap-3">
          <AdminAvatar admin={row} />
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-100">{row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">@{row.username || row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact', label: 'Contact', render: (row) => (
        <div className="space-y-1">
          {row.email && <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Mail size={12} /> {row.email}</div>}
          {row.mobile && <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Phone size={12} /> {row.mobile}</div>}
        </div>
      )
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const renderCard = (admin, index) => (
    <ManagementCard
      key={admin.username || admin.email || index}
      delay={index * 0.05}
      accent="indigo"
      eyebrow={admin.username ? `@${admin.username}` : 'Admin'}
      title={admin.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim()}
      subtitle={admin.email || 'No email provided'}
      icon={<AdminAvatar admin={admin} />}
      badge={<StatusBadge status={admin.status} />}
      menuId={`admin-menu-${admin.username || admin.email || index}`}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> {admin.mobile || 'N/A'}</span>
          <span className="text-[10px] uppercase font-semibold text-gray-400">{admin.gender || ''}</span>
        </div>
      }
    />
  );

  return (
    <ManagementHub
      title="Settings"
      description="Manage application settings and administrators."
      accent="indigo"
      onRefresh={fetchAdmins}
      refreshing={loading}
      actions={
        <Button
          onClick={openCreateModal}
          variant="primary"
          className="flex items-center gap-2 text-sm py-1.5 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} /> Create Admin
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="indigo" />
          </div>
        </div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={5} columns={3} />}

        {/* Empty State */}
        {!loading && admins.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <User className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No admins found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">{searchTerm ? 'Try adjusting your search' : 'No administrators have been registered yet.'}</p>
          </div>
        )}

        {/* Content */}
        {!loading && admins.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              {viewMode === 'table' ? (
                <ManagementTable columns={columns} rows={admins} rowKey="username" accent="indigo" />
              ) : (
                <ManagementGrid viewMode="card" className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <AnimatePresence>
                    {admins.map((admin, idx) => renderCard(admin, idx))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </div>

            <div className="mt-4">
              <PaginationComponent
                currentPage={currentPage}
                totalItems={totalAdmins}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onLimitChange={(lim) => { setItemsPerPage(lim); setCurrentPage(1); }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => !submitting && setCreateModalOpen(false)}
        title="Create Administrator"
        size="2xl"
        icon={User}
        contentClassName="p-6"
        footer={
          <Button
            variant="primary"
            disabled={submitting}
            className="px-6 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleCreateSubmit}
          >
            {submitting ? 'Creating...' : 'Create Admin'}
          </Button>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">First Name <span className="text-red-500">*</span></label>
              <input required type="text" name="first_name" value={formData.first_name || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. John" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Middle Name</label>
              <input type="text" name="middle_name" value={formData.middle_name || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Michael" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name <span className="text-red-500">*</span></label>
              <input required type="text" name="last_name" value={formData.last_name || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Doe" />
            </div>

            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile Number <span className="text-red-500">*</span></label>
              <input required type="tel" name="mobile" value={formData.mobile || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. 9876543210" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></label>
            <input required type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. john.doe@example.com" />
          </div>
        </form>
      </Modal>
    </ManagementHub>
  );
}
