// src/view/complaints/Complaints.jsx
import React, { useEffect, useState, useCallback } from "react";
import Crud from "../../services/Crud.js";
import Dialog from "../../components/common/Dialog.jsx";

const crud = new Crud({
  baseURL: "http://127.0.0.1:8000/api",
  storageService: {
    getToken: () => localStorage.getItem("access_token"),
    getLang: () => localStorage.getItem("lang") || "ar",
  },
});

export default function Complaints() {
  const [mediaDialog, setMediaDialog] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // helper: build public url for media paths returned by backend
  const getMediaUrl = (path) => {
    // crud.baseURL = http://127.0.0.1:8000/api -> want http://127.0.0.1:8000/{path}
    try {
      const base = crud.baseURL.replace(/\/api\/?$/, "");
      // backend sometimes returns paths starting with "storage/..." or "complaints/..." or with "storage/..." prefixed.
      const cleaned = String(path).replace(/^\/+/, "");
      return `${base}/${cleaned}`;
    } catch {
      return "/" + String(path).replace(/^\/+/, "");
    }
  };

  // format date helper (basic)
  const formatDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleString();
    } catch {
      return d;
    }
  };

  // detect media type by extension
  const detectMediaType = (url) => {
    const lower = String(url).toLowerCase();
    if (/(jpg|jpeg|png|gif|webp|bmp)$/.test(lower)) return "image";
    if (/(mp4|mov|webm|ogg|mkv|avi)$/.test(lower)) return "video";
    return "file";
  };

  // fetch ministries for filter dropdown
  const fetchMinistries = useCallback(async () => {
    try {
      const res = await crud.get("/ministry/read");
      const body = res?.data ?? res?.raw?.data ?? null;
      const items = body?.data ?? body ?? [];
      setMinistries(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("[Complaints] fetchMinistries error:", err);
      setMinistries([]);
    }
  }, []);

  // fetch branches for a ministry
  const fetchBranchesForMinistry = useCallback(async (ministryId) => {
    if (!ministryId) {
      setBranches([]);
      return;
    }
    try {
      const res = await crud.get(`/ministry/readOne/${ministryId}`);
      const body = res?.data ?? res?.raw?.data ?? null;
      const ministryObj = body?.data ?? body ?? null;
      setBranches(Array.isArray(ministryObj?.branches) ? ministryObj.branches : []);
    } catch (err) {
      console.error("[Complaints] fetchBranchesForMinistry error:", err);
      setBranches([]);
    }
  }, []);

  // fetch complaints (all / by ministry / by branch)
  const fetchComplaints = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (opts.branchId) {
        // route for branch complaints
        res = await crud.get(`/ministry/branch/${opts.branchId}/complaints`);
      } else if (opts.ministryId) {
        // route for ministry complaints
        res = await crud.get(`/ministry/${opts.ministryId}/complaints`);
      } else {
        // default: all complaints
        res = await crud.get(`/complaint`);
      }

      const body = res?.data ?? res?.raw?.data ?? null;
      const list = body?.data ?? (Array.isArray(body) ? body : []);
      setComplaints(Array.isArray(list) ? list : []);
      return list;
    } catch (err) {
      console.error("[fetchComplaints] error:", err);
      const msg = err?.response?.data?.message || err?.message || "فشل جلب الشكاوي";
      setError(msg);
      setComplaints([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // **************************
  // === IMPORTANT CHANGE ===
  // fetch single complaint details using route: /complaint/{id}
  // **************************
  const fetchComplaintById = useCallback(async (id) => {
    setLoading(true);
    try {
      // <-- changed to use the GET route you provided:
      const res = await crud.get(`/complaint/${id}`);
      const body = res?.data ?? res?.raw?.data ?? null;
      // server returns: { status, message, data: { ... } }
      const complaint = body?.data ?? body ?? null;
      setSelectedComplaint(complaint);
      // open dialog (we already set state)
      return complaint;
    } catch (err) {
      console.error("[fetchComplaintById] error:", err);
      alert("حدث خطأ أثناء جلب تفاصيل الشكوى");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // filters handlers
  const onChangeMinistry = (e) => {
    const id = e.target.value || "";
    setSelectedMinistry(id);
    setSelectedBranch("");
    if (id) {
      fetchBranchesForMinistry(id);
      fetchComplaints({ ministryId: id });
    } else {
      setBranches([]);
      fetchComplaints();
    }
  };

  const onChangeBranch = (e) => {
    const id = e.target.value || "";
    setSelectedBranch(id);
    if (id) fetchComplaints({ branchId: id });
    else if (selectedMinistry) fetchComplaints({ ministryId: selectedMinistry });
    else fetchComplaints();
  };

  const refreshComplaints = async () => {
    if (selectedBranch) return fetchComplaints({ branchId: selectedBranch });
    if (selectedMinistry) return fetchComplaints({ ministryId: selectedMinistry });
    return fetchComplaints();
  };

  useEffect(() => {
    fetchMinistries();
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to get reporter name
  const reporterName = (c) => {
    const info = c?.citizen?.basic_info ?? c?.reporter ?? null;
    if (!info) return "-";
    return `${info.first_name || info.name || ""} ${info.last_name || ""}`.trim() || "-";
  };

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#005c99" }}>الشكاوي</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await refreshComplaints();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{ padding: "8px 14px", borderRadius: 8, background: loading ? "#dbeefc" : "#e8f4ff" }}
          >
            {loading ? "جاري التحديث..." : "تحديث"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <select value={selectedMinistry} onChange={onChangeMinistry} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">جميع الوزارات</option>
          {ministries.map((m) => <option key={m.id} value={m.id}>{m.name || m.ministry_name}</option>)}
        </select>

        <select value={selectedBranch} disabled={!branches.length} onChange={onChangeBranch} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">كل الفروع</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name || b.title}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>عدد الشكاوى:</strong> {complaints.length}
      </div>

      {loading ? <div>جاري التحميل...</div> : error ? <div style={{ color: "red" }}>{error}</div> : complaints.length === 0 ? <div>لا توجد شكاوي حتى الآن.</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {complaints.map((c) => (
            <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #d1e7ff", boxShadow: "0 6px 18px rgba(0,123,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ maxWidth: "68%" }}>
                  <strong style={{ color: "#003d66", fontSize: 16 }}>{c.reference_number || `شكاية #${c.id}`}</strong>
                  <div style={{ marginTop: 8, color: "#374151", lineHeight: 1.4, maxHeight: 56, overflow: "hidden" }}>{c.description || "-"}</div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>المبلغ: {reporterName(c)}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ background: c.status === 'closed' ? '#eef7ee' : '#fff4e6', color: c.status === 'closed' ? '#0b7a3a' : '#b45f00', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                    {c.status || 'new'}
                  </div>

                  <button onClick={() => setMediaDialog(c)} style={{ marginTop: 8, background: "#e6f2ff", padding: "4px 8px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer" }}>
                    {Array.isArray(c.media) ? `${c.media.length} مرفق` : "-"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12, color: '#374151' }}>
                <div><strong style={{ color: '#005c99' }}>الجهة:</strong> {c.ministry_branch?.ministry_name || c.ministry_branch?.ministry_id ? c.ministry_branch?.ministry_name || `ID:${c.ministry_branch?.ministry_id}` : '-'}</div>
                <div><strong style={{ color: '#005c99' }}>الفرع:</strong> {c.ministry_branch?.name || '-'}</div>
                <div><strong style={{ color: '#005c99' }}>تاريخ الإنشاء:</strong> {formatDate(c.created_at)}</div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button onClick={() => fetchComplaintById(c.id)} style={{ padding: '6px 10px', borderRadius: 8 }}>عرض</button>
                <button style={{ padding: '6px 10px', borderRadius: 8 }}>تعليق</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* complaint details dialog (جميل ومنسق) */}
      {selectedComplaint && (
        <Dialog title={`الشكوى ${selectedComplaint.reference_number || `#${selectedComplaint.id}`}`} onClose={() => setSelectedComplaint(null)}>
          <div style={{ minWidth: 420, maxWidth: 760 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedComplaint.reference_number}</h3>
                <div style={{ marginTop: 6, color: "#6b7280" }}>{selectedComplaint.created_at ? formatDate(selectedComplaint.created_at) : "-"}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ background: selectedComplaint.status === 'closed' ? '#eef7ee' : '#fff4e6', color: selectedComplaint.status === 'closed' ? '#0b7a3a' : '#b45f00', padding: '6px 10px', borderRadius: 8 }}>
                  {selectedComplaint.status || '-'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 14, background: '#f8fbff', borderRadius: 10 }}>
              <strong>الوصف:</strong>
              <div style={{ marginTop: 8, color: "#374151", lineHeight: 1.6 }}>
                {selectedComplaint.description || "-"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eef6ff" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>المبلغ / المراسل</div>
                <div style={{ fontWeight: 600, marginTop: 6 }}>{selectedComplaint.citizen?.basic_info ? `${selectedComplaint.citizen.basic_info.first_name} ${selectedComplaint.citizen.basic_info.last_name}` : (selectedComplaint.reporter?.name || "-")}</div>
                <div style={{ marginTop: 6, color: "#6b7280" }}>{selectedComplaint.citizen?.basic_info?.email || selectedComplaint.reporter?.email || "-"}</div>
                <div style={{ color: "#6b7280" }}>{selectedComplaint.citizen?.basic_info?.phone || selectedComplaint.reporter?.phone || "-"}</div>
              </div>

              <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eef6ff" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>الجهة / الفرع</div>
                <div style={{ fontWeight: 600, marginTop: 6 }}>{selectedComplaint.ministry_branch?.ministry_name || "-"}</div>
                <div style={{ marginTop: 6 }}>{selectedComplaint.ministry_branch?.name || "-"}</div>
                <div style={{ color: "#6b7280", marginTop: 6 }}>{selectedComplaint.ministry_branch?.governorate?.name ? `محافظة: ${selectedComplaint.ministry_branch.governorate.name}` : ""}</div>
              </div>
            </div>

            {/* media list */}
            {Array.isArray(selectedComplaint.media) && selectedComplaint.media.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: "6px 0" }}>المرفقات ({selectedComplaint.media.length})</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  {selectedComplaint.media.map((m) => {
                    const url = getMediaUrl(m.path);
                    const type = detectMediaType(url);

                    return (
                      <div key={m.id} style={{ background: "#fff", padding: 8, borderRadius: 8, border: "1px solid #eef6ff" }}>
                        {type === "image" ? (
                          <img src={url} alt={m.path.split("/").pop()} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }} />
                        ) : type === "video" ? (
                          <video src={url} controls style={{ width: "100%", height: 120, borderRadius: 6, objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 13 }}>{m.path.split("/").pop()}</div>
                            <a href={url} target="_blank" rel="noreferrer" style={{ color: "#0b5ed7" }}>فتح / تحميل</a>
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{m.type || type}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* media dialog (عند الضغط على زر المرفقات في البطاقة) */}
      {mediaDialog && (
        <Dialog title="المرفقات" onClose={() => setMediaDialog(null)}>
          <div style={{ minWidth: 360 }}>
            {Array.isArray(mediaDialog.media) && mediaDialog.media.length > 0 ? (
              mediaDialog.media.map((m) => {
                const url = getMediaUrl(m.path);
                const type = detectMediaType(url);
                return (
                  <div key={m.id} style={{ marginBottom: 14 }}>
                    {type === "image" ? (
                      <img src={url} alt={m.path.split("/").pop()} style={{ width: "100%", borderRadius: 8, marginBottom: 6, border: "1px solid #e5eef9" }} />
                    ) : type === "video" ? (
                      <video src={url} controls style={{ width: "100%", borderRadius: 8, marginBottom: 6 }} />
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>{m.path.split("/").pop()}</div>
                        <a href={url} target="_blank" rel="noreferrer" style={{ color: "#0b5ed7" }}>فتح / تحميل</a>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{m.type || detectMediaType(m.path)}</div>
                  </div>
                );
              })
            ) : (
              <p>لا توجد مرفقات.</p>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
