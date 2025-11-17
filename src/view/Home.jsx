// src/view/Home.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import "../app.css"; // لو عندك css عام

export default function Home() {
  const SIDEBAR_WIDTH = 240; // غيّر إذا عرض السايدبار مختلف

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eaf6ef" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content — يملأ كل العرض المتبقي */}
      <main
        style={{
          marginLeft: SIDEBAR_WIDTH,                // يترك مكان السايدبار
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`, // يملأ المساحة الباقية
          minHeight: "100vh",
          boxSizing: "border-box",
          padding: "28px 36px",                     // المسافات داخل الصفحة
          transition: "margin-left 0.2s, width 0.2s",
        }}
      >
        {/* Content wrapper — بدون maxWidth أو margin:auto */}
        <section
          style={{
            width: "100%",               // مهم — ممتد بكامل المساحة المتبقية
            background: "#fff",
            padding: 28,
            borderRadius: 12,
            boxShadow: "0 6px 24px rgba(2,6,23,0.06)",
            boxSizing: "border-box",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 34, color: "#0f172a" }}>Home</h1>
          <p style={{ color: "#55606a", marginTop: 10 }}>
            Welcome to your dashboard. Now the Home area stretches from the sidebar to the right edge.
          </p>

          <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
            <div style={{ flex: 1, padding: 16, borderRadius: 10, background: "#f8fafc" }}>
              <h3 style={{ marginTop: 0 }}>Ministries</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>List and actions appear here.</p>
            </div>

            <div style={{ flex: 1, padding: 16, borderRadius: 10, background: "#f0fdf4" }}>
              <h3 style={{ marginTop: 0 }}>Branches</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>Branch summary here.</p>
            </div>

            <div style={{ flex: 1, padding: 16, borderRadius: 10, background: "#fff7ed" }}>
              <h3 style={{ marginTop: 0 }}>Employees</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>Employees quick info.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
