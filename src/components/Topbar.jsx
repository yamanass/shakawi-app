import React from "react";
import { FaSignOutAlt, FaGlobe } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./topbar.css";

export default function TopBar({ onLogout = () => {}, onLangChange = null }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const toggleLang = () => {
    const next = currentLang === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    // set dir on root so layout.css RTL rules apply
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    if (typeof onLangChange === "function") onLangChange(next);
  };

  const handleLogout = () => {
    // تنفيذ تسجيل الخروج: امسح التوكنات والـ localStorage ثم نعيد التوجيه
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      // استدعاء callback لو الأب يريد عمل إضافي
      onLogout();
      // اذهب لصفحة الدخول
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout failed", e);
      // fallback redirect
      window.location.href = "/login";
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* زر اختصار عى اليسار (أو اليمين في RTL) */}
        <button className="icon-btn" aria-label="menu-toggle">
          {/* لو عندك أيقونة القوائم هنا */}
          ☰
        </button>
      </div>

      <div className="topbar-center">
        <h3 className="app-title">Admin Panel</h3>
      </div>

      <div className="topbar-right">
        <button className="icon-btn lang-btn" title="Toggle language" onClick={toggleLang}>
          <FaGlobe />
          <span className="label">{currentLang === "ar" ? "AR" : "EN"}</span>
        </button>

        <button className="icon-btn logout-btn" title="Logout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span className="label">Logout</span>
        </button>
      </div>
    </header>
  );
}
