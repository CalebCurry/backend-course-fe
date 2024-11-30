import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedPage from './pages/ProtectedPage';
import MenuBar from './components/MenuBar';
import HomePage from './pages/Homepage';
import { AuthContext } from './context/Context';
import AuthProvider from './context/Provider';



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
