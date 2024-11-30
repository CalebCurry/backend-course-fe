import { ReactNode, useCallback, useEffect, useState } from "react";
import { backendUrl } from "../shared";
import axios from "axios";
import { AuthContext, TokenInfo } from "./Context";

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ access: '', refresh: '' });
    const [isRefreshing, setIsRefreshing] = useState(false);
  
    const login = async (username: string, password: string) => {
      try {
        const response = await axios.post(`${backendUrl}/api/auth/login/`, {
          username,
          password,
        });
  
        if (response.status === 200) {
          localStorage.setItem('access', response.data.access);
          localStorage.setItem('refresh', response.data.refresh);
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
      console.log("logging out")
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setIsLoggedIn(false);
      setTokenInfo(null);
    }, []);
  
    const refreshAccessToken = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
          const refresh = localStorage.getItem('refresh');
          const response = await axios.post(`${backendUrl}/api/auth/refresh/`, { refresh });
    
          if (response.status === 200) {
            console.log('updating tokens')
            localStorage.setItem('access', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);
            setTokenInfo({ access: response.data.access, refresh: response.data.refresh });
            setIsRefreshing(false);
            return response.data.access;
          } else {
            logout();
          }
        } catch{
          logout();
        } finally {
          setIsRefreshing(false);
        }
      }, [isRefreshing, logout]);
  
    const checkLoginStatus = () => {
      const access = localStorage.getItem('access');
      const refresh = localStorage.getItem('refresh');
      if (access) {
        setIsLoggedIn(true);
        setTokenInfo({ access, refresh: refresh || '' });
      }
    };
  
    useEffect(() => {
      checkLoginStatus();
    }, []); 
  
    useEffect(() => {
      const requestInterceptor = axios.interceptors.request.use(
        config => {
          const access = localStorage.getItem('access');
          if (access) {
            config.headers['Authorization'] = `Bearer ${access}`;
          }
          return config;
        },
        error => Promise.reject(error)
      );
  
      const responseInterceptor = axios.interceptors.response.use(
        response => response,
        async error => {
          const originalRequest = error.config;
          if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const newToken = await refreshAccessToken();
            if (newToken) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          }
          return Promise.reject(error);
        }
      );
  
      return () => {
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
      };
    }, [refreshAccessToken, logout]);
  
    return (
      <AuthContext.Provider value={{ isLoggedIn, logout, login, tokenInfo }}>
        {children}
      </AuthContext.Provider>
    );
  }