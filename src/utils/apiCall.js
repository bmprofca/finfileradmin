import toast from 'react-hot-toast';

const API_BASE = process.env.NODE_ENV === 'production' ? "https://server.finfiler.com" : "http://localhost:8373";

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

  if (username) {
    headers['username'] = username;
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

    // Try to show toast for messages
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      
      if (data && data.message) {
        if (data.success === true || (data.success === undefined && response.ok)) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      }
    } catch (e) {
      // Ignored
    }

    return response;
  } catch (error) {
    console.error(`API Call Error (${url}):`, error);
    toast.error(error.message || "Network error or server unreachable");
    throw error;
  }
};

export default apiCall;