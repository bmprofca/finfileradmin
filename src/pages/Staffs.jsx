import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Filter, Download,
  User, Mail, Phone, Eye, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementViewSwitcher from '../components/common/ManagementViewSwitcher';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import apiCall from '../utils/apiCall';

const StaffCard = ({ staff, index, onView }) => (
  <ManagementCard
    delay={index * 0.05}
    accent="blue"
    eyebrow={`Username: ${staff.username}`}
    title={staff.name}
    subtitle={staff.email}
    icon={
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {staff.name.charAt(0).toUpperCase()}
      </div>
    }
    onClick={() => onView(staff)}
    hoverable
    actions={[
      { label: 'View Profile', icon: <Eye size={12} />, onClick: () => onView(staff), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
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

export default function Staffs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [staffs, setStaffs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/admin/staff/list', 'GET');
      const data = await response.json();
      if (data.success) {
        setStaffs(data.data.staffs);
      }
    } catch (error) {
      console.error('Failed to fetch staffs', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchTerm('');
    setCurrentPage(1);
    fetchStaffs();
  };

  const itemsPerPage = 10;

  const filtered = useMemo(() =>
    staffs.filter((s) =>
      [s.name, s.email, s.username, s.mobile].some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [searchTerm, staffs]
  );
  
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const handleView = (staff) => {
    navigate(`/staffs/${staff.username}`);
  };

  const columns = [
    {
      key: 'name', label: 'Staff Name', render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'username', label: 'Username' },
    { key: 'mobile', label: 'Mobile' },
  ];

  return (
    <ManagementHub
      title="Staff Management"
      description="Manage staff members and view their assigned orders."
      accent="blue"
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="space-y-3">
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
                placeholder="Search staff by name, email, or username..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px] dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden xl:block whitespace-nowrap">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{filtered.length}</span> staff
              {searchTerm && <span className="ml-1 text-blue-600 dark:text-blue-400">· "{searchTerm}"</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
          </div>
        </motion.div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-950/50">
            <Briefcase className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No staff found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">{searchTerm ? 'Try adjusting your search' : 'No staff members registered yet'}</p>
          </motion.div>
        )}
        
        {/* Loading State */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </motion.div>
        )}

        {/* Content */}
        {!loading && filtered.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">

              {/* Table View */}
              {viewMode === 'table' && (
                <ManagementTable
                  columns={columns}
                  rows={paginated}
                  rowKey="username"
                  onRowClick={(row) => handleView(row)}
                  getActions={(row) => [
                    { label: 'View Profile', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                  ]}
                  accent="blue"
                />
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
                  <AnimatePresence>
                    {paginated.map((staff, index) => (
                      <StaffCard key={staff.username} staff={staff} index={index} onView={handleView} />
                    ))}
                  </AnimatePresence>
                </ManagementGrid>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
              <PaginationComponent
                currentPage={currentPage}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </motion.div>
          </>
        )}
      </div>
    </ManagementHub>
  );
}
