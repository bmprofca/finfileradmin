// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-8xl font-bold text-gray-200 animate-pulse">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="w-20 h-20 text-blue-500 animate-bounce" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 mt-8">
          Need assistance? <button onClick={() => navigate('/settings')} className="text-blue-600 hover:text-blue-700 font-semibold">Contact Support</button>
        </p>
      </div>
    </div>
  );
};

export default NotFound;