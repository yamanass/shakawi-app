// src/view/Home.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import "../app.css";
import { fetchDashboardData, fetchDashboardReport } from "../data/dashboardData";

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

  const [data, setData] = useState({ ministries: 0, branches: 0, employees: 0, metrics: {}, updatedAt: null });
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDashboardData();
      setData(d);
    } catch  {
      setError("فشل تحميل بيانات اللوحة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onViewReport = async () => {
    setReportLoading(true);
    try {
      await fetchDashboardReport(true); // يفتح الملف في تاب جديد
    } catch (err) {
      console.error("View report failed:", err);
      alert("فشل تحميل التقرير: " + (err?.message || "خطأ غير معروف"));
    } finally {
      setReportLoading(false);
    }
  };

  const renderMiniMetrics = () => {
    const m = data.metrics || {};
    const entries = Object.entries(m).slice(0, 6);
    if (entries.length === 0) return <div style={{ color: "#94a3b8" }}>{t("noMetrics") || "لا توجد إحصاءات"}</div>;

    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ minWidth: 120, padding: 10, borderRadius: 12, background: "#f8fafc", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{String(v)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f6f9" }}>
      <Sidebar />

      <main style={mainStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, color: "#1e293b" }}>{t("home")}</h1>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={load}
              style={{ padding: "8px 12px", borderRadius: 8, background: "#e8f4ff", border: "1px solid #2b7ed3" }}
              disabled={loading}
            >
              {loading ? "جاري التحديث..." : t("refresh") || "تحديث"}
            </button>

            <button
              onClick={onViewReport}
              style={{ padding: "8px 12px", borderRadius: 8, background: "#e6ffef", border: "1px solid #12a05b" }}
              disabled={reportLoading}
            >
              {reportLoading ? "جاري التحميل..." : "عرض التقرير"}
            </button>

            <div style={{ color: "#64748b", fontSize: 14 }}>
              {data.updatedAt ? `آخر تحديث: ${new Date(data.updatedAt).toLocaleString()}` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <div style={{ ...cardStyle, background: "#e8f1ff" }} className="hover-card">
            <h3 style={{ margin: 0, color: "#003f91", fontSize: 20 }}>{t("ministries")}</h3>
            <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: "#003f91" }}>{data?.ministries ?? 0}</p>
          </div>

          <div style={{ ...cardStyle, background: "#e9f9f0" }} className="hover-card">
            <h3 style={{ margin: 0, color: "#0f5132", fontSize: 20 }}>{t("branches")}</h3>
            <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: "#198754" }}>{data?.branches ?? 0}</p>
          </div>

          <div style={{ ...cardStyle, background: "#fff4e5" }} className="hover-card">
            <h3 style={{ margin: 0, color: "#b45309", fontSize: 20 }}>{t("employees")}</h3>
            <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, color: "#d97706" }}>{data?.employees ?? 0}</p>
          </div>
        </div>

        <div style={{ background: "#fff", padding: 28, borderRadius: 18, boxShadow: "0 6px 24px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 20 }}>
          <h2 style={{ margin: 0, fontSize: 26, color: "#1e293b" }}>{t("systemSummary")}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, fontSize: 18, color: "#475569" }}>
            <div>{t("totalMinistries")}: <span style={{ fontWeight: 700, color: "#003f91" }}>{data?.ministries ?? 0}</span></div>
            <div>{t("totalBranches")}: <span style={{ fontWeight: 700, color: "#198754" }}>{data?.branches ?? 0}</span></div>
            <div>{t("totalEmployees")}: <span style={{ fontWeight: 700, color: "#d97706" }}>{data?.employees ?? 0}</span></div>
          </div>

          <div>
            <h3 style={{ marginTop: 8, marginBottom: 6, fontSize: 16, color: "#334155" }}>{t("quickStats") || "إحصاءات سريعة"}</h3>
            {error ? <div style={{ color: "red" }}>{error}</div> : renderMiniMetrics()}
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
