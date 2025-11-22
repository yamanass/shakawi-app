// Improved Employees.jsx UI with better styling
// Note: Replace your existing file with this version.

import React, { useEffect, useState, useCallback } from "react";
import Crud from "../../services/Crud.js";
import AddEmployee from "./AddEmployee";
import Dialog from "../../components/common/Dialog.jsx";

const crud = new Crud({
  baseURL: "http://127.0.0.1:8000/api",
  storageService: {
    getToken: () => localStorage.getItem("access_token"),
    getLang: () => localStorage.getItem("lang") || "ar",
  },
});

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchMinistries = useCallback(async () => {
    try {
      const res = await crud.get("/ministry/read");
      const payload = res?.data ?? res?.raw?.data ?? null;
      let items = [];
      if (Array.isArray(payload)) items = payload;
      else if (payload?.data && Array.isArray(payload.data)) items = payload.data;
      setMinistries(items);
    } catch  {
      setMinistries([]);
    }
  }, []);

  const fetchBranchesForMinistry = useCallback(async (id) => {
    if (!id) return setBranches([]);
    try {
      const res = await crud.get(`/ministry/readOne/${id}`);
      const payload = res?.data ?? res?.raw?.data ?? null;
      const ministryObj = payload?.data ?? payload;
      setBranches(Array.isArray(ministryObj?.branches) ? ministryObj.branches : []);
    } catch {
      setBranches([]);
    }
  }, []);

  const fetchEmployees = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (opts.branchId) res = await crud.get(`/employee/getByBranch/${opts.branchId}`);
      else if (opts.ministryId) res = await crud.get(`/employee/getByMinistry/${opts.ministryId}`);
      else res = await crud.get("/employee/read");

      const payload = res?.data ?? res?.raw?.data ?? null;
      let list = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.data)) list = payload.data;
      else if (Array.isArray(payload?.employees)) list = payload.employees;
      else if (payload?.data?.employees) list = payload.data.employees;

      setEmployees(list);
      return list;
    } catch  {
      setError("فشل جلب الموظفين");
      setEmployees([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeById = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await crud.get(`/employee/readOne/${id}`);
      const payload = res?.data ?? res?.raw?.data ?? null;
      setSelectedEmployee(payload?.data ?? payload);
    } catch {
      alert("حدث خطأ أثناء جلب التفاصيل");
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeMinistry = (e) => {
    const id = e.target.value;
    setSelectedMinistry(id);
    setSelectedBranch("");
    if (id) {
      fetchBranchesForMinistry(id);
      fetchEmployees({ ministryId: id });
    } else {
      setBranches([]);
      fetchEmployees();
    }
  };

  const onChangeBranch = (e) => {
    const id = e.target.value;
    setSelectedBranch(id);
    if (id) fetchEmployees({ branchId: id });
    else if (selectedMinistry) fetchEmployees({ ministryId: selectedMinistry });
    else fetchEmployees();
  };

  const refreshEmployees = async () => {
    if (selectedBranch) return fetchEmployees({ branchId: selectedBranch });
    if (selectedMinistry) return fetchEmployees({ ministryId: selectedMinistry });
    return fetchEmployees();
  };

  useEffect(() => {
    fetchMinistries();
    fetchEmployees();
  }, []);

  return (
    <div style={{ padding: 25 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#005c99" }}>الموظفون</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ padding: "8px 14px", borderRadius: 8 }} onClick={() => setShowAdd(true)}>إضافة موظف</button>
          <button style={{ padding: "8px 14px", borderRadius: 8, background: "#e8f4ff" }} onClick={refreshEmployees}>تحديث</button>
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
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 }}>
          {employees.map((e) => (
            <div key={e.id} style={{ background: "#ffffff", borderRadius: 12, padding: 16, border: "1px solid #d1e7ff", boxShadow: "0 4px 12px rgba(0, 123, 255, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: "#003d66" }}>
                  {e.user?.first_name} {e.user?.last_name}
                </strong>
                <small style={{ background: "#e6f2ff", padding: "2px 6px", borderRadius: 6 }}>{e.user?.role}</small>
              </div>

              <div style={{ marginTop: 10, lineHeight: 1.7 }}>
                <div><strong style={{ color: "#005c99" }}>البريد:</strong> {e.user?.email}</div>
                <div><strong style={{ color: "#005c99" }}>الهاتف:</strong> {e.user?.phone}</div>
                <div><strong style={{ color: "#005c99" }}>تاريخ البدء:</strong> {e.start_date}</div>
                <div><strong style={{ color: "#005c99" }}>الوزارة:</strong> {e.ministry?.name}</div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button style={{ padding: "6px 10px", borderRadius: 8 }} onClick={() => fetchEmployeeById(e.id)}>عرض</button>
                <button style={{ padding: "6px 10px", borderRadius: 8 }}>تعديل</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Dialog title="إضافة موظف جديد" onClose={() => setShowAdd(false)}>
          <AddEmployee onAdded={() => refreshEmployees()} onCancel={() => setShowAdd(false)} />
        </Dialog>
      )}

      {selectedEmployee && (
        <Dialog title="تفاصيل الموظف" onClose={() => setSelectedEmployee(null)}>
          <div>
            <h3>{selectedEmployee.user?.first_name} {selectedEmployee.user?.last_name}</h3>
            <p>البريد: {selectedEmployee.user?.email}</p>
            <p>الهاتف: {selectedEmployee.user?.phone}</p>
            <p>الوزارة: {selectedEmployee.ministry?.name}</p>
            <p>تاريخ البدء: {selectedEmployee.start_date}</p>
          </div>
        </Dialog>
      )}
    </div>
  );
}
