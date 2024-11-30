import React from 'react';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/Context';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useContext(AuthContext);

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected component
  return children;
}

export default ProtectedRoute;
