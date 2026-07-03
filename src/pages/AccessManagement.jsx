import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Package } from 'lucide-react';
import Permissions from './Permissions';
import PermissionPackages from './PermissionPackages';

export default function AccessManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('packages')) return 'packages';
    return 'permissions';
  });

  useEffect(() => {
    if (location.pathname.includes('packages') && activeTab !== 'packages') {
      setActiveTab('packages');
    } else if (!location.pathname.includes('packages') && activeTab !== 'permissions') {
      setActiveTab('permissions');
    }
  }, [location.pathname, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'packages') {
      navigate('/permission-packages');
    } else {
      navigate('/permissions');
    }
  };

  const tabs = [
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'packages', label: 'Packages', icon: Package },
  ];

  return (
    <>
      {activeTab === 'permissions' && <Permissions tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />}
      {activeTab === 'packages' && <PermissionPackages tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />}
    </>
  );
}
