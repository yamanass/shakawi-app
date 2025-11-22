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
  const [complaints, setComplaints] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // fetch ministries for filter dropdown
  const fetchMinistries = useCallback(async () => {
    try {
      const res = await crud.get("/ministry/read");
      const payload = res?.data ?? res?.raw?.data ?? null;
      let items = [];
      if (Array.isArray(payload)) items = payload;
      else if (payload && Array.isArray(payload.data)) items = payload.data;
      setMinistries(items);
    } catch (err) {
      console.error("[Complaints] fetchMinistries error:", err);
      setMinistries([]);
    }
  }, []);

  // fetch branches for a ministry using readOne route (backend returns data.branches)
  const fetchBranchesForMinistry = useCallback(async (ministryId) => {
    if (!ministryId) return setBranches([]);
    try {
      const res = await crud.get(`/ministry/readOne/${ministryId}`);
      const payload = res?.data ?? res?.raw?.data ?? null;
      const ministryObj = payload?.data ?? payload ?? null;
      setBranches(Array.isArray(ministryObj?.branches) ? ministryObj.branches : []);
    } catch (err) {
      console.error("[Complaints] fetchBranchesForMinistry error:", err);
      setBranches([]);
    }
  }, []);

  // fetch complaints (all, by ministry, or by branch)
  const fetchComplaints = useCallback(async (opts = {}) => {
    // opts: { ministryId, branchId }
    setLoading(true);
    setError(null);
    try {
      let res;
      if (opts.branchId) res = await crud.get(`/complaint/getByBranch/${opts.branchId}`);
      else if (opts.ministryId) res = await crud.get(`/complaint/getByMinistry/${opts.ministryId}`);
      else res = await crud.get(`/complaint/read`);

      const payload = res?.data ?? res?.raw?.data ?? null;
      let list = [];

      if (Array.isArray(payload)) list = payload;
      else if (payload && Array.isArray(payload.data)) list = payload.data;
      else if (payload && Array.isArray(payload.complaints)) list = payload.complaints;
      else if (payload?.data && Array.isArray(payload.data.complaints)) list = payload.data.complaints;

      setComplaints(list);
      return list;
    } catch (err) {
      console.error("[Complaints] fetchComplaints error:", err);
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
      const res = await crud.get(`/complaint/readOne/${id}`);
      const payload = res?.data ?? res?.raw?.data ?? null;
      const complaint = payload?.data ?? payload ?? null;
      setSelectedComplaint(complaint);
      return complaint;
    } catch (err) {
      console.error("[Complaints] fetchComplaintById error:", err);
      alert("حدث خطأ أثناء جلب تفاصيل الشكوى");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // handlers for filters
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

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#005c99" }}>الشكاوي</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={refreshComplaints} style={{ padding: "8px 14px", borderRadius: 8, background: "#e8f4ff" }}>تحديث</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <select value={selectedMinistry} onChange={onChangeMinistry} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">جميع الوزارات</option>
          {ministries.map((m) => (
            <option key={m.id} value={m.id}>{m.name || m.ministry_name}</option>
          ))}
        </select>

        <select value={selectedBranch} disabled={!branches.length} onChange={onChangeBranch} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">كل الفروع</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name || b.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>جاري التحميل...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : complaints.length === 0 ? (
        <div>لا توجد شكاوي حتى الآن.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {complaints.map((c) => (
            <div key={c.id} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #d1e7ff", boxShadow: "0 6px 18px rgba(0,123,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ maxWidth: "70%" }}>
                  <strong style={{ color: "#003d66", fontSize: 16 }}>{c.title || c.subject || `شكاية #${c.id}`}</strong>
                  <div style={{ marginTop: 8, color: "#374151", lineHeight: 1.5 }}>
                    <div><strong style={{ color: "#005c99" }}>المبلغ:</strong> {c.reporter?.name || c.reporter_name || "-"}</div>
                    <div><strong style={{ color: "#005c99" }}>تاريخ الإنشاء:</strong> {c.created_at || c.createdAt || "-"}</div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ background: c.status === 'closed' ? '#eef7ee' : '#fff4e6', color: c.status === 'closed' ? '#0b7a3a' : '#b45f00', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                    {c.status || c.state || 'new'}
                  </div>
                  <div style={{ marginTop: 8, background: '#e6f2ff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>{c.priority || c.severity || 'normal'}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, color: '#374151' }}>
                <div><strong style={{ color: '#005c99' }}>الجهة:</strong> {c.ministry?.name || c.ministry_name || '-'}</div>
                <div><strong style={{ color: '#005c99' }}>الفرع:</strong> {c.branch?.name || c.branch_name || '-'}</div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button onClick={() => fetchComplaintById(c.id)} style={{ padding: '6px 10px', borderRadius: 8 }}>عرض</button>
                <button style={{ padding: '6px 10px', borderRadius: 8 }}>تعليق</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedComplaint && (
        <Dialog title={`الشكوى #${selectedComplaint.id}`} onClose={() => setSelectedComplaint(null)}>
          <div style={{ minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>{selectedComplaint.title || selectedComplaint.subject}</h3>
            <p><strong>المبلغ:</strong> {selectedComplaint.reporter?.name || selectedComplaint.reporter_name || '-'}</p>
            <p><strong>البريد:</strong> {selectedComplaint.reporter?.email || selectedComplaint.reporter_email || '-'}</p>
            <p><strong>الهاتف:</strong> {selectedComplaint.reporter?.phone || selectedComplaint.reporter_phone || '-'}</p>
            <p><strong>الجهة:</strong> {selectedComplaint.ministry?.name || selectedComplaint.ministry_name || '-'}</p>
            <p><strong>الفرع:</strong> {selectedComplaint.branch?.name || selectedComplaint.branch_name || '-'}</p>
            <p><strong>الأولوية:</strong> {selectedComplaint.priority || selectedComplaint.severity || '-'}</p>
            <div style={{ marginTop: 10, padding: 12, background: '#f8fbff', borderRadius: 8 }}>{selectedComplaint.message || selectedComplaint.body || selectedComplaint.description || '-'}</div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
