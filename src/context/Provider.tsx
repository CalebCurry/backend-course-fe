import { ReactNode, useCallback, useEffect, useState } from 'react';
import axiosInstance from '../Axios'; // Import the custom axios instance
import { AuthContext, TokenInfo } from './Context';
import { useNavigate } from 'react-router-dom';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    try {
      const response = await axiosInstance.post('/api/auth/login/', {
        username,
        password,
      });

      if (response.status === 200) {
        const { access, refresh } = response.data;
        localStorage.setItem('access', access);
        localStorage.setItem('refresh', refresh);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        setIsLoggedIn(true);
        setTokenInfo({ access, refresh });
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };
  
  const logout = useCallback(() => {
    console.log('logging out');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setIsLoggedIn(false);
    setTokenInfo(null);
    navigate('/login');
  }, [navigate]);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    try {
      const response = await axiosInstance.post('/api/auth/refresh/', { refresh: refreshToken });
      if (response.status === 200) {
        const { access, refresh } = response.data;
        localStorage.setItem('access', access);
        localStorage.setItem('refresh', refresh);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        setTokenInfo({ access, refresh }); // Update the context
        return access;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh token', error);
      logout(); // Log out if refresh fails
      throw error;
    }
  }, [logout]);

  

  const checkLoginStatus = useCallback(() => {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');
    if (accessToken && refreshToken) {
      setIsLoggedIn(true);
      setTokenInfo({ access: accessToken, refresh: refreshToken });
    }
  }, []);

  // Attach Axios interceptors inside useEffect to ensure they are set up once
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem('access');
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
    
        // Check if the response is a 401 error
        if (error.response && error.response.status === 401) {
          // If the 401 comes from the refresh endpoint, log out immediately
          if (originalRequest.url.includes('/refresh')) {
            console.error('401 error on refresh endpoint. Logging out...');
            logout();
            return Promise.reject(error);
          }
    
          // Otherwise, retry the request if it hasn't been retried yet
          if (!originalRequest._retry) {
            originalRequest._retry = true;
    
            try {
              const newToken = await refreshAccessToken();
              originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
              return axiosInstance(originalRequest);
            } catch (err) {
              console.error('Token refresh failed. Logging out...');
              logout();
              return Promise.reject(err);
            }
          }
        }
    
        // Reject the error for other cases
        return Promise.reject(error);
      }
    );
    
    // Cleanup interceptors on unmount
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessToken, logout]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useEffect(() => {
    console.log('tokenInfo changed', tokenInfo);
  }, [tokenInfo]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, logout, login, tokenInfo }}>
      {children}
    </AuthContext.Provider>
  );
}
