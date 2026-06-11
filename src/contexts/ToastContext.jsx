// src/contexts/ToastContext.jsx
import React, { createContext, useContext, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const toastIdRef = useRef(null);

  const showToast = {
    success: (message, options = {}) => {
      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options,
      });
    },
    
    error: (message, options = {}) => {
      toast.error(message, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options,
      });
    },
    
    info: (message, options = {}) => {
      toast.info(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options,
      });
    },
    
    warning: (message, options = {}) => {
      toast.warning(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options,
      });
    },

    loading: (message, options = {}) => {
      toastIdRef.current = toast.loading(message, {
        position: "top-right",
        ...options,
      });
      return toastIdRef.current;
    },

    update: (toastId, type, message, options = {}) => {
      toast.update(toastId, {
        render: message,
        type: type,
        isLoading: false,
        autoClose: 3000,
        ...options,
      });
    },

    dismiss: (toastId) => {
      toast.dismiss(toastId);
    },
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </ToastContext.Provider>
  );
};