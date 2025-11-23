import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import "../app.css";

export default function Home() {
const { t } = useTranslation();

const SIDEBAR_WIDTH = 240;

const isRtl = useMemo(() => {
try {
return document?.documentElement?.getAttribute("dir") === "rtl";
} catch {
return false;
}
}, []);

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

const cardStyle = {
padding: 24,
borderRadius: 18,
boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
display: "flex",
flexDirection: "column",
alignItems: "center",
transition: "0.2s",
cursor: "default",
};

return (
<div style={{ display: "flex", minHeight: "100vh", background: "#f3f6f9" }}> <Sidebar />


  <main style={mainStyle}>
    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, color: "#1e293b" }}>
      {t("home")}
    </h1>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
      }}
    >
      <div style={{ ...cardStyle, background: "#e8f1ff" }} className="hover-card">
        <h3 style={{ margin: 0, color: "#003f91", fontSize: 20 }}>{t("ministries")}</h3>
        <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: "#003f91" }}>0</p>
      </div>

      <div style={{ ...cardStyle, background: "#e9f9f0" }} className="hover-card">
        <h3 style={{ margin: 0, color: "#0f5132", fontSize: 20 }}>{t("branches")}</h3>
        <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: "#198754" }}>0</p>
      </div>

      <div style={{ ...cardStyle, background: "#fff4e5" }} className="hover-card">
        <h3 style={{ margin: 0, color: "#b45309", fontSize: 20 }}>{t("employees")}</h3>
        <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: "#d97706" }}>0</p>
      </div>
    </div>

    <div
      style={{
        background: "#fff",
        padding: 28,
        borderRadius: 18,
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 26, color: "#1e293b" }}>{t("systemSummary")}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 20,
          fontSize: 18,
          color: "#475569",
        }}
      >
        <div>
          {t("totalMinistries")}: <span style={{ fontWeight: 700, color: "#003f91" }}>0</span>
        </div>
        <div>
          {t("totalBranches")}: <span style={{ fontWeight: 700, color: "#198754" }}>0</span>
        </div>
        <div>
          {t("totalEmployees")}: <span style={{ fontWeight: 700, color: "#d97706" }}>0</span>
        </div>
      </div>
    </div>
  </main>

  <style>
    {`
      .hover-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.1);
      }
    `}
  </style>
</div>


);
}
