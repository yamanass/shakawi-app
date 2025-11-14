// src/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './view/auth/Login'; // رابط صحيح حسب مسارك

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route يظهر Login أول ما يفتح التطبيق */}
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      {/* مثال على صفحة رئيسية بعد تسجيل الدخول */}
      {/* <Route path="/home" element={<Home />} /> */}

      {/* مسار 404 */}
      <Route path="*" element={<h2>صفحة غير موجودة</h2>} />
    </Routes>
  );
};

export default AppRoutes;
