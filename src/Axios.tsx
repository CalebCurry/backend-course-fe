// src/Axios.ts
import axios from 'axios';
import { backendUrl } from './shared';

// Create a custom axios instance
const axiosInstance = axios.create({
  baseURL: backendUrl,
});

// Function to refresh the access token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  try {
    const response = await axios.post(`${backendUrl}/api/auth/refresh/`, { refresh: refreshToken });
    if (response.status === 200) {
      const { access, refresh } = response.data;
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      return access;
    } else {
      throw new Error('Failed to refresh token');
    }
  } catch (error) {
    console.error('Failed to refresh token', error);
    throw error;
  }
}

// Request interceptor to add the access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors and refresh tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if we should retry the request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Prevent infinite loops
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return axiosInstance(originalRequest);
      } catch (err) {
        // If refresh fails, log out the user
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login'; // Redirect to login page
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
