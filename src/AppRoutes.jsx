// src/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './view/auth/Login.jsx';
import Home from './view/Home.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      {}
      <Route path="/" element={<Navigate to="/login" />} />

      {}
      <Route path="/login" element={<Login />} />

      {}
      <Route path="/home" element={<Home />} />

      {}
      <Route path="*" element={<h2>صفحة غير موجودة</h2>} />
    </Routes>
  );
};

export default AppRoutes;
