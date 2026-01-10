import React, { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import "../app.css";
import {
  fetchDashboardData,
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

  // --- State Management ---
  const [data, setData] = useState({ ministries: 0, branches: 0, employees: 0, updatedAt: null });
  const [loading, setLoading] = useState(false);
  
  const [statusStats, setStatusStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const [byMinistryBranch, setByMinistryBranch] = useState([]);
  const [byMBLoading, setByMBLoading] = useState(false);
  const [byMBError, setByMBError] = useState(null);

  const [monthlyStats, setMonthlyStats] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);

  const [userActivity, setUserActivity] = useState([]);
  const [userActivityLoading, setUserActivityLoading] = useState(false);
  const [userActivityError, setUserActivityError] = useState(null);

  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(null);

  const [datesList, setDatesList] = useState([]);
  const [groupedByDate, setGroupedByDate] = useState({});
  const [revealedIndex, setRevealedIndex] = useState(-1);

  // --- Helpers ---
  const parseDateKey = (raw) => {
    if (!raw) return null;
    const dt = new Date(raw);
    return !isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : String(raw).slice(0, 10);
  };

  const formatActivityDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleString('en-GB', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      }).replace(',', '');
    } catch { return d; }
  };

  useEffect(() => {
    if (!Array.isArray(activityLog)) return;
    const map = {};
    activityLog.forEach(it => {
      const key = parseDateKey(it.created_at) || "unknown";
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    const keys = Object.keys(map).sort((a, b) => b.localeCompare(a));
    setGroupedByDate(map);
    setDatesList(keys);
    setRevealedIndex(keys.length > 0 ? 0 : -1);
  }, [activityLog]);

  const loadAllStats = async () => {
    setStatsLoading(true); setByMBLoading(true); setMonthlyLoading(true);
    setUserActivityLoading(true); setActivityLoading(true);
    setStatsError(null); setByMBError(null); setMonthlyError(null);
    setUserActivityError(null); setActivityError(null);

    try {
      const results = await Promise.allSettled([
        fetchStatsByStatus(), fetchStatsByMinistryAndBranch(),
        fetchStatsByMonth(), fetchStatsByUserActivity(), fetchActivityLog(),
      ]);
      
      const [sStat, sByMB, sMonth, sUserAct, sActivity] = results;
      if (sStat.status === "fulfilled") setStatusStats(sStat.value || []); else setStatsError("خطأ في جلب الحالات");
      if (sByMB.status === "fulfilled") setByMinistryBranch(sByMB.value || []); else setByMBError("خطأ في جلب الوزارات");
      if (sMonth.status === "fulfilled") setMonthlyStats(sMonth.value || []); else setMonthlyError("خطأ في جلب البيانات الشهرية");
      if (sUserAct.status === "fulfilled") setUserActivity(sUserAct.value || []); else setUserActivityError("خطأ في جلب نشاط المستخدمين");
      if (sActivity.status === "fulfilled") setActivityLog(sActivity.value?.data || sActivity.value || []); else setActivityError("خطأ في جلب السجل");
    } finally {
      setStatsLoading(false); setByMBLoading(false); setMonthlyLoading(false);
      setUserActivityLoading(false); setActivityLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, countsRes] = await Promise.allSettled([fetchDashboardData(), fetchCounts()]);
      const dash = dashRes.status === "fulfilled" ? dashRes.value : {};
      const counts = countsRes.status === "fulfilled" ? countsRes.value : {};
      setData({
        ministries: counts?.ministries_count ?? dash?.ministries ?? 0,
        branches: counts?.branches_count ?? dash?.branches ?? 0,
        employees: counts?.employees_count ?? dash?.employees ?? 0,
        updatedAt: dash.updatedAt || new Date().toISOString(),
      });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); loadAllStats(); }, []);

  const statusFriendly = (s) => {
    const key = String(s).toLowerCase();
    const map = { "new": "جديد", "in_progress": "قيد المعالجة", "resolved": "تم حلها", "rejected": "مرفوضة", "closed": "مغلقة" };
    return map[key] || s;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.background }}>
      <Sidebar />
      <main style={mainStyle}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: COLORS.textPrimary }}>{t("home")}</h1>
            <p style={{ margin: "8px 0 0", color: COLORS.textSecondary }}>لوحة التحكم المركزية - نظام الشكاوى</p>
          </div>
          <button onClick={() => { loadData(); loadAllStats(); }} className="refresh-btn" disabled={loading}>
            {loading ? "..." : "🔄 تحديث البيانات"}
          </button>
        </header>

        {/* الكروت العلوية */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          {[
            { label: t("ministries"), value: data.ministries, color: COLORS.primary, bg: "#eff6ff", icon: "🏢" },
            { label: t("branches"), value: data.branches, color: COLORS.success, bg: "#ecfdf5", icon: "🌿" },
            { label: t("employees"), value: data.employees, color: COLORS.warning, bg: "#fffbeb", icon: "👥" },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ background: stat.bg }}>
              <div style={{ fontSize: "24px" }}>{stat.icon}</div>
              <div>
                <div style={{ color: COLORS.textSecondary, fontSize: "14px", fontWeight: "600" }}>{stat.label}</div>
                <div style={{ color: stat.color, fontSize: "28px", fontWeight: "800", marginTop: "4px" }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* توزيع الشكاوى */}
          <div style={{ ...sectionCard, height: "400px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>📊 توزيع الشكاوى حسب الجهة</h3>
            {byMBError && <div style={{color: COLORS.danger}}>{byMBError}</div>}
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>الوزارة</th>
                    <th>الفرع</th>
                    <th style={{ textAlign: "center" }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {byMBLoading ? <tr><td colSpan="3">جاري التحميل...</td></tr> : byMinistryBranch.map((r, idx) => (
                    <tr key={idx}>
                      <td><span className="badge-ministry">{r.ministry?.abbreviation || r.ministry?.name}</span></td>
                      <td>{r.ministry_branch?.name || "عام"}</td>
                      <td style={{ textAlign: "center", fontWeight: "700" }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* تحليل الحالات */}
          <div style={{ ...sectionCard, height: "400px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>📉 تحليل الحالات</h3>
            {statsError && <div style={{color: COLORS.danger}}>{statsError}</div>}
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {statsLoading ? <p>جاري التحميل...</p> : statusStats.map((s, i) => (
                  <div key={i} className="status-item">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>{statusFriendly(s.status)}</span>
                      <span style={{ color: COLORS.primary, fontWeight: "700" }}>{s.percentage}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: s.percentage, backgroundColor: COLORS.primary }}></div>
                    </div>
                    <span style={{ fontSize: "11px", color: COLORS.textSecondary }}>{s.total} شكوى</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* التقرير الشهري التراكمي - تمت إعادته لحل خطأ Unused Vars */}
        <div style={{ ...sectionCard, marginBottom: "32px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>📅 التقرير الشهري التراكمي</h3>
          {monthlyError && <div style={{color: COLORS.danger}}>{monthlyError}</div>}
          <div className="custom-scroll" style={{ overflowX: "auto" }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>السنة/الشهر</th>
                  <th>جديد</th>
                  <th>قيد المعالجة</th>
                  <th>تم حلها</th>
                  <th>مرفوضة</th>
                  <th style={{ background: "#f1f5f9" }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {monthlyLoading ? <tr><td colSpan="6" style={{textAlign: 'center'}}>جاري التحميل...</td></tr> : 
                  monthlyStats.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: "600" }}>{m.year} / {m.month}</td>
                    <td>{m.new_count || 0}</td>
                    <td>{m.in_progress_count || 0}</td>
                    <td style={{ color: COLORS.success }}>{m.resolved_count || 0}</td>
                    <td style={{ color: COLORS.danger }}>{m.rejected_count || 0}</td>
                    <td style={{ fontWeight: "800", background: "#f8fafc" }}>{m.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* سجل العمليات ونشاط المستخدمين */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
          
          <div style={{ ...sectionCard, minHeight: "500px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>سجل العمليات</h3>
            {activityError && <div style={{ color: COLORS.danger, fontSize: '12px' }}>{activityError}</div>}
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {activityLoading ? (
                <p style={{ textAlign: 'center' }}>جاري التحميل...</p>
              ) : datesList.map((dateKey, idx) => {
                const items = groupedByDate[dateKey] || [];
                const isRevealed = idx <= revealedIndex;
                const displayLabel = (dateKey === new Date().toISOString().slice(0, 10)) ? "اليوم" : dateKey;

                return (
                  <div key={dateKey} style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: "800", fontSize: "16px", marginBottom: "12px", color: "#0f172a" }}>{displayLabel}</div>
                    {isRevealed ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        {items.map((it) => {
                          const subject = it.subject ?? {};
                          const performed = it.performed_by ?? {};
                          const performerName = typeof performed === "string" ? performed : (performed.name || performed.username || "نظام");
                          const subjRef = subject.reference || subject.id || "N/A";
                          const subjType = subject.type || "إجراء";

                          return (
                            <div key={it.id} style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>
                                  {it.action} · {subjType}
                                </div>
                                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>مرجع: {subjRef}</div>
                              </div>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{performerName}</div>
                                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", direction: "ltr" }}>{formatActivityDate(it.created_at)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <button onClick={() => setRevealedIndex(idx)} className="show-more-btn">عرض {items.length} عملية</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...sectionCard, height: "500px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>🌟 المواطنون الأكثر نشاطاً</h3>
            {userActivityError && <div style={{ color: COLORS.danger, fontSize: '12px' }}>{userActivityError}</div>}
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {userActivityLoading ? (
                <p style={{ textAlign: 'center' }}>جاري التحميل...</p>
              ) : userActivity.map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{u.citizen?.user?.first_name} {u.citizen?.user?.last_name}</span>
                  <span style={{ fontWeight: '700', color: COLORS.primary, background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>{u.total} شكوى</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .stat-card { padding: 24px; border-radius: 16px; display: flex; align-items: center; gap: 20px; }
        .refresh-btn { padding: 10px 20px; background: ${COLORS.primary}; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .modern-table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: right; }
        .modern-table th { padding: 12px; background: #f8fafc; color: ${COLORS.textSecondary}; position: sticky; top: 0; }
        .modern-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
        .badge-ministry { padding: 4px 10px; background: #e0e7ff; color: #4338ca; border-radius: 6px; font-weight: 600; font-size: 11px; }
        .progress-bar { height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.5s ease; }
        .show-more-btn { width: 100%; padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; color: #64748b; cursor: pointer; }
      `}</style>
    </div>
  );
}