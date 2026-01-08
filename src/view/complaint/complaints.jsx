// src/view/complaints/Complaints.jsx
import React, { useEffect, useState, useCallback } from "react";
import Crud from "../../services/Crud.js";
import Dialog from "../../components/common/Dialog.jsx";
import complaintData from "../../data/complaintData.jsx"; // data-layer (افتراضي موجود)

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

  // reply dialog state (NEW: separate dialog)
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyFiles, setReplyFiles] = useState([]); // File[]
  const [replyLoading, setReplyLoading] = useState(false);

  // processing / status states (existing)
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [replies, setReplies] = useState([]); // الردود الخاصة بالشكوى المعروضة
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState(null);

  // deleting state for replies (per-reply)
  const [deletingReplies, setDeletingReplies] = useState({}); // { [replyId]: true }

  // show more replies toggle
  const [showAllRepliesExpanded, setShowAllRepliesExpanded] = useState(false);

  // -------------------------
  // helpers: current user info
  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) return JSON.parse(raw);
    } catch {/**/}
    return {
      id: localStorage.getItem("user_id") || localStorage.getItem("id") || null,
      role: localStorage.getItem("role") || null,
      email: localStorage.getItem("user_email") || null,
    };
  };
  const getCurrentUserRole = () => ((getCurrentUser() || {}).role || "").toString();
  const getCurrentUserId = () => (getCurrentUser() || {}).id || null;
  const isEmployee = () => {
    const r = (getCurrentUserRole() || "").toLowerCase();
    return r === "employee" || r === "staff" || r === "موظف";
  };

  // helper: determine if current user may delete a reply
  const canDeleteReply = (r) => {
    if (!r) return false;
    const uid = String(getCurrentUserId() || "");
    const possibleSenderIds = [
      r.sender_id,
      r.sender?.id,
      r.user_id,
      r.sender_user_id,
      r.sender_id // repeated to be safe
    ].map((x) => (x === undefined || x === null ? "" : String(x)));
    if (isEmployee()) return true;
    if (uid && possibleSenderIds.includes(uid)) return true;
    return false;
  };

  const loadReplies = async (complaintId) => {
    if (!complaintId) {
      setReplies([]);
      return;
    }
    setRepliesLoading(true);
    setRepliesError(null);
    try {
      const list = await complaintData.getReplies(complaintId);
      // backend عادة يرجع array في data
      setReplies(Array.isArray(list) ? list : []);
      // reset "عرض المزيد" عند تحميل ردود جديدة
      setShowAllRepliesExpanded(false);
    } catch (err) {
      console.error("[loadReplies] error:", err);
      setRepliesError(err?.message || "فشل تحميل الردود");
      setReplies([]);
    } finally {
      setRepliesLoading(false);
    }
  };

  // Delete reply handler
  const deleteReplyById = async (replyId) => {
    if (!replyId) return;
    const replyObj = replies.find((r) => String(r.id) === String(replyId));
    if (!canDeleteReply(replyObj)) {
      alert("غير مسموح بحذف هذا الرد.");
      return;
    }
    if (!window.confirm("هل تريد حذف هذا الرد؟ لا يمكن التراجع عن العملية.")) return;

    setDeletingReplies((prev) => ({ ...prev, [replyId]: true }));
    try {
      const resp = await complaintData.deleteReply(replyId);
      // إذا الاستجابة ناجحة نحذف الرد من الحالة محلياً
      setReplies((prev) => prev.filter((r) => String(r.id) !== String(replyId)));
      // تحديث الشكاوي العامة (اختياري)
      try {
        await fetchComplaints(
          selectedBranch
            ? { branchId: selectedBranch }
            : selectedMinistry
            ? { ministryId: selectedMinistry }
            : {}
        );
      } catch  { /**/ }
      // لو عروض التفاصيل بحاجة تحديث:
      if (selectedComplaint?.id) {
        try { await fetchComplaintById(selectedComplaint.id); } catch { /**/ }
      }
      alert("تم حذف الرد بنجاح.");
      return resp;
    } catch (err) {
      console.error("[deleteReplyById] error:", err);
      const msg = err?.response?.data?.message || err?.message || "فشل حذف الرد";
      alert(msg);
      throw err;
    } finally {
      setDeletingReplies((prev) => {
        const copy = { ...prev };
        delete copy[replyId];
        return copy;
      });
    }
  };

  // media / formatting helpers (unchanged)
  const getMediaUrl = (path) => {
    try {
      const base = crud.baseURL.replace(/\/api\/?$/, "");
      const cleaned = String(path).replace(/^\/+/, "");
      return `${base}/${cleaned}`;
    } catch {
      return "/" + String(path).replace(/^\/+/, "");
    }
  };

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

  const detectMediaType = (url) => {
    const lower = String(url).toLowerCase();
    if (/(jpg|jpeg|png|gif|webp|bmp)$/.test(lower)) return "image";
    if (/(mp4|mov|webm|ogg|mkv|avi)$/.test(lower)) return "video";
    return "file";
  };

  // -------------------------
  // fetch ministries / branches / complaints (same as عندك)
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

  const fetchComplaints = useCallback(async (opts = {}) => {
  setLoading(true);
  setError(null);
  try {
    let res;
    if (opts.branchId || opts.branch_id) {
      const b = opts.branchId || opts.branch_id;
      res = await crud.get(`/ministry/branch/${b}/complaints`);
    } else if (opts.ministryId || opts.ministry_id) {
      const m = opts.ministryId || opts.ministry_id;
      res = await crud.get(`/ministry/${m}/complaints`);
    } else {
      res = await crud.get(`/complaint`);
    }

    const body = res?.data ?? res?.raw?.data ?? null;

    // اكثر مرونة في استخراج القائمة
    let list = [];
    if (Array.isArray(body)) list = body;
    else if (Array.isArray(body?.data)) list = body.data;
    else if (Array.isArray(body?.complaints)) list = body.complaints;
    else if (Array.isArray(body?.data?.complaints)) list = body.data.complaints;
    else list = [];

    setComplaints(list);
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

  const fetchComplaintById = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await crud.get(`/complaint/${id}`);
      const body = response?.data ?? response?.raw?.data ?? null;
      const complaint = body?.data ?? body ?? null;
      setSelectedComplaint(complaint);

      // جلب الردود فوراً بعد فتح تفاصيل الشكوى
      try {
        await loadReplies(complaint?.id);
      } catch (e) {
        console.warn("[fetchComplaintById] loadReplies failed", e);
      }

      return complaint;
    } catch (err) {
      console.error("[fetchComplaintById] error:", err);
      alert("حدث خطأ أثناء جلب تفاصيل الشكوى");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // update status (unchanged)
  const updateComplaintStatus = async (id, status, reason = "") => {
  const allowed = ["resolved", "rejected"];
  if (!allowed.includes(status)) {
    alert("الحالة المسموح بها فقط: resolved أو rejected");
    return;
  }
  if (status === "rejected" && (!reason || !reason.trim())) {
    alert("سبب الرفض مطلوب عند اختيار 'رفض'.");
    return;
  }

  setStatusUpdating(true);
  try {
    const payload = status === "rejected" ? { status, reason } : { status };
    const response = await crud.post(`/complaint/updateStatus/${id}`, payload);
    console.log("[updateComplaintStatus] response:", response);

    // 1) حدّث selectedComplaint
    setSelectedComplaint((prev) => (prev ? { ...prev, status } : prev));

    // 2) تحديث فوري للقائمة محلياً (optimistic update)
    setComplaints((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, status } : c)));

    // 3) ثم مزامنة نهائية مع السيرفر (اختياري but safe)
    try {
      await fetchComplaints(
        selectedBranch
          ? { branchId: selectedBranch }
          : selectedMinistry
          ? { ministryId: selectedMinistry }
          : {}
      );
    } catch (e) {
      console.warn("[updateComplaintStatus] fetchComplaints sync failed", e);
    }

    alert("تم تحديث حالة الشكوى بنجاح.");
    setShowRejectReason(false);
    setStatusReason("");
  } catch (err) {
    console.error("[updateComplaintStatus] error:", err);
    const msg = err?.response?.data?.message || err?.message || "فشل تحديث الحالة";
    alert(msg);
  } finally {
    setStatusUpdating(false);
  }
};


  // -------------------------
  // useEffect: load ministries + limit for employee (same approach as سابقاً)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await fetchMinistries();

        if (!mounted) return;

        if (isEmployee()) {
          const storedBranchId = localStorage.getItem("ministry_branch_id") || localStorage.getItem("ministryBranchId") || null;
          const storedMinistryId = localStorage.getItem("ministry_id") || localStorage.getItem("ministryId") || null;

          if (storedBranchId) {
            setSelectedBranch(String(storedBranchId));
            if (storedMinistryId) {
              setSelectedMinistry(String(storedMinistryId));
              fetchBranchesForMinistry(storedMinistryId);
            }
            await fetchComplaints({ branchId: storedBranchId });
            return;
          }

          // fallback: attempt to discover employee record (kept minimal here)
          setLoading(true);
          try {
            const user = getCurrentUser() || {};
            const userId = user?.id || null;
            if (!userId) {
              await fetchComplaints();
              return;
            }
            // try common endpoints
            let emp = null;
            try {
              const r = await crud.get(`/employee/readOne/${userId}`);
              const p = r?.data ?? r?.raw?.data ?? null;
              emp = p?.data ?? p ?? null;
            } catch {/**/ }
            if (!emp) {
              try {
                const r2 = await crud.get(`/employee/getByUser/${userId}`);
                const p2 = r2?.data ?? r2?.raw?.data ?? null;
                emp = p2?.data ?? p2 ?? null;
              } catch {/**/}
            }
            if (!emp) {
              try {
                const r3 = await crud.get(`/employee/read`);
                const p3 = r3?.data ?? r3?.raw?.data ?? null;
                let list = [];
                if (Array.isArray(p3)) list = p3;
                else if (Array.isArray(p3?.data)) list = p3.data;
                else if (Array.isArray(p3?.employees)) list = p3.employees;
                else if (Array.isArray(p3?.data?.employees)) list = p3.data.employees;
                const found = list.find((e) => {
                  const uid = String(e?.user?.id || e?.user_id || e?.id || "");
                  const eml = String(e?.user?.email || "");
                  if (uid && String(uid) === String(userId)) return true;
                  if (user?.email && eml && String(eml).toLowerCase() === String(user.email).toLowerCase()) return true;
                  return false;
                });
                emp = found || null;
              } catch {/**/}
            }

            const branchId =
              emp?.ministry_branch?.id ||
              emp?.ministry_branch_id ||
              emp?.branch_id ||
              emp?.ministry_branch?.branch_id ||
              emp?.ministry_branch_id ||
              null;

            const ministryId =
              emp?.ministry_branch?.ministry_id ||
              emp?.ministry_id ||
              emp?.ministry?.id ||
              (emp?.ministry_branch?.ministry ? emp.ministry_branch.ministry.id : null) ||
              null;

            if (branchId) {
              setSelectedBranch(String(branchId));
              if (ministryId) {
                setSelectedMinistry(String(ministryId));
                fetchBranchesForMinistry(ministryId);
              }
              await fetchComplaints({ branchId });
            } else if (ministryId) {
              setSelectedMinistry(String(ministryId));
              fetchBranchesForMinistry(ministryId);
              await fetchComplaints({ ministryId });
            } else {
              await fetchComplaints();
            }
          } finally {
            setLoading(false);
          }
        } else {
          await fetchComplaints();
        }
      } catch (err) {
        console.error("[Complaints useEffect] error:", err);
        setLoading(false);
        await fetchComplaints();
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========= NEW useEffect: sync cards when selected complaint status changes =========
  useEffect(() => {
    if (!selectedComplaint?.id) return;
    (async () => {
      try {
        await fetchComplaints(
          selectedBranch
            ? { branchId: selectedBranch }
            : selectedMinistry
            ? { ministryId: selectedMinistry }
            : {}
        );
      } catch (e) {
        console.warn("[sync] fetchComplaints after selectedComplaint.status change failed", e);
      }
    })();
    // watch status change and branch/ministry so the cards reflect current filter
  }, [selectedComplaint?.status, selectedBranch, selectedMinistry]);
  // =============================================================================

  // helper to get reporter name
  const reporterName = (c) => {
    const info = c?.citizen?.basic_info ?? c?.reporter ?? null;
    if (!info) return "-";
    return `${info.first_name || info.name || ""} ${info.last_name || ""}`.trim() || "-";
  };

  // when to show Reply button on the card: only accepted/resolved OR rejected
 const complaintAllowsReply = (status) => {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  // Accept common variants for "in progress"
  return s === "in_progress" || s === "inprogress" || s === "in-progress";
};

  // open reply dialog for a specific complaint (separate dialog)
  const openReplyDialogFor = async (complaint) => {
    // لو الكارد لم يتم تحميل تفاصيله بعد، خزّن الكائن مؤقتاً ثم جلب التفاصيل
    setSelectedComplaint(complaint);
    setReplyContent("");
    setReplyFiles([]);

    // جلب الردود فوراً (لا يعيق الواجهة إذا فشل)
    try {
      await loadReplies(complaint?.id);
    } catch (e) {
      console.warn("[openReplyDialogFor] loadReplies failed", e);
    }

    setShowReplyDialog(true);
  };

  const onReplyFilesChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setReplyFiles(files);
  };

  const sendReply = async () => {
    if (!selectedComplaint?.id) {
      alert("لا توجد شكوى محددة للإرسال.");
      return;
    }
    if ((!replyContent || !replyContent.trim()) && replyFiles.length === 0) {
      alert("الرجاء كتابة نص الرد أو إرفاق ملف.");
      return;
    }

    setReplyLoading(true);
    try {
      // call data-layer function (تأكد أن addReply يدعم إرسال ملفات عبر FormData)
      const resp = await complaintData.addReply(selectedComplaint.id, replyContent.trim(), replyFiles || []);
      console.log("[addReply] response:", resp);
      alert("تم إرسال الرد بنجاح.");
      setShowReplyDialog(false);
      setReplyContent("");
      setReplyFiles([]);
      // تحديث التفاصيل والقائمة
      await fetchComplaintById(selectedComplaint.id);
      await fetchComplaints(selectedBranch ? { branchId: selectedBranch } : (selectedMinistry ? { ministryId: selectedMinistry } : {}));
    } catch (err) {
      console.error("[addReply] error:", err);
      const msg = err?.message || err?.response?.data?.message || "فشل إرسال الرد";
      alert(msg);
    } finally {
      setReplyLoading(false);
    }
  };

  // determine if existing processing actions should appear (unchanged)
  const canShowActions = () => {
    if (!selectedComplaint) return false;
    if (!isEmployee()) return false;
    const s = (selectedComplaint.status || "").toString().toLowerCase();
    if (s === "resolved" || s === "rejected" || s === "closed") return false;
    return true;
  };

  // ---------- Render ----------
  // prepare replies ordering: latest first
  const sortedReplies = Array.isArray(replies)
    ? [...replies].sort((a, b) => {
        const da = a?.created_at ? new Date(a.created_at) : new Date(0);
        const db = b?.created_at ? new Date(b.created_at) : new Date(0);
        return db - da; // latest first
      })
    : [];

  const latestReply = sortedReplies.length > 0 ? sortedReplies[0] : null;
  const otherReplies = sortedReplies.slice(1);

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#005c99" }}>الشكاوي</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                if (selectedBranch) return await fetchComplaints({ branchId: selectedBranch });
                if (selectedMinistry) return await fetchComplaints({ ministryId: selectedMinistry });
                return await fetchComplaints();
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
        <select value={selectedMinistry} onChange={(e) => {
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
        }} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">جميع الوزارات</option>
          {ministries.map((m) => <option key={m.id} value={m.id}>{m.name || m.ministry_name}</option>)}
        </select>

        <select value={selectedBranch} disabled={!branches.length} onChange={(e) => {
          const id = e.target.value || "";
          setSelectedBranch(id);
          if (id) fetchComplaints({ branchId: id });
          else if (selectedMinistry) fetchComplaints({ ministryId: selectedMinistry });
          else fetchComplaints();
        }} style={{ padding: "8px 10px", borderRadius: 8 }}>
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

                {/* Reply button: show only when complaintAllowsReply */}
                {complaintAllowsReply(c.status) ? (
                  <button
                    onClick={() => openReplyDialogFor(c)}
                    style={{ padding: '6px 10px', borderRadius: 8 }}
                  >
                    رد
                  </button>
                ) : (
                  <button style={{ padding: '6px 10px', borderRadius: 8, opacity: 0.6 }} disabled>
                    تعليق
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* complaint details dialog (with modified replies view and media open buttons) */}
      {selectedComplaint && (
        <Dialog title={`الشكوى ${selectedComplaint.reference_number || `#${selectedComplaint.id}`}`} onClose={() => { setSelectedComplaint(null); setShowReplyDialog(false); }}>
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

            {/* actions area (start processing / resolve / reject) */}
            <div style={{ marginTop: 16 }}>
              {canShowActions() && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {String(selectedComplaint.status || "").toLowerCase() === "new" && isEmployee() && (
                    <button
                      onClick={async () => {
                        if (!selectedComplaint?.id) return;
                        const userId = getCurrentUserId();
                        if (!userId) {
                          alert("لا يوجد معرف الموظف.");
                          return;
                        }
                        if (!isEmployee()) {
                          alert("غير مسموح.");
                          return;
                        }

                       setStatusUpdating(true);
try {
  const response = await complaintData.startProcessingComplaint(selectedComplaint.id);
  console.log("[startProcessing] response:", response);

  // حدّث الـ dialog و الـ list محلياً
  setSelectedComplaint((prev) => (prev ? { ...prev, status: "in_progress" } : prev));
  setComplaints((prev) => prev.map((c) => (String(c.id) === String(selectedComplaint.id) ? { ...c, status: "in_progress" } : c)));

  // مزامنة مع السيرفر
  try {
    await fetchComplaints(selectedBranch ? { branchId: selectedBranch } : (selectedMinistry ? { ministryId: selectedMinistry } : {}));
  } catch (e) { console.warn("[startProcessing] sync failed", e); }

  alert("تم بدء المعالجة.");
} catch (err) {
  console.error("[startProcessing] error:", err);
  const msg = err?.message || err?.response?.data?.message || "فشل بدء المعالجة";
  alert(msg);
} finally {
  setStatusUpdating(false);
}
                      }}
                      disabled={statusUpdating}
                      style={{ padding: "8px 12px", borderRadius: 8, background: "#eef6ff", border: "1px solid #2b7ed3" }}
                    >
                      {statusUpdating ? "جاري..." : "بدء المعالجة"}
                    </button>
                  )}

                  {String(selectedComplaint.status || "").toLowerCase() === "in_progress" && isEmployee() && (
                    <>
                      <button
                        onClick={async () => {
                          if (!selectedComplaint?.id) return;
                          if (!window.confirm("تأكيد: هل تريد إنهاء الشكوى (resolved)؟")) return;
                          await updateComplaintStatus(selectedComplaint.id, "resolved");
                        }}
                        disabled={statusUpdating}
                        style={{ padding: "8px 12px", borderRadius: 8, background: "#e6ffef", border: "1px solid #12a05b" }}
                      >
                        {statusUpdating ? "جاري..." : "إنهاء (Resolved)"}
                      </button>

                      <div>
                        {!showRejectReason ? (
                          <button
                            onClick={() => setShowRejectReason(true)}
                            style={{ padding: "8px 12px", borderRadius: 8, background: "#fff5f5", border: "1px solid #d43d3d" }}
                            disabled={statusUpdating}
                          >
                            رفض
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              value={statusReason}
                              onChange={(e) => setStatusReason(e.target.value)}
                              placeholder="أدخل سبب الرفض (مطلوب)"
                              style={{ padding: 8, borderRadius: 8, border: "1px solid #e4e7eb", minWidth: 300 }}
                            />
                            <button
                              onClick={async () => {
                                if (!statusReason || !statusReason.trim()) { alert("الرجاء كتابة سبب الرفض."); return; }
                                await updateComplaintStatus(selectedComplaint.id, "rejected", statusReason.trim());
                              }}
                              disabled={statusUpdating}
                              style={{ padding: "8px 12px", borderRadius: 8, background: "#fff5f5", border: "1px solid #d43d3d" }}
                            >
                              {statusUpdating ? "جارٍ إرسال..." : "تأكيد الرفض"}
                            </button>

                            <button
                              onClick={() => { setShowRejectReason(false); setStatusReason(""); }}
                              disabled={statusUpdating}
                              style={{ padding: "8px 12px", borderRadius: 8, background: "#f3f4f6" }}
                            >
                              إلغاء
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Note: reply UI moved to separate Dialog (triggered by card button or other) */}
            </div>

            {/* ----- Replies section (أضف هذا قبل media list) ----- */}
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "6px 0" }}>الردود ({replies.length})</h4>

              {repliesLoading ? (
                <div>جاري تحميل الردود...</div>
              ) : repliesError ? (
                <div style={{ color: "red" }}>{repliesError}</div>
              ) : replies.length === 0 ? (
                <div style={{ color: "#6b7280" }}>لا توجد ردود بعد.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* show latest reply first */}
                  {latestReply && (
                    <div key={latestReply.id} style={{ background: "#fff", padding: 10, borderRadius: 8, border: "1px solid #eef6ff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 600 }}>{latestReply.sender || latestReply.sender_type || "غير معروف"}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{latestReply.created_at ? formatDate(latestReply.created_at) : ""}</div>

                          {/* زر الحذف: يظهر للموظف أو صاحب الرد */}
                          {canDeleteReply(latestReply) && (
                            <button
                              onClick={() => deleteReplyById(latestReply.id)}
                              disabled={Boolean(deletingReplies[latestReply.id])}
                              style={{
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: "1px solid #f3c0c0",
                                background: deletingReplies[latestReply.id] ? "#fbeaea" : "#fff5f5",
                                cursor: "pointer",
                                fontSize: 12,
                                color: "#d14343"
                              }}
                            >
                              {deletingReplies[latestReply.id] ? "جاري الحذف..." : "حذف"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 8, color: "#374151" }}>{latestReply.content || "-"}</div>

                      {Array.isArray(latestReply.media) && latestReply.media.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {latestReply.media.map((m) => {
                            const url = getMediaUrl(m.path || m.file || "");
                            const type = detectMediaType(url);
                            return (
                              <div key={m.id} style={{ width: 140, background: "#fafafa", padding: 8, borderRadius: 8, border: "1px solid #eef6ff", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                <div style={{ fontSize: 22 }}>{type === "image" ? "🖼️" : type === "video" ? "🎬" : "📎"}</div>
                                <div style={{ fontSize: 12, textAlign: "center", wordBreak: "break-all" }}>{(m.path || m.file || "").split("/").pop()}</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    onClick={() => window.open(url, "_blank", "noopener")}
                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #dbeafe", background: "#e8f4ff", cursor: "pointer", fontSize: 12 }}
                                  >
                                    فتح
                                  </button>
                                  <a href={url} target="_blank" rel="noreferrer" style={{ alignSelf: "center", fontSize: 12, color: "#0b5ed7" }}>روابط</a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* collapsed other replies */}
                  {otherReplies.length > 0 && !showAllRepliesExpanded && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        onClick={() => setShowAllRepliesExpanded(true)}
                        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #dbeafe", background: "#e8f4ff", cursor: "pointer" }}
                      >
                        عرض المزيد ({otherReplies.length})
                      </button>
                    </div>
                  )}

                  {/* expanded other replies */}
                  {showAllRepliesExpanded && otherReplies.map((r) => (
                    <div key={r.id} style={{ background: "#fff", padding: 10, borderRadius: 8, border: "1px solid #eef6ff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 600 }}>{r.sender || r.sender_type || "غير معروف"}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{r.created_at ? formatDate(r.created_at) : ""}</div>

                          {/* زر الحذف: يظهر للموظف أو صاحب الرد */}
                          {canDeleteReply(r) && (
                            <button
                              onClick={() => deleteReplyById(r.id)}
                              disabled={Boolean(deletingReplies[r.id])}
                              style={{
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: "1px solid #f3c0c0",
                                background: deletingReplies[r.id] ? "#fbeaea" : "#fff5f5",
                                cursor: "pointer",
                                fontSize: 12,
                                color: "#d14343"
                              }}
                            >
                              {deletingReplies[r.id] ? "جاري الحذف..." : "حذف"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 8, color: "#374151" }}>{r.content || "-"}</div>

                      {Array.isArray(r.media) && r.media.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {r.media.map((m) => {
                            const url = getMediaUrl(m.path || m.file || "");
                            const type = detectMediaType(url);
                            return (
                              <div key={m.id} style={{ width: 140, background: "#fafafa", padding: 8, borderRadius: 8, border: "1px solid #eef6ff", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                <div style={{ fontSize: 22 }}>{type === "image" ? "🖼️" : type === "video" ? "🎬" : "📎"}</div>
                                <div style={{ fontSize: 12, textAlign: "center", wordBreak: "break-all" }}>{(m.path || m.file || "").split("/").pop()}</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    onClick={() => window.open(url, "_blank", "noopener")}
                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #dbeafe", background: "#e8f4ff", cursor: "pointer", fontSize: 12 }}
                                  >
                                    فتح
                                  </button>
                                  <a href={url} target="_blank" rel="noreferrer" style={{ alignSelf: "center", fontSize: 12, color: "#0b5ed7" }}>روابط</a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* ----- end replies section ----- */}

            {/* media list for complaint: do not display images inline, show open button */}
            {Array.isArray(selectedComplaint.media) && selectedComplaint.media.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: "6px 0" }}>المرفقات ({selectedComplaint.media.length})</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  {selectedComplaint.media.map((m) => {
                    const url = getMediaUrl(m.path);
                    const type = detectMediaType(url);

                    return (
                      <div key={m.id} style={{ background: "#fff", padding: 8, borderRadius: 8, border: "1px solid #eef6ff", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 26 }}>{type === "image" ? "🖼️" : type === "video" ? "🎬" : "📎"}</div>
                        <div style={{ fontSize: 13, textAlign: "center", wordBreak: "break-all" }}>{(m.path || "").split("/").pop()}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => window.open(url, "_blank", "noopener")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #dbeafe", background: "#e8f4ff", cursor: "pointer" }}>
                            فتح
                          </button>
                          <a href={url} target="_blank" rel="noreferrer" style={{ alignSelf: "center", fontSize: 13, color: "#0b5ed7" }}>فتح في تاب</a>
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{m.type || type}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* media dialog (unchanged content but do not inline images; show open buttons) */}
      {mediaDialog && (
        <Dialog title="المرفقات" onClose={() => setMediaDialog(null)}>
          <div style={{ minWidth: 360 }}>
            {Array.isArray(mediaDialog.media) && mediaDialog.media.length > 0 ? (
              mediaDialog.media.map((m) => {
                const url = getMediaUrl(m.path);
                const type = detectMediaType(url);
                return (
                  <div key={m.id} style={{ marginBottom: 14, background: "#fff", padding: 10, borderRadius: 8, border: "1px solid #eef6ff" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ fontSize: 26 }}>{type === "image" ? "🖼️" : type === "video" ? "🎬" : "📎"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14 }}>{m.path.split("/").pop()}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{m.type || type}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => window.open(url, "_blank", "noopener")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #dbeafe", background: "#e8f4ff", cursor: "pointer" }}>
                          فتح
                        </button>
                        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#0b5ed7", alignSelf: "center" }}>فتح في تاب</a>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>لا توجد مرفقات.</p>
            )}
          </div>
        </Dialog>
      )}

      {/* ---------- REPLY Dialog (NEW, منفصل) ---------- */}
      {showReplyDialog && selectedComplaint && (
        <Dialog title={`رد على الشكوى ${selectedComplaint.reference_number || `#${selectedComplaint.id}`}`} onClose={() => { setShowReplyDialog(false); setReplyContent(""); setReplyFiles([]); }}>
          <div style={{ minWidth: 420, maxWidth: 720, display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              placeholder="نص الرد (مطلوب إلا إذا أرفقت ملف)"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={5}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #e4e7eb", width: "100%" }}
            />

            <div>
              <input type="file" multiple onChange={onReplyFilesChange} />
              {replyFiles && replyFiles.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {replyFiles.map((f, idx) => <div key={idx} style={{ fontSize: 13 }}>{f.name}</div>)}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button
                onClick={() => { setShowReplyDialog(false); setReplyContent(""); setReplyFiles([]); }}
                disabled={replyLoading}
                style={{ padding: "8px 12px", borderRadius: 8, background: "#f3f4f6" }}
              >
                إلغاء
              </button>

              <button
                onClick={sendReply}
                disabled={replyLoading}
                style={{ padding: "8px 12px", borderRadius: 8, background: "#e6ffef", border: "1px solid #12a05b" }}
              >
                {replyLoading ? "جاري الإرسال..." : "إرسال الرد"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
