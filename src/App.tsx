import { useState, createContext, useContext, useEffect } from 'react'
import axios from 'axios'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const AuthContext = createContext({ isLoggedIn: false, handleLogin: () => {}, handleLogout: () => {} });

import { ReactNode } from 'react';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({ access: '', refresh: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogin = async (username: string, password: string) => {
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

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setIsLoggedIn(false);
    setTokenInfo({ access: '', refresh: '' });
  };

  const refreshAccessToken = async () => {
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
        handleLogout();
      }
    } catch (error) {
      handleLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

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
  }, [refreshAccessToken, handleLogout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, handleLogin, handleLogout, tokenInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin } = useContext(AuthContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Username:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>
      <button type="submit">Login</button>
    </form>
  );
}

function ProtectedContent() {
  const { tokenInfo } = useContext(AuthContext);

  const handleRestrictedAction = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/files`);
      console.log('Restricted action response:', response.data);
    } catch (error) {
      console.error('Restricted action failed', error);
    }
  };

  return (
    <div>
      <div>
        <h3>Access Token:</h3>
        <pre>...{tokenInfo.access.substring(210)}</pre>
      </div>
      <div>
        <h3>Refresh Token:</h3>
        <pre>...{tokenInfo?.refresh?.substring(210)}</pre>
      </div>
      <button onClick={handleRestrictedAction}>Restricted Action</button>
    </div>
  );
}

function App() {
  const { isLoggedIn, handleLogout } = useContext(AuthContext);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Authentication</h1>
      <div className="card">
        {isLoggedIn ? (
          <>
            <button onClick={handleLogout}>Logout</button>
            <ProtectedContent />
          </>
        ) : (
          <LoginForm />
        )}
      </div>
    </>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
