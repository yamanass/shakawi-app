import React, { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import "../app.css";
import {
  fetchStatsByStatus,
  fetchStatsByMinistryAndBranch,
  fetchStatsByMonth,
  fetchStatsByUserActivity,
  fetchCounts,
  fetchActivityLog,
} from "../data/dashboardData";

const COLORS = {
  primary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  background: "#f8fafc",
  card: "#ffffff",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const SIDEBAR_WIDTH = 240;

  const isRtl = useMemo(() => {
    return i18n.dir() === "rtl";
  }, [i18n.language]);

  const mainStyle = {
    marginLeft: isRtl ? 0 : SIDEBAR_WIDTH,
    marginRight: isRtl ? SIDEBAR_WIDTH : 0,
    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
    minHeight: "100vh",
    padding: "40px",
    backgroundColor: COLORS.background,
    transition: "all 0.3s ease",
  };

  const sectionCard = {
    background: COLORS.card,
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
  };

  const [data, setData] = useState({ ministries: 0, branches: 0, employees: 0 });
  const [loading, setLoading] = useState(false);
  const [statusStats, setStatusStats] = useState([]);
  const [byMinistryBranch, setByMinistryBranch] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [datesList, setDatesList] = useState([]);
  const [groupedByDate, setGroupedByDate] = useState({});

  const formatActivityDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statusFriendly = (s) => {
    const key = `status_${String(s).toLowerCase()}`;
    return t(key, { defaultValue: s });
  };

  useEffect(() => {
    if (!Array.isArray(activityLog)) return;
    const map = {};
    activityLog.forEach(it => {
      const key = it.created_at?.slice(0, 10) || "unknown";
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    setGroupedByDate(map);
    setDatesList(Object.keys(map).sort((a, b) => b.localeCompare(a)));
  }, [activityLog]);

  const loadData = async () => {
    setLoading(true); setActivityLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchCounts(), fetchStatsByStatus(), fetchStatsByMinistryAndBranch(),
        fetchStatsByMonth(), fetchStatsByUserActivity(), fetchActivityLog()
      ]);
      
      if (results[0].status === "fulfilled") setData({
        ministries: results[0].value?.ministries_count || 0,
        branches: results[0].value?.branches_count || 0,
        employees: results[0].value?.employees_count || 0
      });
      if (results[1].status === "fulfilled") setStatusStats(results[1].value || []);
      if (results[2].status === "fulfilled") setByMinistryBranch(results[2].value || []);
      if (results[3].status === "fulfilled") setMonthlyStats(results[3].value || []);
      if (results[4].status === "fulfilled") setUserActivity(results[4].value || []);
      if (results[5].status === "fulfilled") setActivityLog(results[5].value?.data || results[5].value || []);
    } finally { setLoading(false); setActivityLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.background }}>
      <Sidebar />
      <main style={mainStyle}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: COLORS.textPrimary }}>{t("home")}</h1>
            <p style={{ margin: "8px 0 0", color: COLORS.textSecondary }}>{t("appTitle")} | {t("systemSummary")}</p>
          </div>
          <button onClick={loadData} className="refresh-btn" disabled={loading}>
            {loading ? t("processing") : `🔄 ${t("refresh")}`}
          </button>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          {[
            { label: t("totalMinistries"), value: data.ministries, color: COLORS.primary, bg: "#eff6ff", icon: "🏢" },
            { label: t("totalBranches"), value: data.branches, color: COLORS.success, bg: "#ecfdf5", icon: "🌿" },
            { label: t("totalEmployees"), value: data.employees, color: COLORS.warning, bg: "#fffbeb", icon: "👥" },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ background: stat.bg }}>
              <div style={{ fontSize: "24px" }}>{stat.icon}</div>
              <div>
                <div style={{ color: COLORS.textSecondary, fontSize: "13px", fontWeight: "600" }}>{stat.label}</div>
                <div style={{ color: stat.color, fontSize: "28px", fontWeight: "800" }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
          <div style={{ ...sectionCard, height: "400px" }}>
            <h3 style={{ marginTop: 0 }}>📊 {t("complaintsDistribution")}</h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <table className="modern-table">
                <thead>
                  <tr><th>{t("ministry")}</th><th>{t("branches")}</th><th style={{textAlign: "center"}}>{t("count")}</th></tr>
                </thead>
                <tbody>
                  {byMinistryBranch.map((r, i) => (
                    <tr key={i}>
                      <td><span className="badge-ministry">{r.ministry?.abbreviation || r.ministry?.name}</span></td>
                      <td>{r.ministry_branch?.name || t("allBranches")}</td>
                      <td style={{ textAlign: "center", fontWeight: "700" }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...sectionCard, height: "400px" }}>
            <h3 style={{ marginTop: 0 }}>📉 {t("statusAnalysis")}</h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {statusStats.map((s, i) => (
                <div key={i} style={{ marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                    <span>{statusFriendly(s.status)}</span>
                    <span style={{fontWeight: "700"}}>{s.percentage}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: s.percentage, backgroundColor: COLORS.primary }}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...sectionCard, marginBottom: "32px" }}>
          <h3 style={{ marginTop: 0 }}>📅 {t("report")}</h3>
          <div className="custom-scroll" style={{ overflowX: "auto" }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>{t("month")}</th>
                  <th>{statusFriendly("new")}</th>
                  <th>{statusFriendly("in_progress")}</th>
                  <th>{statusFriendly("resolved")}</th>
                  <th>{statusFriendly("rejected")}</th>
                  <th style={{ background: "#f8fafc" }}>{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((m, i) => (
                  <tr key={i}>
                    <td>{m.year} / {m.month}</td>
                    <td>{m.new_count || 0}</td>
                    <td>{m.in_progress_count || 0}</td>
                    <td style={{ color: COLORS.success }}>{m.resolved_count || 0}</td>
                    <td style={{ color: COLORS.danger }}>{m.rejected_count || 0}</td>
                    <td style={{ fontWeight: "800" }}>{m.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div style={{ ...sectionCard, height: "500px" }}>
            <h3 style={{ marginTop: 0 }}>📜 {t("activityLog")}</h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {activityLoading ? <p>{t("loading")}</p> : datesList.map((dateKey) => (
                <div key={dateKey} style={{ marginBottom: '20px' }}>
                  <div className="date-divider">{dateKey === new Date().toISOString().slice(0, 10) ? t("today") : dateKey}</div>
                  {groupedByDate[dateKey].map((it) => (
                    <div key={it.id} className="activity-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "14px", color: COLORS.textPrimary }}>
                          {t(it.action.toLowerCase())} <span style={{color: COLORS.primary}}>← {t(it.subject?.type?.toLowerCase()) || t("report")}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: COLORS.textSecondary, marginTop: "4px" }}>
                           {t("abbreviation")}: {it.subject?.reference || "#" + it.id}
                        </div>
                      </div>
                      <div style={{ textAlign: isRtl ? "left" : "right" }}>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{it.performed_by?.name || t("undefined")}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{formatActivityDate(it.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...sectionCard, height: "500px" }}>
            <h3 style={{ marginTop: 0 }}>🌟 {t("activeCitizens")}</h3>
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {userActivity.map((u, i) => (
                <div key={i} className="citizen-row">
                  <span style={{ fontSize: '14px' }}>{u.citizen?.user?.first_name} {u.citizen?.user?.last_name}</span>
                  <span className="count-badge">{u.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .stat-card { padding: 20px; border-radius: 12px; display: flex; align-items: center; gap: 15px; }
        .refresh-btn { padding: 8px 16px; background: ${COLORS.primary}; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th { text-align: ${isRtl ? 'right' : 'left'}; padding: 12px; color: ${COLORS.textSecondary}; font-size: 13px; border-bottom: 2px solid #f1f5f9; }
        .modern-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .badge-ministry { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .progress-bar { height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.8s ease; }
        .date-divider { background: #f8fafc; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 10px; }
        .activity-item { display: flex; padding: 12px; border-bottom: 1px solid #f8fafc; }
        .citizen-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .count-badge { background: #eff6ff; color: ${COLORS.primary}; padding: 2px 10px; border-radius: 20px; font-weight: 700; font-size: 12px; }
      `}</style>
    </div>
  );
}