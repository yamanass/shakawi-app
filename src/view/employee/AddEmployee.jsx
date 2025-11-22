import React, { useState, useEffect } from "react";
import Crud from "../../services/Crud.js";

const crud = new Crud({
  baseURL: "http://127.0.0.1:8000/api",
  storageService: {
    getToken: () => localStorage.getItem("access_token"),
    getLang: () => localStorage.getItem("lang") || "ar",
  },
});

export default function AddEmployee({ onAdded = () => {}, onCancel = () => {} }) {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("employee");
  const [address, setAddress] = useState("");
  const [start_date, setStartDate] = useState("");
  const [ministry_id, setMinistryId] = useState("");
  const [ministry_branch_id, setBranchId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [ministries, setMinistries] = useState([]);
  const [branches, setBranches] = useState([]);
useEffect(() => {
let mounted = true;


(async () => {
try {
const res = await crud.get("/ministry/read");
const payload = res?.data ?? res?.raw?.data ?? null;
const items = Array.isArray(payload)
? payload
: (Array.isArray(payload?.data) ? payload.data : []);
if (mounted) setMinistries(items);
} catch (err) {
console.error("Failed to load ministries", err);
if (mounted) setMinistries([]);
}
})();


return () => { mounted = false; };
}, []);
 useEffect(() => {
let mounted = true;
(async () => {
if (!ministry_id) {
if (mounted) setBranches([]);
return;
}


try {
const res = await crud.get(`/ministry/readOne/${ministry_id}`);
const payload = res?.data ?? res?.raw?.data ?? null;
const ministryObj = payload?.data ?? payload ?? null;
const items = Array.isArray(ministryObj?.branches) ? ministryObj.branches : [];
if (mounted) setBranches(items);
} catch (err) {
console.warn("Failed to load branches for ministry", err);
if (mounted) setBranches([]);
}
})();


return () => { mounted = false; };
}, [ministry_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!first_name || !email || !phone) {
      setError("يرجى ملء الاسم والبريد والهاتف");
      setLoading(false);
      return;
    }

    const payload = {
      first_name,
      last_name,
      email,
      phone,
      role,
      address,
      start_date,
      ministry_id: ministry_id || null,
      ministry_branch_id: ministry_branch_id || null,
    };

    try {
      const res = await crud.post("/employee/store", payload);
      const status = res?.status ?? res?.raw?.status ?? null;
      const body = res?.data ?? res?.raw?.data ?? null;

      if (status === 200 || status === 201) {
        // حاول استخراج الموظف الجديد من الاستجابة (أشكال مختلفة محتملة)
        const newEmployee =
          body?.data?.employee ||
          body?.data ||
          body?.employee ||
          body;

        // نمرر الموظف الجديد للأب ليحدث الواجهة محلياً
        try {
          await onAdded(newEmployee);
        } catch (handlerErr) {
          console.warn("[AddEmployee] onAdded handler failed:", handlerErr);
        }

        // اغلق الديالوج
        try { onCancel(); } catch  {  console.warn("[AddEmployee] onAdded handler failed:");}
      } else {
        setError(body?.message || `Server returned ${status || "unknown status"}`);
      }
    } catch (err) {
      console.error("AddEmployee error:", err);
      setError(err?.response?.data?.message || err?.message || "خطأ أثناء الإرسال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="First name" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
        <input placeholder="Last name" value={last_name} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div style={{ display: "flex", gap: 8 }}>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>

        <input placeholder="Start date" type="date" value={start_date} onChange={(e) => setStartDate(e.target.value)} />
      </div>

      <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

      <div style={{ display: "flex", gap: 8 }}>
        <select value={ministry_id} onChange={(e) => setMinistryId(e.target.value)}>
          <option value="">اختر الوزارة</option>
          {ministries.map((m) => <option key={m.id} value={m.id}>{m.name || m.ministry_name}</option>)}
        </select>

       <select value={ministry_branch_id} onChange={(e) => setBranchId(e.target.value)} disabled={!branches || branches.length === 0}>
<option value="">اختر الفرع (اختياري)</option>
{branches.map((b) => <option key={b.id} value={b.id}>{b.name || b.title}</option>)}
</select>
</div>
     

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ padding: "8px 12px" }}>إلغاء</button>
        <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>{loading ? "جاري الإرسال..." : "إضافة الموظف"}</button>
      </div>
    </form>
  );
}
