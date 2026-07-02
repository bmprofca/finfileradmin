import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Shield, CheckCircle, XCircle,
  ToggleLeft, ToggleRight, RefreshCw, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
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

const MODULE_COLORS = {
  client: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
  firm: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
  order: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
  payment: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',
};

const ModuleBadge = ({ module }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${MODULE_COLORS[module] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
    }`}>
    {module}
  </span>
);

// ─── Toggle Button ────────────────────────────────────────────────────────────

const ToggleBtn = ({ permission, onToggle, toggling }) => {
  const isActive = permission.status === true || permission.status === 1;
  const isTogglingThis = toggling === permission.permission_id;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(permission); }}
      disabled={isTogglingThis}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${isTogglingThis ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
        } ${isActive
          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
        }`}
    >
      {isTogglingThis
        ? <RefreshCw size={11} className="animate-spin" />
        : isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
      {isTogglingThis ? 'Saving…' : isActive ? 'Disable' : 'Enable'}
    </button>
  );
};

// ─── Permission Card (card view) ──────────────────────────────────────────────

const PermissionManagementCard = ({ permission, index, onToggle, toggling }) => {
  const isActive = permission.status === true || permission.status === 1;
  return (
    <ManagementCard
      key={permission.permission_id}
      delay={index * 0.05}
      accent="violet"
      eyebrow={permission.module}
      title={permission.name}
      subtitle={permission.description}
      icon={
        <Shield
          size={15}
          className={isActive ? 'text-emerald-500' : 'text-gray-400'}
        />
      }
      badge={<StatusBadge status={permission.status} />}
      menuId={`perm-card-${permission.permission_id}`}
    >
      <div className="mt-2 flex items-center justify-between gap-2">
        <ModuleBadge module={permission.module} />
        <ToggleBtn permission={permission} onToggle={onToggle} toggling={toggling} />
      </div>
    </ManagementCard>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [toggling, setToggling] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/api/admin/permissions/list', 'GET');
      const data = await res.json();
      if (data.success) {
        setPermissions(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch permissions.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) { hasFetched.current = true; fetchPermissions(); }
  }, []);

  const handleRefresh = () => { setRefreshing(true); fetchPermissions(); };

  // ── Toggle Status ─────────────────────────────────────────────────────────
  const handleToggle = async (permission) => {
    if (toggling) return;
    setToggling(permission.permission_id);
    const newStatus = !(permission.status === true || permission.status === 1);
    try {
      const res = await apiCall(`/api/admin/permissions/status/${permission.permission_id}`, 'PATCH', { status: newStatus });
      const data = await res.json();
      if (data.success !== false) {
        setPermissions((prev) =>
          prev.map((p) =>
            p.permission_id === permission.permission_id ? { ...p, status: newStatus } : p
          )
        );
      } else {
        toast.error(data.message || 'Failed to update status.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setToggling(null);
    }
  };

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = permissions.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.module?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const activeCount = permissions.filter((p) => p.status === true || p.status === 1).length;

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Permission',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${row.status === true || row.status === 1
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            }`}>
            <Shield size={13} />
          </div>
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      render: (row) => <ModuleBadge module={row.module} />,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <span className="text-xs text-gray-500 dark:text-gray-400">{row.description || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'toggle',
      label: 'Action',
      render: (row) => <ToggleBtn permission={row} onToggle={handleToggle} toggling={toggling} />,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Permissions"
      description="Manage system permissions and toggle their active status."
      accent="violet"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      summary={
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span><span className="font-semibold text-gray-800 dark:text-gray-200">{permissions.length}</span> total</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} active</span>
          <span>{permissions.length - activeCount} inactive</span>
        </div>
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
                placeholder="Search by name, module, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{filtered.length}</span> permission{filtered.length !== 1 ? 's' : ''}
              {searchTerm && <span className="ml-1 text-violet-600 dark:text-violet-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
          </div>
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton viewMode={viewMode} rows={4} columns={5} />}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50"
          >
            <Lock className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No permissions found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No permissions available'}
            </p>
          </motion.div>
        )}

        {/* Content */}
        {!loading && filtered.length > 0 && (
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
                rows={filtered}
                rowKey="permission_id"
                accent="violet"
                showActionsColumn={false}
              />
            )}

            {/* Card View */}
            {viewMode === 'card' && (
              <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                <AnimatePresence>
                  {filtered.map((permission, index) => (
                    <PermissionManagementCard
                      key={permission.permission_id}
                      permission={permission}
                      index={index}
                      onToggle={handleToggle}
                      toggling={toggling}
                    />
                  ))}
                </AnimatePresence>
              </ManagementGrid>
            )}
          </motion.div>
        )}
      </div>
    </ManagementHub>
  );
}
