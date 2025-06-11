import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with default config
const adminAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
adminAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API functions
export const adminAPIService = {
  // Dashboard Stats
  async getStats() {
    try {
      const response = await adminAPI.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // User Management
  async getUsers(page = 1, limit = 10, search = '') {
    try {
      const response = await adminAPI.get('/admin/users', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUser(id) {
    try {
      const response = await adminAPI.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await adminAPI.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await adminAPI.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      const response = await adminAPI.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async bulkDeleteUsers(userIds) {
    try {
      const response = await adminAPI.post('/admin/users/bulk-delete', { userIds });
      return response.data;
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      throw error;
    }
  },

  // Group Management
  async getGroups(page = 1, limit = 10, search = '') {
    try {
      const response = await adminAPI.get('/admin/groups', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  async createGroup(groupData) {
    try {
      const response = await adminAPI.post('/admin/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  async updateGroup(id, groupData) {
    try {
      const response = await adminAPI.put(`/admin/groups/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  async deleteGroup(id) {
    try {
      const response = await adminAPI.delete(`/admin/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },

  // Event Management
  async getEvents(page = 1, limit = 10, search = '') {
    try {
      const response = await adminAPI.get('/admin/events', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  async createEvent(eventData) {
    try {
      const response = await adminAPI.post('/admin/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(id, eventData) {
    try {
      const response = await adminAPI.put(`/admin/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(id) {
    try {
      const response = await adminAPI.delete(`/admin/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Test Data Generation
  async generateTestData(options = {}) {
    try {
      const response = await adminAPI.post('/admin/generate-test-data', options);
      return response.data;
    } catch (error) {
      console.error('Error generating test data:', error);
      throw error;
    }
  }
};