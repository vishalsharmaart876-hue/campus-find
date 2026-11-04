import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor to attach JWT token from persistent storage (localStorage) or session storage
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('campusfind_token') ||
      sessionStorage.getItem('campusfind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauth gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login/signup page, remove stale credentials
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        localStorage.removeItem('campusfind_token');
        localStorage.removeItem('campusfind_user');
        sessionStorage.removeItem('campusfind_token');
        sessionStorage.removeItem('campusfind_user');
      }
    }
    return Promise.reject(error);
  }
);


export default api;
