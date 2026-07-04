// components/client/OverviewTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Building2, CreditCard,
  ShoppingBag, Key, Hash
} from 'lucide-react';
import apiCall from '../../utils/apiCall';
import { formatDate } from '../../utils/helpers';
import { PageContentSkeleton } from '../../components/SkeletonComponent';

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
};

const getStatusColor = (status) => {
  const map = {
    'active': 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    'inactive': 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    'pending': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    'suspended': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return map[status] || 'text-gray-600 bg-gray-100 dark:bg-gray-700/30 dark:text-gray-400';
};

export default function OverviewTab({ username, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [counts, setCounts] = useState({});

  const activeFetchRef = useRef(null);

  useEffect(() => {
    fetchOverview();
  }, [username, refreshTrigger]);

  const fetchOverview = async () => {
    const requestKey = `overview|${refreshTrigger || 0}`;
    if (activeFetchRef.current === requestKey) return;
    activeFetchRef.current = requestKey;

    setLoading(true);
    try {
      const res = await apiCall(`/api/admin/clients/profile/${username}`, 'GET');
      const data = await res.json();
      if (data.success) {
        setClient(data.data.client);
        setCounts(data.data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  };

  if (loading) return <PageContentSkeleton rows={4} columns={2} />;

  const statCards = [
    { label: 'Sessions', value: counts?.sessions || 0, icon: Key, color: 'blue' },
    { label: 'Firms', value: counts?.firms || 0, icon: Building2, color: 'purple' },
    { label: 'Orders', value: counts?.orders || 0, icon: ShoppingBag, color: 'emerald' },
    { label: 'Payments', value: counts?.payments || 0, icon: CreditCard, color: 'orange' },
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Client Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {client?.image ? (
              <img
                src={client.image}
                alt={client.first_name}
                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
                {getInitials(client?.first_name, client?.last_name)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(client?.status)} border border-white dark:border-gray-800`}>
              {client?.status || 'N/A'}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {client?.first_name} {client?.middle_name || ''} {client?.last_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
              <Hash size={14} className="text-emerald-500" /> @{client?.username}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {client?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Mail size={14} className="text-emerald-500" />
                  <span>{client.email}</span>
                </div>
              )}
              {client?.mobile && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Phone size={14} className="text-emerald-500" />
                  <span>{client.mobile}</span>
                </div>
              )}
              {client?.create_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar size={14} className="text-emerald-500" />
                  <span>Joined: {formatDate(client.create_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}