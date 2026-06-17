import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const RoleRoute = ({ children, allowedRoles }) => {
  const showToast = useToast();
  
  const userDataStr = localStorage.getItem('user_data');
  let userType = 'admin'; // default fallback

  if (userDataStr) {
    try {
      const parsed = JSON.parse(userDataStr);
      if (parsed && parsed.user_type) {
        userType = parsed.user_type;
      }
    } catch (e) {}
  }

  const isAllowed = allowedRoles.includes(userType);

  useEffect(() => {
    if (!isAllowed) {
      if (userType !== 'admin' && allowedRoles.includes('admin')) {
        showToast.error("You are not an admin!");
      } else {
        showToast.error("You do not have access to this page.");
      }
    }
  }, [isAllowed, userType, allowedRoles, showToast]);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
