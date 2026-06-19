// components/client/SessionsTab.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Key } from 'lucide-react';
import apiCall from '../../utils/apiCall';
import { formatDate } from '../../utils/helpers';
import { PageContentSkeleton } from '../../components/SkeletonComponent';
import ManagementTable from '../../components/common/ManagementTable';
import PaginationComponent from '../../components/common/PaginationComponent';
import Button from '../../components/common/Button';

export default function SessionsTab({ username }) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSessions();
  }, [username, currentPage]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/admin/clients/profile/${username}?resource=sessions&page_no=${currentPage}&limit=${itemsPerPage}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions);
        setTotalSessions(data.data.pagination?.total_records || data.data.sessions.length);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSessions();
  };

  if (loading) return <PageContentSkeleton rows={4} columns={2} />;

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="font-mono text-xs">#{row.id}</span>
    },
    {
      key: 'token',
      label: 'Token',
      render: (row) => <span className="font-mono text-xs truncate max-w-[100px] inline-block">{row.token}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.is_active 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
          {row.is_active ? 'Active' : 'Expired'}
        </span>
      )
    },
    {
      key: 'create_date',
      label: 'Created',
      render: (row) => formatDate(row.create_date)
    },
    {
      key: 'expire_date',
      label: 'Expires',
      render: (row) => formatDate(row.expire_date)
    },
    {
      key: 'last_used_date',
      label: 'Last Used',
      render: (row) => row.last_used_date ? formatDate(row.last_used_date) : '—'
    },
    {
      key: 'create_ip',
      label: 'IP',
      render: (row) => row.create_ip || '—'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 text-sm py-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {sessions?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Key className="text-gray-300 dark:text-gray-600 mx-auto mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No sessions found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ManagementTable columns={columns} rows={sessions || []} rowKey="id" accent="emerald" />
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <PaginationComponent
              currentPage={currentPage}
              totalItems={totalSessions}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}