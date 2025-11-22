import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export default function ProtectedRoute({ children }) {
  const authed = isAuthenticated();
  const loc = useLocation();

  if (!authed) {
    // لو ما سجل دخل، أعد التوجيه لصفحة login مع حفظ المكان (اختياري)
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  return children;
}
