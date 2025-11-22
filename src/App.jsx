// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { useTranslation } from "react-i18next";

function App() {
  const { i18n } = useTranslation();

  // ⭐ قلب الاتجاه تلقائي عند تغيير اللغة
  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
