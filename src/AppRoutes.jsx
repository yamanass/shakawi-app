// src/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './view/auth/Login.jsx';
import Home from './view/Home.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route يظهر Login أول ما يفتح التطبيق */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* تسجيل الدخول */}
      <Route path="/login" element={<Login />} />

      {/* صفحة Home - أي مستخدم citizen يُوجّه إليها */}
      <Route path="/home" element={<Home />} />

      {/* مسار 404 */}
      <Route path="*" element={<h2>صفحة غير موجودة</h2>} />
    </Routes>
  );
};

export default AppRoutes;
