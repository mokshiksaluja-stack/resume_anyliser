/**
 * Unified API Adapter Client
 * 
 * Configures base endpoints, injects session tokens, manages
 * request payload serializations, and triggers state alerts.
 */

const API_BASE_URL = window.location.origin + '/api';

// Toast Notification Controller
function showToast(message, type = 'success') {
  const toast = document.getElementById('alert-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'alert-popup'; // reset classes
  
  if (type === 'error') {
    toast.classList.add('error');
  } else {
    toast.classList.add('success');
  }

  // Animate in
  toast.classList.add('active');

  // Retract after 4 seconds
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

/**
 * Core HTTP Request Wrapper
 * @param {string} endpoint - Target sub-path (e.g. /auth/login)
 * @param {object} options - Fetch options (method, headers, body)
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set up default headers
  const headers = {};
  
  // Do NOT override Content-Type headers for FormData (which multer requires to build boundaries)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject active session JWT Token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request execution failed on server.');
    }

    return data;
  } catch (error) {
    console.error(`[API CLIENT] Fetch failed on: ${endpoint}`, error.message);
    throw error;
  }
}

// Global API endpoints exporter
window.api = {
  showToast,
  auth: {
    login: async (credentials) => {
      return fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    register: async (details) => {
      return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(details)
      });
    },
    getMe: async () => {
      return fetchAPI('/auth/me', { method: 'GET' });
    }
  },
  resume: {
    analyze: async (formData) => {
      return fetchAPI('/resume/analyze', {
        method: 'POST',
        body: formData // FormData containing resume file, jobTitle, and jobDescription
      });
    },
    getHistory: async () => {
      return fetchAPI('/resume/history', { method: 'GET' });
    },
    getReport: async (id) => {
      return fetchAPI(`/resume/report/${id}`, { method: 'GET' });
    },
    delete: async (id) => {
      return fetchAPI(`/resume/${id}`, { method: 'DELETE' });
    },
    getExportCSVUrl: () => {
      return `${API_BASE_URL}/resume/export/csv?token=${localStorage.getItem('token') || ''}`;
    }
  },
  admin: {
    getAnalytics: async () => {
      return fetchAPI('/admin/analytics', { method: 'GET' });
    }
  }
};
