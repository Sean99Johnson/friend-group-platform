import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

// Groups API functions
export const groupsAPI = {
  getUserGroups: () => api.get('/groups'),
  createGroup: (groupData) => api.post('/groups', groupData),
  joinGroup: (inviteCode) => api.post('/groups/join', { inviteCode }),
  getGroupDetails: (groupId) => api.get(`/groups/${groupId}`),
  updateGroup: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),
  leaveGroup: (groupId) => api.delete(`/groups/${groupId}/leave`),
};

// Events API functions
export const eventsAPI = {
  // Get all events for the authenticated user across all groups
  getUserEvents: () => api.get('/events/user'),
  
  // Get user's attendance statistics
  getUserAttendanceStats: () => api.get('/events/user/attendance-stats'),
  
  // Get events for a specific group
  getGroupEvents: (groupId) => api.get(`/groups/${groupId}/events`),
  
  // Get specific event details
  getEventDetails: (eventId) => api.get(`/events/${eventId}`),
  
  // Create a new event
  createEvent: (eventData) => api.post('/events', eventData),
  
  // Update an event (organizer only)
  updateEvent: (eventId, eventData) => api.put(`/events/${eventId}`, eventData),
  
  // Delete an event (organizer only)
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),
  
  // RSVP to an event
  rsvpEvent: (eventId, status) => api.put(`/events/${eventId}/rsvp`, { status }),
  
  // Check in to an event
  checkinEvent: (eventId, location) => api.post(`/events/${eventId}/checkin`, { location })
};

// Fun Score API functions
export const funScoreAPI = {
  getUserScore: (userId, groupId) => api.get(`/scores/user/${userId}?groupId=${groupId}`),
  getGroupLeaderboard: (groupId) => api.get(`/scores/leaderboard/${groupId}`),
  getScoreHistory: (userId, groupId) => api.get(`/scores/history/${userId}?groupId=${groupId}`),
};

export default api;