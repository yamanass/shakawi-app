// src/view/Home.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import "../app.css";
import {
  fetchDashboardData,
  fetchDashboardReport,
  fetchStatsByStatus,
  fetchStatsByMinistryAndBranch,
  fetchStatsByMonth,
  fetchStatsByUserActivity,
  fetchCounts, // <-- added: counts endpoint
} from "../data/dashboardData";

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

  // main dashboard data
  const [data, setData] = useState({ ministries: 0, branches: 0, employees: 0, metrics: {}, updatedAt: null });
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
 const [_error, setError] = useState(null);

  // new stats states
  const [statusStats, setStatusStats] = useState([]); // [{status, total, percentage}, ...]
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const [byMinistryBranch, setByMinistryBranch] = useState([]); // array of {ministry_id, ministry_branch_id, total, ministry, ministry_branch}
  const [byMBLoading, setByMBLoading] = useState(false);
  const [byMBError, setByMBError] = useState(null);

  const [monthlyStats, setMonthlyStats] = useState([]); // [{year, month, new_count, ...}]
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);

  // new: user activity (citizens + counts)
  const [userActivity, setUserActivity] = useState([]); // [{ citizen_id, total, citizen: {user: {...}} }]
  const [userActivityLoading, setUserActivityLoading] = useState(false);
  const [userActivityError, setUserActivityError] = useState(null);

  // helper loaders
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch dashboard data and counts in parallel.
      const [dashRes, countsRes] = await Promise.allSettled([fetchDashboardData(), fetchCounts()]);

      const dashOk = dashRes.status === "fulfilled" && dashRes.value;
      const countsOk = countsRes.status === "fulfilled" && countsRes.value;

      const dash = dashOk ? dashRes.value : { ministries: 0, branches: 0, employees: 0, metrics: {}, updatedAt: new Date().toISOString(), raw: null };
      const counts = countsOk ? countsRes.value : null;

      // Use counts (getCounts) when available; otherwise fall back to dashboardData
      setData({
        ministries: counts?.ministries_count ?? dash?.ministries ?? 0,
        branches: counts?.branches_count ?? dash?.branches ?? 0,
        employees: counts?.employees_count ?? dash?.employees ?? 0,
        metrics: dash.metrics || {},
        updatedAt: dash.updatedAt || (counts?.raw?.updated_at) || new Date().toISOString(),
        raw: { dashboardCall: dash.raw ?? null, countsCall: counts?.raw ?? null },
      });
    } catch (err) {
      console.error("fetchDashboardData / fetchCounts failed:", err);
      setError("فشل تحميل بيانات اللوحة");
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setReportLoading(true);
    try {
      await fetchDashboardReport(true);
    } catch (err) {
      console.error("View report failed:", err);
      alert("فشل تحميل التقرير: " + (err?.message || "خطأ غير معروف"));
    } finally {
      setReportLoading(false);
    }
  };

  // fetch the statistics endpoints (including user activity)
  const loadAllStats = async () => {
    setStatsLoading(true);
    setByMBLoading(true);
    setMonthlyLoading(true);
    setUserActivityLoading(true);
    setStatsError(null);
    setByMBError(null);
    setMonthlyError(null);
    setUserActivityError(null);

    try {
      const results = await Promise.allSettled([
        fetchStatsByStatus(),
        fetchStatsByMinistryAndBranch(),
        fetchStatsByMonth(),
        fetchStatsByUserActivity(), // <-- call
      ]);

      // results order matches the array above
      const [sStat, sByMB, sMonth, sUserAct] = results;

      // status
      if (sStat.status === "fulfilled") {
        setStatusStats(Array.isArray(sStat.value) ? sStat.value : []);
      } else {
        console.error("[loadAllStats] fetchStatsByStatus failed:", sStat.reason);
        setStatsError("فشل جلب إحصاءات الحالة");
        setStatusStats([]);
      }

      // by ministry & branch
      if (sByMB.status === "fulfilled") {
        setByMinistryBranch(Array.isArray(sByMB.value) ? sByMB.value : []);
      } else {
        console.error("[loadAllStats] fetchStatsByMinistryAndBranch failed:", sByMB.reason);
        setByMBError("فشل جلب إحصاءات الوزارات/الفروع");
        setByMinistryBranch([]);
      }

      // monthly
      if (sMonth.status === "fulfilled") {
        setMonthlyStats(Array.isArray(sMonth.value) ? sMonth.value : []);
      } else {
        console.error("[loadAllStats] fetchStatsByMonth failed:", sMonth.reason);
        setMonthlyError("فشل جلب الإحصاءات الشهرية");
        setMonthlyStats([]);
      }

      // user activity
      if (sUserAct.status === "fulfilled") {
        setUserActivity(Array.isArray(sUserAct.value) ? sUserAct.value : []);
      } else {
        console.error("[loadAllStats] fetchStatsByUserActivity failed:", sUserAct.reason);
        setUserActivityError("فشل جلب إحصاءات نشاط المواطنين");
        setUserActivity([]);
      }
    } catch (err) {
      console.error("[loadAllStats] unexpected error:", err);
      setStatsError("فشل جلب الإحصاءات");
      setByMBError("فشل جلب الإحصاءات");
      setMonthlyError("فشل جلب الإحصاءات");
      setUserActivityError("فشل جلب إحصاءات المواطنين");
    } finally {
      setStatsLoading(false);
      setByMBLoading(false);
      setMonthlyLoading(false);
      setUserActivityLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAllStats();
  }, []);

  const onViewReport = async () => {
    await loadReport();
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([load(), loadAllStats()]);
    } finally {
      setLoading(false);
    }
  };

  // small helpers to render status cards
  const statusFriendly = (s) => {
    if (!s) return s;
    const key = String(s).toLowerCase();
    switch (key) {
      case "new": return "جديد";
      case "in_progress":
      case "inprogress":
      case "in-progress": return "قيد المعالجة";
      case "resolved": return "تم حلها";
      case "rejected": return "مرفوضة";
      case "closed": return "مغلقة";
      default: return s;
    }
  };

  const reporterName = (item) => {
    // item.citizen.user first_name/last_name or fallback national_id
    const user = item?.citizen?.user;
    if (user) return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.phone || `ID:${item.citizen_id}`;
    // fallback to citizen
    const c = item?.citizen;
    if (c) return c.national_id || `ID:${item.citizen_id}`;
    return `ID:${item.citizen_id}`;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f6f9" }}>
      <Sidebar />

      <main style={mainStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700, color: "#1e293b" }}>{t("home")}</h1>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={refreshAll}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #2b7ed3", background: loading ? "#dbeefc" : "#e8f4ff" }}
              disabled={loading || statsLoading || byMBLoading || monthlyLoading || userActivityLoading}
            >
              {loading || statsLoading ? "جاري التحديث..." : t("refresh") || "تحديث"}
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

        {/* Top counts */}
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

        {/* System summary and mini metrics */}

        {/* NEW: status cards + by-ministry table */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
            <h3 style={{ marginTop: 0 }}>حالة الشكاوي</h3>
            {statsLoading ? (
              <div>جاري تحميل إحصاءات الحالة...</div>
            ) : statsError ? (
              <div style={{ color: "red" }}>{statsError}</div>
            ) : statusStats.length === 0 ? (
              <div style={{ color: "#6b7280" }}>لا توجد بيانات</div>
            ) : (
              <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                {statusStats.map((s) => (
                  <div key={String(s.status || Math.random())} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "#f8fafc" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "#334155", fontWeight: 700 }}>{statusFriendly(s.status)}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{s.total ?? 0} شكوى</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{s.percentage ?? ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
            <h3 style={{ marginTop: 0 }}>عدد الشكاوى بحسب الوزارة/الفرع</h3>

            {byMBLoading ? (
              <div>جاري تحميل...</div>
            ) : byMBError ? (
              <div style={{ color: "red" }}>{byMBError}</div>
            ) : byMinistryBranch.length === 0 ? (
              <div style={{ color: "#6b7280" }}>لا توجد بيانات</div>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eef2f7" }}>
                      <th style={{ padding: "8px 6px" }}>الوزارة</th>
                      <th style={{ padding: "8px 6px" }}>الفرع</th>
                      <th style={{ padding: "8px 6px", width: 120 }}>المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMinistryBranch.map((r, idx) => {
                      const mName = r.ministry?.abbreviation || r.ministry?.name || `ID:${r.ministry_id}`;
                      const bName = r.ministry_branch ? (r.ministry_branch.name || `ID:${r.ministry_branch.id}`) : "عام (بدون فرع)";
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #fafafa" }}>
                          <td style={{ padding: "10px 6px" }}>{mName}</td>
                          <td style={{ padding: "10px 6px" }}>{bName}</td>
                          <td style={{ padding: "10px 6px", fontWeight: 700 }}>{r.total ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* NEW SECTION: User activity (citizens who submit complaints) */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>المواطنون الأكثر نشاطاً (مقدمو الشكاوى)</h3>

          {userActivityLoading ? (
            <div>جاري تحميل بيانات المواطنين...</div>
          ) : userActivityError ? (
            <div style={{ color: "red" }}>{userActivityError}</div>
          ) : userActivity.length === 0 ? (
            <div style={{ color: "#6b7280" }}>لا توجد بيانات</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 10 }}>
              {userActivity.map((u, i) => {
                const name = reporterName(u);
                const email = u?.citizen?.user?.email || "-";
                const phone = u?.citizen?.user?.phone || "-";
                const total = u?.total ?? 0;
                return (
                  <div key={u.citizen_id ?? i} style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #eef6ff", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{name}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0b5ed7" }}>{total}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{email}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{phone}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* monthly stats */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>إحصاءات بحسب الشهر</h3>

          {monthlyLoading ? (
            <div>جاري تحميل...</div>
          ) : monthlyError ? (
            <div style={{ color: "red" }}>{monthlyError}</div>
          ) : monthlyStats.length === 0 ? (
            <div style={{ color: "#6b7280" }}>لا توجد بيانات</div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #eef2f7" }}>
                    <th style={{ padding: "8px 6px" }}>السنة</th>
                    <th style={{ padding: "8px 6px" }}>الشهر</th>
                    <th style={{ padding: "8px 6px" }}>جديد</th>
                    <th style={{ padding: "8px 6px" }}>قيد المعالجة</th>
                    <th style={{ padding: "8px 6px" }}>تم حلها</th>
                    <th style={{ padding: "8px 6px" }}>مرفوضة</th>
                    <th style={{ padding: "8px 6px" }}>المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #fafafa" }}>
                      <td style={{ padding: "10px 6px" }}>{m.year}</td>
                      <td style={{ padding: "10px 6px" }}>{m.month}</td>
                      <td style={{ padding: "10px 6px" }}>{m.new_count ?? m.new ?? 0}</td>
                      <td style={{ padding: "10px 6px" }}>{m.in_progress_count ?? m.in_progress ?? 0}</td>
                      <td style={{ padding: "10px 6px" }}>{m.resolved_count ?? m.resolved ?? 0}</td>
                      <td style={{ padding: "10px 6px" }}>{m.rejected_count ?? m.rejected ?? 0}</td>
                      <td style={{ padding: "10px 6px", fontWeight: 700 }}>{m.total ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
