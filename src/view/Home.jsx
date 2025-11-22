// src/view/Home.jsx
import React, { useMemo } from "react";
import Sidebar from "../components/Sidebar";
import "../app.css";

export default function Home() {
  const SIDEBAR_WIDTH = 240;

  // detect current direction (reads document dir set في App.jsx)
  const isRtl = useMemo(() => {
    try {
      return document?.documentElement?.getAttribute("dir") === "rtl";
    } catch {
      return false;
    }
  }, []);

  // compute inline styles to support both LTR/RTL
  const mainStyle = {
    marginLeft: isRtl ? 0 : SIDEBAR_WIDTH,
    marginRight: isRtl ? SIDEBAR_WIDTH : 0,
    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "32px 40px",
    transition: "0.25s ease",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fa" }}>
      {/* Sidebar fixed: its CSS will place it left or right depending on dir */}
      <Sidebar />

      {/* Main wrapper */}
      <main style={mainStyle}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: "#1e293b" }}>
          الرئيسية
        </h1>

        {/* TOP CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 22,
          }}
        >
          <div style={{
            background: "#e8f1ff",
            padding: 22,
            borderRadius: 18,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <h3 style={{ margin: 0, color: "#003f91", fontSize: 20 }}>الوزارات</h3>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, color: "#003f91" }}>0</p>
          </div>

          <div style={{
            background: "#e9f9f0",
            padding: 22,
            borderRadius: 18,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <h3 style={{ margin: 0, color: "#0f5132", fontSize: 20 }}>الأفرع</h3>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, color: "#198754" }}>0</p>
          </div>

          <div style={{
            background: "#fff4e5",
            padding: 22,
            borderRadius: 18,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <h3 style={{ margin: 0, color: "#b45309", fontSize: 20 }}>الموظفون</h3>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, color: "#d97706" }}>0</p>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div style={{
          background: "#fff",
          padding: 28,
          borderRadius: 18,
          boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>
          <h2 style={{ margin: 0, fontSize: 24, color: "#1e293b" }}>ملخص النظام</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 20,
            fontSize: 18,
          }}>
            <div>إجمالي الوزارات: <span style={{ fontWeight: 700, color: "#003f91" }}>0</span></div>
            <div>إجمالي الأفرع: <span style={{ fontWeight: 700, color: "#198754" }}>0</span></div>
            <div>إجمالي الموظفون: <span style={{ fontWeight: 700, color: "#d97706" }}>0</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}
