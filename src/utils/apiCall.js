import toast from 'react-hot-toast';
import { API_BASE, UPLOAD_API_URL, UPLOAD_API_KEY } from './config';

export const handleApiError = (error, fallbackMessage = null) => {
  const message =
    fallbackMessage ||
    error?.response?.data?.message ||
    error?.message ||
    'Network error or server unreachable';

  toast.error(message);
};

/**
 * Unified API calling utility
 * @param {string} endpoint - The API endpoint or full URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object|null} body - Request payload
 * @returns {Promise<Response>} - The fetch response object
 */
export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const userDataStr = localStorage.getItem('user_data');
  let token = null;
  let username = null;
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      token = userData.token;
      username = userData.username;
    } catch (e) {
      console.error("Failed to parse user_data from local storage", e);
    }
  }

  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Send token as Authorization Bearer header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  // Handle absolute vs relative URLs
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  if (!API_BASE && !endpoint.startsWith('http')) {
    console.error(
      'REACT_APP_BASE_API_URL is not set. Add it to .env.development or .env.production and restart the dev server.',
    );
  }

  try {
    const response = await fetch(url, options);

    // Global 401 Unauthorized handler
    if (response.status === 401) {
      localStorage.removeItem('user_data');

      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error(`API Call Error (${url}):`, error);
    throw error;
  }
};


/**
 * Common file upload utility
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    headers: {
      key: UPLOAD_API_KEY,
    },
    body: formData
  });

  const result = await response.json();
  if (result.success && result.url) {
    return result.url;
  }
  throw new Error(result.message || 'Upload failed');
};

export default apiCall;
