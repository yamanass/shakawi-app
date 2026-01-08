// src/view/ministry/Ministries.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AddMinistry from "./AddMinistry";
import AddBranch from "./AddBranch";
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud.js";
import API from "../../services/api.js";
import "./ministry.css";

export default function Ministries() {
  const { t } = useTranslation();

  const [ministries, setMinistries] = useState([]);
  const [showAddMinistry, setShowAddMinistry] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // PDF viewer state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // deleting states
  const [deletingMinistryId, setDeletingMinistryId] = useState(null);
  const [deletingBranchId, setDeletingBranchId] = useState(null);

  const crud = useMemo(() => {
    return new Crud({
      baseURL: API.BASE,
      storageService: {
        getToken: () => localStorage.getItem("access_token"),
        getLang: () => "ar",
      },
    });
  }, []);

  const buildApiUrl = (path) => {
    const base = (API.BASE || "").replace(/\/+$/, "");
    if (!path) return base;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${base}${path.startsWith("/") ? path : "/" + path}`;
  };

  const _getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMinistries = useCallback(async () => {
    try {
      const res = await crud.get(API.MINISTRY.READ);
      if (res.data && Array.isArray(res.data.data)) {
        setMinistries(res.data.data);
      } else {
        setMinistries([]);
      }
    } catch (err) {
      console.error("Error fetching ministries:", err);
      setMinistries([]);
    }
  }, [crud]);

  useEffect(() => {
    fetchMinistries();
  }, [fetchMinistries]);

  // Delete ministry
  const deleteMinistry = async (ministryId) => {
    if (!ministryId) return;
    if (!window.confirm("تأكيد: هل تريد حذف هذه الوزارة نهائياً؟ هذه العملية لا يمكن التراجع عنها.")) return;
    setDeletingMinistryId(ministryId);
    try {
      const url = buildApiUrl(`/ministry/delete/${ministryId}`);
      await crud.client.delete(url, { headers: { ..._getAuthHeader() } });
      alert("تم حذف الوزارة بنجاح.");
      // refresh list and close detail if opened
      await fetchMinistries();
      if (selectedMinistry && selectedMinistry.id === ministryId) setSelectedMinistry(null);
    } catch (err) {
      console.error("[deleteMinistry] error:", err);
      const msg = err?.response?.data?.message || err?.message || "فشل حذف الوزارة";
      alert(msg);
    } finally {
      setDeletingMinistryId(null);
    }
  };

  // Delete branch
  const deleteBranch = async (branchId) => {
    if (!branchId) return;
    if (!window.confirm("تأكيد: هل تريد حذف هذا الفرع نهائياً؟ هذه العملية لا يمكن التراجع عنها.")) return;
    setDeletingBranchId(branchId);
    try {
      const url = buildApiUrl(`/ministry/branch/delete/${branchId}`);
      await crud.client.delete(url, { headers: { ..._getAuthHeader() } });
      alert("تم حذف الفرع بنجاح.");
      // refresh list and close branch dialog if opened
      await fetchMinistries();
      if (selectedBranch && selectedBranch.id === branchId) setSelectedBranch(null);
    } catch (err) {
      console.error("[deleteBranch] error:", err);
      const msg = err?.response?.data?.message || err?.message || "فشل حذف الفرع";
      alert(msg);
    } finally {
      setDeletingBranchId(null);
    }
  };

  // ----- Download / View PDF helpers -----
  const _openBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    return url;
  };

  const _fetchAndShowReport = async (absoluteUrl, title = "Report", useDialog = true) => {
    setPdfLoading(true);
    try {
      const headers = { ..._getAuthHeader(), Accept: "application/pdf" };
      const res = await crud.client.get(absoluteUrl, {
        responseType: "blob",
        headers,
      });

      const contentType = res.headers["content-type"] || "";
      const blob = new Blob([res.data], { type: contentType || "application/pdf" });

      if (contentType.includes("application/json") || contentType.includes("text/plain")) {
        try {
          const text = await blob.text();
          let parsed = null;
          try { parsed = JSON.parse(text); } catch { /* ignore */ }
          const msg = parsed?.message || text || "Server returned non-PDF response";
          alert("خطأ من السيرفر: " + msg);
          return;
        } catch (e) {
          console.warn("Cannot parse non-PDF blob", e);
        }
      }

      if (useDialog) {
        const url = URL.createObjectURL(blob);
        if (pdfUrl) { try { URL.revokeObjectURL(pdfUrl); } catch { /* ignore */ } }
        setPdfUrl(url);
        setPdfTitle(title);
        setShowPdfDialog(true);
      } else {
        const genUrl = _openBlob(blob);
        setTimeout(() => { try { URL.revokeObjectURL(genUrl); } catch { /* ignore */ } }, 60 * 1000);
      }
    } catch (err) {
      console.error("[report] fetch error:", err);
      alert("فشل تحميل الملف. تأكد أن السيرفر يرجع ملفاً وأن التوكن صالح.");
    } finally {
      setPdfLoading(false);
    }
  };

  const buildReportUrl = (path) => {
    const base = (API.BASE || "").replace(/\/+$/, "");
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${base}${path.startsWith("/") ? path : "/" + path}`;
  };

  const handleViewMinistryReport = async (ministryId, useDialog = true) => {
    if (!ministryId) return;
    const path = `/complaint/downloadMinistryReport/${ministryId}`;
    const url = buildReportUrl(path);
    await _fetchAndShowReport(url, `تقرير الوزارة ${ministryId}`, useDialog);
  };

  const handleViewBranchReport = async (branchId, useDialog = true) => {
    if (!branchId) return;
    const path = `/complaint/downloadBranchReport/${branchId}`;
    const url = buildReportUrl(path);
    await _fetchAndShowReport(url, `تقرير الفرع ${branchId}`, useDialog);
  };

  const closePdfDialog = () => {
    setShowPdfDialog(false);
    if (pdfUrl) {
      try { URL.revokeObjectURL(pdfUrl); } catch { /* ignore */ }
      setPdfUrl(null);
      setPdfTitle("");
    }
  };

  // ICON ONLY (no text) — stops propagation
  const ReportIcon = ({ onClick, title = "عرض التقرير", disabled = false, color = "#059669" }) => (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (!disabled && typeof onClick === "function") onClick(); }}
      aria-label={title}
      title={title}
      disabled={disabled}
      style={{
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 6,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: disabled ? "#9ca3af" : color,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 11h8M8 15h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );

  return (
    <div className="ministries-container">
      <h2 className="page-title">{t("ministries")}</h2>

      <div className="buttons-container">
        <button className="add-btn" onClick={() => setShowAddMinistry(true)}>{t("addMinistry")}</button>
        <button className="add-btn" onClick={() => setShowAddBranch(true)}>{t("addBranch")}</button>
      </div>

      {showAddMinistry && <AddMinistry onAdded={fetchMinistries} onClose={() => setShowAddMinistry(false)} />}

      {showAddBranch && <AddBranch ministryId={ministries[0]?.id} onAdded={fetchMinistries} onClose={() => setShowAddBranch(false)} />}

      <div className="ministries-cards">
        {ministries.length > 0 ? (
          ministries.map((min) => (
            <div
              className="ministry-card"
              key={min.id}
              title={min.description}
              onClick={() => setSelectedMinistry(min)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <h3 className="min-title">{min.name}</h3>
              <p className="abbreviation">{min.abbreviation}</p>
              <p className="description">{min.description || t("noDescription")}</p>
              <p className="branches-count">{t("branchesCount")}: {min.branches.length}</p>

              {/* delete ministry icon (stopPropagation so card doesn't open) */}
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteMinistry(min.id); }}
                  disabled={Boolean(deletingMinistryId)}
                  title="حذف الوزارة"
                  style={{
                    background: deletingMinistryId === min.id ? "#fee2e2" : "transparent",
                    border: "none",
                    cursor: deletingMinistryId ? "not-allowed" : "pointer",
                    color: "#dc2626",
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  {deletingMinistryId === min.id ? "جارٍ..." : "🗑️"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="loading">{t("loadingData")}...</p>
        )}
      </div>

      {/* Ministry details dialog */}
      {selectedMinistry && (
        <Dialog title={`${t("ministryDetails")} ${selectedMinistry.name}`} onClose={() => setSelectedMinistry(null)}>
          <p><strong>{t("abbreviation")}:</strong> {selectedMinistry.abbreviation}</p>
          <p><strong>{t("description")}:</strong> {selectedMinistry.description || t("noDescription")}</p>

          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <ReportIcon
              onClick={() => handleViewMinistryReport(selectedMinistry.id, true)}
              disabled={pdfLoading}
              title="عرض تقرير الوزارة"
              color="#0ea5e9"
            />
            <span style={{ marginLeft: 6, fontSize: 14, fontWeight: 600, color: "#0ea5e9" }}>
              عرض التقرير
            </span>

            {/* delete ministry button inside dialog */}
            <button
              onClick={async () => { await deleteMinistry(selectedMinistry.id); }}
              disabled={Boolean(deletingMinistryId)}
              style={{ marginLeft: "auto", background: "#fee2e2", border: "1px solid #fca5a5", padding: "8px 10px", borderRadius: 8, color: "#b91c1c" }}
            >
              {deletingMinistryId === selectedMinistry.id ? "جارٍ الحذف..." : "حذف الوزارة"}
            </button>
          </div>

          <h4 style={{ marginTop: 14 }}>{t("branchesCount")}:</h4>

          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {selectedMinistry.branches.length > 0 ? (
              selectedMinistry.branches.map((branch) => (
                <li key={branch.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                  <span>{branch.name} - {branch.governorate?.name || t("undefined")}</span>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                   <button
  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSelectedBranch(branch); }}
  style={{ cursor: "pointer", background: "none", border: "none", color: "#0ea5e9", fontSize: "18px" }}
  title={t("branchDetails")}
>
  👁️
</button>

                    <ReportIcon
                      onClick={() => handleViewBranchReport(branch.id, true)}
                      disabled={pdfLoading}
                      title="عرض تقرير الفرع"
                      color="#059669"
                    />

                    {/* delete branch button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteBranch(branch.id); }}
                      disabled={Boolean(deletingBranchId)}
                      title="حذف الفرع"
                      style={{
                        background: deletingBranchId === branch.id ? "#fee2e2" : "transparent",
                        border: "none",
                        cursor: deletingBranchId ? "not-allowed" : "pointer",
                        color: "#dc2626",
                        padding: 6,
                        borderRadius: 6,
                        fontSize: 16,
                      }}
                    >
                      {deletingBranchId === branch.id ? "جارٍ..." : "🗑️"}
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li>{t("noDescription")}</li>
            )}
          </ul>
        </Dialog>
      )}

      {/* Branch details dialog (opened when clicking eye on branch list) */}
      {selectedBranch && (
        <Dialog title={t("branchDetails")} onClose={() => setSelectedBranch(null)}>
          <p><strong>{t("branchNumber")}:</strong> {selectedBranch.id}</p>
          <p><strong>{t("governorate")}:</strong> {selectedBranch.governorate?.name || t("undefined")}</p>
          <p><strong>{t("branchManager")}:</strong> {selectedBranch.manager_id || t("undefined")}</p>
          <p><strong>{t("creationDate")}:</strong> {selectedBranch.created_at ? new Date(selectedBranch.created_at).toLocaleString() : "-"}</p>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={() => handleViewBranchReport(selectedBranch.id, true)} className="submit-btn">عرض تقرير الفرع</button>
            <button
              onClick={async () => { await deleteBranch(selectedBranch.id); }}
              disabled={Boolean(deletingBranchId)}
              className="cancel-btn"
            >
              {deletingBranchId === selectedBranch.id ? "جارٍ الحذف..." : "حذف الفرع"}
            </button>
          </div>
        </Dialog>
      )}

      {/* PDF Dialog */}
      {showPdfDialog && pdfUrl && (
        <Dialog title={pdfTitle || t("report")} onClose={closePdfDialog}>
          <div style={{ minWidth: 640, minHeight: 480 }}>
            <iframe title={pdfTitle || "report"} src={pdfUrl} style={{ width: "100%", height: "70vh", border: "none" }} />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="submit-btn" style={{ padding: "8px 12px" }}>
                فتح في تاب جديد
              </a>
              <button onClick={closePdfDialog} className="cancel-btn">إغلاق</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
