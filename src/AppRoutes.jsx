import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './view/auth/Login.jsx';
import Home from './view/Home.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout.jsx';
import Ministries from './view/ministry/Ministries.jsx';
import Employees from './view/employee/Employees.jsx';
import Complaints from './view/complaint/complaints.jsx'

const AppRoutes = () => (
  <Routes>

    {/* تحويل تلقائي للصفحة الرئيسية */}
    <Route path="/" element={<Navigate to="/home" replace />} />

    {/* صفحة تسجيل الدخول */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    {/* كل الصفحات بعد تسجيل الدخول */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      {/* الصفحات داخل Layout */}
      <Route path="home" element={<Home />} />
      <Route path="ministries" element={<Ministries />} />
      <Route path="employees" element={<Employees />} />
      <Route path="complaints" element={<Complaints />} />
    </Route>

    {/* صفحة غير موجودة */}
    <Route path="*" element={<h2>Page not found</h2>} />

  </Routes>
);

export default AppRoutes;
