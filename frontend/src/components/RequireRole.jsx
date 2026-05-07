import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function RequireRole({ allowedRoles }) {
  const user = useStore(state => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything by default or we can explicitly list them
  if (user.role === 'admin' || allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  // Redirect unauthorized users to dashboard
  return <Navigate to="/" replace />;
}
