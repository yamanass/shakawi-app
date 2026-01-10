// src/view/Home.jsx
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
  fetchActivityLog, // <-- needs to exist in ../data/dashboardData
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
  const [_error, setError] = useState(null);

  // stats
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

  // activity log (audit)
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(null);

  // UI state for progressive reveal of dates
  const [datesList, setDatesList] = useState([]); // array of dateKey strings sorted desc
  const [groupedByDate, setGroupedByDate] = useState({}); // { dateKey: [items...] }
  const [revealedIndex, setRevealedIndex] = useState(-1); // last index revealed (0 is newest)

  // helpers
  const parseDateKey = (raw) => {
    if (!raw) return null;
    // try Date parse
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10); // yyyy-mm-dd
    // fallback: try to extract yyyy-mm-dd from string
    const m = String(raw).match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    // if nothing, return raw truncated
    return String(raw).slice(0, 10);
  };

  const formatActivityDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleString();
    } catch {
      return d;
    }
  };

  // group activityLog by date and prepare datesList
  useEffect(() => {
    if (!Array.isArray(activityLog)) {
      setGroupedByDate({});
      setDatesList([]);
      setRevealedIndex(-1);
      return;
    }

    const map = {};
    for (const it of activityLog) {
      const key = parseDateKey(it.created_at) || "unknown";
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }

    // sort items inside each date by time desc (newest first)
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const da = new Date(a.created_at).getTime() || 0;
        const db = new Date(b.created_at).getTime() || 0;
        return db - da;
      });
    }

    // build sorted date keys desc (newest date first)
    const keys = Object.keys(map).sort((a, b) => {
      // compare as ISO yyyy-mm-dd strings works
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return b.localeCompare(a);
    });

    setGroupedByDate(map);
    setDatesList(keys);

    // set initial revealedIndex:
    // if today's date present, reveal it; otherwise reveal index 0 (newest)
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayIdx = keys.indexOf(todayKey);
    if (todayIdx !== -1) {
      setRevealedIndex(todayIdx);
    } else {
      setRevealedIndex(keys.length > 0 ? 0 : -1);
    }
  }, [activityLog]);

  // loader functions
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, countsRes] = await Promise.allSettled([fetchDashboardData(), fetchCounts()]);
      const dashOk = dashRes.status === "fulfilled" && dashRes.value;
      const countsOk = countsRes.status === "fulfilled" && countsRes.value;
      const dash = dashOk ? dashRes.value : { ministries: 0, branches: 0, employees: 0, metrics: {}, updatedAt: new Date().toISOString(), raw: null };
      const counts = countsOk ? countsRes.value : null;
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

  const loadAllStats = async () => {
    setStatsLoading(true);
    setByMBLoading(true);
    setMonthlyLoading(true);
    setUserActivityLoading(true);
    setStatsError(null);
    setByMBError(null);
    setMonthlyError(null);
    setUserActivityError(null);
    setActivityLoading(true);
    setActivityError(null);

    try {
      const results = await Promise.allSettled([
        fetchStatsByStatus(),
        fetchStatsByMinistryAndBranch(),
        fetchStatsByMonth(),
        fetchStatsByUserActivity(),
        fetchActivityLog(),
      ]);

      const [sStat, sByMB, sMonth, sUserAct, sActivity] = results;

      if (sStat.status === "fulfilled") setStatusStats(Array.isArray(sStat.value) ? sStat.value : []);
      else { console.error(sStat.reason); setStatusStats([]); setStatsError("فشل جلب إحصاءات الحالة"); }

      if (sByMB.status === "fulfilled") setByMinistryBranch(Array.isArray(sByMB.value) ? sByMB.value : []);
      else { console.error(sByMB.reason); setByMinistryBranch([]); setByMBError("فشل جلب إحصاءات الوزارات/الفروع"); }

      if (sMonth.status === "fulfilled") setMonthlyStats(Array.isArray(sMonth.value) ? sMonth.value : []);
      else { console.error(sMonth.reason); setMonthlyStats([]); setMonthlyError("فشل جلب الإحصاءات الشهرية"); }

      if (sUserAct.status === "fulfilled") setUserActivity(Array.isArray(sUserAct.value) ? sUserAct.value : []);
      else { console.error(sUserAct.reason); setUserActivity([]); setUserActivityError("فشل جلب إحصاءات نشاط المواطنين"); }

      // activity log
      if (sActivity.status === "fulfilled") {
        const body = sActivity.value ?? [];
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        setActivityLog(list);
      } else {
        console.error(sActivity.reason);
        setActivityLog([]);
        setActivityError("فشل جلب سجل العمليات");
      }
    } catch (err) {
      console.error("[loadAllStats] unexpected error:", err);
      setActivityLog([]);
      setActivityError("فشل جلب سجل العمليات");
    } finally {
      setStatsLoading(false);
      setByMBLoading(false);
      setMonthlyLoading(false);
      setUserActivityLoading(false);
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAllStats();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([load(), loadAllStats()]);
    } finally {
      setLoading(false);
    }
  };

  // helpers for status / reporter (kept unchanged)
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
    const user = item?.citizen?.user;
    if (user) return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.phone || `ID:${item.citizen_id}`;
    const c = item?.citizen;
    if (c) return c.national_id || `ID:${item.citizen_id}`;
    return `ID:${item.citizen_id}`;
  };

  // reveal next date (progressive)
  const revealNext = (indexToReveal) => {
    // indexToReveal is the index of date in datesList we want to reveal.
    if (typeof indexToReveal !== "number") return;
    if (indexToReveal <= revealedIndex) return;
    setRevealedIndex(indexToReveal);
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
              disabled={loading || statsLoading || byMBLoading || monthlyLoading || userActivityLoading || activityLoading}
            >
              {loading || statsLoading ? "جاري التحديث..." : t("refresh") || "تحديث"}
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

        {/* Activity Log (grouped by date with progressive reveal) */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)", marginTop: 8 }}>
          <h3 style={{ marginTop: 0 }}>سجل العمليات</h3>

          {activityLoading ? (
            <div>جاري تحميل سجل العمليات...</div>
          ) : activityError ? (
            <div style={{ color: "red" }}>{activityError}</div>
          ) : datesList.length === 0 ? (
            <div style={{ color: "#6b7280" }}>لا توجد عمليات حديثة</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              {datesList.map((dateKey, idx) => {
                const items = groupedByDate[dateKey] || [];
                const isRevealed = idx <= revealedIndex;
                const displayLabel = (dateKey === new Date().toISOString().slice(0,10)) ? "اليوم" : (new Date(dateKey).toLocaleDateString() || dateKey);

                // if not revealed but it's exactly the next to reveal, render a "عرض المزيد" CTA for this date (without items)
                const isNextToReveal = idx === revealedIndex + 1;

                return (
                  <div key={dateKey} style={{ borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{displayLabel}</div>
                      {!isRevealed && !isNextToReveal ? (
                        // collapsed and not the immediate next — show small summary text
                        <div style={{ color: "#6b7280", fontSize: 13 }}>{items.length} عملية</div>
                      ) : null}
                    </div>

                    {isRevealed ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {items.map((it) => {
                          const subject = it.subject ?? {};
                          const performed = it.performed_by ?? {};
                          const performerName = typeof performed === "string" ? performed : (performed.name || performed.username || (performed?.role ? `${performed.role}` : "غير معروف"));
                          const subjRef = subject.reference || subject.id || "-";
                          return (
                            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #eef2f7" }}>
                              <div style={{ maxWidth: "72%" }}>
                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{it.action} · {subject.type || "موضوع"}</div>
                                <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>مرجع: {subjRef}</div>
                              </div>

                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700 }}>{performerName}</div>
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{formatActivityDate(it.created_at)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : isNextToReveal ? (
                      // show single CTA card to reveal this date's items
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button
                          onClick={() => revealNext(idx)}
                          className="submit-btn"
                          style={{ padding: "8px 16px", borderRadius: 10 }}
                        >
                          عرض المزيد ({items.length} عملية)
                        </button>
                      </div>
                    ) : (
                      // collapsed, and not immediate next: show small CTA to reveal up to this date (user can click older CTA step-by-step)
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button
                          onClick={() => revealNext(idx)}
                          className="submit-btn"
                          style={{ padding: "6px 12px", borderRadius: 8, background: "#f3f4f6", color: "#0f172a" }}
                        >
                          عرض المزيد ({items.length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* rest of dashboard (status, by-ministry, user activity, monthly stats) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start", marginTop: 18 }}>
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

        {/* user activity card */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)", marginTop: 18 }}>
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
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.04)", marginTop: 18 }}>
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

      <style>{`
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
        .submit-btn { padding: 8px 12px; background: #0ea5e9; color: #fff; border-radius: 8px; border: none; cursor: pointer; }
        .submit-btn:hover { opacity: 0.95; }
      `}</style>
    </div>
  );
}
