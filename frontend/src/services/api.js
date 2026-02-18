import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const parkingService = {
  getAvailableSpots: (filters) => api.get('/parking/available', { params: filters }),
  getAllSpots: () => api.get('/parking/all'),
  bookSpot: (spotId) => api.post('/parking/book', { spotId }),
  releaseSpot: (reservationId) => api.post('/parking/release', { reservationId }),
  getUserReservations: () => api.get('/parking/reservations')
};

export default api;
