// src/pages/ServerUnreachable.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WifiOff, 
  RefreshCw, 
  Home, 
  AlertTriangle,
  Globe,
  Server
} from 'lucide-react';

const ServerUnreachable = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0 && !isRetrying) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !isRetrying) {
      handleRetry();
    }
    return () => clearTimeout(timer);
  }, [countdown, isRetrying]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Try to ping the server
      const response = await fetch('/api/health-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error('Server still unreachable');
      }
    } catch (error) {
      console.error('Server unreachable:', error);
      setCountdown(30);
      setIsRetrying(false);
    }
  };

  const handleManualRetry = () => {
    setCountdown(0);
    handleRetry();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Server Error Illustration */}
        <div className="relative mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-red-100 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="relative bg-gradient-to-br from-red-500 to-orange-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Server className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-2 shadow-lg">
              <WifiOff className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Server Unreachable
        </h1>
        <p className="text-gray-600 mb-4">
          Unable to connect to the server. This could be due to:
        </p>
        
        {/* Reasons List */}
        <div className="bg-white/50 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4 text-red-500" />
            <span>Network connectivity issues</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Server className="w-4 h-4 text-red-500" />
            <span>Server is down or under maintenance</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Firewall or proxy blocking the connection</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : `Retry Connection ${countdown > 0 ? `(${countdown}s)` : ''}`}
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-white/50 rounded-xl">
          <p className="text-sm text-gray-600">
            If the problem persists, please check your internet connection or contact your system administrator.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold mt-2"
          >
            Try logging in again →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerUnreachable;