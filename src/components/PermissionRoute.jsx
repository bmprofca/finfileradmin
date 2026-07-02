import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { useToast } from '../contexts/ToastContext';

const PermissionRoute = ({ children, permissions = [], modules = [] }) => {
  const showToast = useToast();
  const { hasPermission, hasModuleAccess } = usePermissions();

  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  const requiredModules = Array.isArray(modules) ? modules : [modules];

  const hasRequiredPermission = requiredPermissions.some((permissionId) =>
    permissionId ? hasPermission(permissionId) : false
  );
  const hasRequiredModule = requiredModules.some((module) =>
    module ? hasModuleAccess(module) : false
  );
  const hasRequirements = requiredPermissions.length > 0 || requiredModules.length > 0;
  const isAllowed = !hasRequirements || hasRequiredPermission || hasRequiredModule;

  useEffect(() => {
    if (!isAllowed) {
      showToast.error('You do not have permission to access this page.');
    }
  }, [isAllowed, showToast]);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionRoute;
