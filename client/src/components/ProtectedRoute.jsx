import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { token, user } = useContext(AuthContext);
  const { pathname }   = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // non-admin hitting /dashboard
  if (pathname.startsWith('/dashboard') && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
