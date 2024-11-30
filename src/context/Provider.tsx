// AuthProvider.tsx
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
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        setIsLoggedIn(true);
        setTokenInfo({ access: response.data.access, refresh: response.data.refresh });
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

  const checkLoginStatus = useCallback(() => {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');
    if (accessToken && refreshToken) {
      setIsLoggedIn(true);
      setTokenInfo({ access: accessToken, refresh: refreshToken });
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, logout, login, tokenInfo }}>
      {children}
    </AuthContext.Provider>
  );
}
