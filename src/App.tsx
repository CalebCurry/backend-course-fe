import { unstable_HistoryRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedPage from './pages/ProtectedPage';
import MenuBar from './components/MenuBar';
import HomePage from './pages/Homepage';
import AuthProvider from './context/Provider';
import { createBrowserHistory } from 'history';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  const history = createBrowserHistory();
  return (
    <Router history={history}>

    <AuthProvider>
      <MenuBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
        </Routes>

    </AuthProvider>
    </Router> 
  );
}

export default function Root() {
  return (
      <App />
  );
}
