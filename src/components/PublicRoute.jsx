import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export default function PublicRoute({ children }) {
  if (isAuthenticated()) {
    // لو المسجل دخولًا، أعد توجيهه للـ home مباشرة
    return <Navigate to="/home" replace />;
  }
  return children;
}
