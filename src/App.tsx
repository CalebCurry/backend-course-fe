import { useState, createContext, useEffect, useContext, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedPage from './pages/ProtectedPage';
import MenuBar from './components/MenuBar';
import HomePage from './pages/Homepage';
import { backendUrl } from './shared';

type AuthContextType = {
  isLoggedIn: boolean;
  logout: () => void;
  login: (username: string, password: string) => Promise<void>;
  tokenInfo: TokenInfo;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  logout: () => {},
  login: async () => {},
  tokenInfo: null,
});

type TokenInfo = {
  access: string;
  refresh: string;
} | null;

function AuthProvider({ children }: { children: ReactNode }) {
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

function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <Router>
      <MenuBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/protected" element={isLoggedIn ? <ProtectedPage /> : <Navigate to="/login" />} />
        </Routes>
    </Router>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
