// pages/ClientProfile.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ChevronLeft, Key, Building2, ShoppingBag, CreditCard } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import Button from '../components/common/Button';

// Import tab components
import OverviewTab from '../components/client/OverviewTab';
import SessionsTab from '../components/client/SessionsTab';
import FirmsTab from '../components/client/FirmsTab';
import OrdersTab from '../components/client/OrdersTab';
import PaymentsTab from '../components/client/PaymentsTab';

export default function ClientProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'sessions', label: 'Sessions', icon: Key },
    { key: 'firms', label: 'Firms', icon: Building2 },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab username={username} />;
      case 'sessions':
        return <SessionsTab username={username} />;
      case 'firms':
        return <FirmsTab username={username} />;
      case 'orders':
        return <OrdersTab username={username} />;
      case 'payments':
        return <PaymentsTab username={username} />;
      default:
        return null;
    }
  };

  return (
    <ManagementHub
      title="Client Profile"
      description={`Viewing details for @${username}`}
      accent="emerald"
      actions={
        <Button variant="outline" onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm py-1.5">
          <ChevronLeft size={16} /> Back to Clients
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </ManagementHub>
  );
}