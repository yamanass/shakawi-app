// src/view/employees/Employees.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Crud from "../../services/Crud.js";
import AddEmployee from "./AddEmployee";
import Dialog from "../../components/common/Dialog.jsx";

const crud = new Crud({
  baseURL: "http://172.20.10.2:8000/api",
  storageService: {
    getToken: () => localStorage.getItem("access_token"),
    getLang: () => localStorage.getItem("lang") || "ar",
  },
});

export default function Employees() {
  const { t } = useTranslation();

  const [employees, setEmployees] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // assign / remove loading states
  const [assignBranchLoading, setAssignBranchLoading] = useState(false);
  const [assignMinistryLoading, setAssignMinistryLoading] = useState(false);
  const [removeBranchLoading, setRemoveBranchLoading] = useState(false);
  const [removeMinistryLoading, setRemoveMinistryLoading] = useState(false);

  // manager flags for selected employee
  const [isBranchManagerForSelected, setIsBranchManagerForSelected] = useState(false);
  const [isMinistryManagerForSelected, setIsMinistryManagerForSelected] = useState(false);

  // -------------------------
  // Fetch ministries / branches
  const fetchMinistries = useCallback(async () => {
    try {
      const res = await crud.get("/v1/ministry/read");
      const payload = res?.data ?? res?.raw?.data ?? null;
      let items = [];
      if (Array.isArray(payload)) items = payload;
      else if (payload?.data && Array.isArray(payload.data)) items = payload.data;
      setMinistries(items);
    } catch (err) {
      console.error("[fetchMinistries] error:", err);
      setMinistries([]);
    }
  }, []);

  const fetchBranchesForMinistry = useCallback(async (id) => {
    if (!id) return setBranches([]);
    try {
      const res = await crud.get(`/v1/ministry/readOne/${id}`);
      const payload = res?.data ?? res?.raw?.data ?? null;
      const ministryObj = payload?.data ?? payload;
      setBranches(Array.isArray(ministryObj?.branches) ? ministryObj.branches : []);
    } catch (err) {
      console.error("[fetchBranchesForMinistry] error:", err);
      setBranches([]);
    }
  }, []);

  // -------------------------
  // Normalization helper: turn various API shapes into predictable object
  // normalization helper (replace your current normalizeEmployeeItem with this)
const normalizeEmployeeItem = (item) => {
  if (!item) return null;
  const raw = item;

  const userCandidate = raw.user || raw.user_info || raw.user_data || raw.user_profile || null;

  const topLevelUserLike =
    !userCandidate &&
    (raw.first_name || raw.last_name || raw.email || raw.phone || raw.full_name)
      ? {
          first_name: raw.first_name || raw.full_name || "",
          last_name: raw.last_name || "",
          email: raw.email || "",
          phone: raw.phone || "",
          role: raw.role || "",
        }
      : null;

  const user = userCandidate
    ? {
        first_name: userCandidate.first_name || userCandidate.firstName || userCandidate.name || "",
        last_name: userCandidate.last_name || userCandidate.lastName || "",
        email: userCandidate.email || "",
        phone: userCandidate.phone || "",
        role: userCandidate.role || userCandidate.job_title || "",
      }
    : topLevelUserLike || {
        first_name: raw.first_name || raw.name || "",
        last_name: raw.last_name || "",
        email: raw.email || "",
        phone: raw.phone || "",
        role: raw.role || "",
      };

  const more = raw.more_info ?? raw.moreInfo ?? null;

  const start_date = raw.start_date ?? raw.startDate ?? (more ? more.start_date ?? more.startDate : null) ?? null;
  const end_date = raw.end_date ?? raw.endDate ?? (more ? more.end_date ?? more.endDate : null) ?? null;

  const ministry =
    raw.ministry ??
    (more && (more.ministry ?? null)) ??
    raw.ministry_info ??
    raw.ministryInfo ??
    null;

  const ministry_branch_id =
    raw.ministry_branch_id ??
    raw.branch_id ??
    raw.ministryBranchId ??
    (more ? (more.ministry_branch_id ?? more.branch_id ?? more.ministryBranchId) : null) ??
    null;

  const branch =
    raw.branch ??
    raw.ministry_branch ??
    (more ? more.branch ?? more.ministry_branch ?? null : null) ??
    null;

  // Important: keep both user id and employee id explicitly
  const userId = raw.id ?? (raw.user && raw.user.id) ?? null; // user.id when top-level is a user
  const empIdFromRaw = raw.employee_id ?? (more && more.employee_id) ?? null; // sometimes in more_info

  // canonical fallback id(s)
  const canonicalUserId = userId;
  const canonicalEmployeeId = empIdFromRaw ?? raw.id ?? null;

  return {
    id: canonicalUserId, // user id (if present)
    employee_id: canonicalEmployeeId, // employee id (if present)
    user,
    start_date,
    end_date,
    ministry,
    ministry_branch_id,
    branch,
    raw,
  };
};


  // -------------------------
  // Fetch employees (list) — normalize output
  const fetchEmployees = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (opts.branchId) res = await crud.get(`/v1/employee/getByBranch/${opts.branchId}`);
        else if (opts.ministryId) res = await crud.get(`/v1/employee/getByMinistry/${opts.ministryId}`);
        else res = await crud.get("/v1/employee/read");

        const payload = res?.data ?? res?.raw?.data ?? res ?? null;
        let list = [];

        if (Array.isArray(payload)) list = payload;
        else if (Array.isArray(payload?.data)) list = payload.data;
        else if (Array.isArray(payload?.employees)) list = payload.employees;
        else if (Array.isArray(payload?.data?.employees)) list = payload.data.employees;
        else if (Array.isArray(payload?.data?.data)) list = payload.data.data; // fallback

        const normalized = (list || []).map((it) => normalizeEmployeeItem(it)).filter(Boolean);

        setEmployees(normalized);
        return normalized;
      } catch (err) {
        console.error("[fetchEmployees] error:", err);
        setError(t("fetchEmployeesError") || "فشل جلب الموظفين");
        setEmployees([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // -------------------------
  // Fetch a single employee by id and normalize
  const fetchEmployeeById = useCallback(
    async (id) => {
      if (!id) return null;
      setLoading(true);
      try {
        const res = await crud.get(`/v1/employee/readOne/${id}`);
        const payload = res?.data ?? res?.raw?.data ?? res ?? null;
        const item = payload?.data ?? payload ?? null;
        if (!item) {
          setSelectedEmployee(null);
          return null;
        }
        const normalized = normalizeEmployeeItem(item);
        setSelectedEmployee(normalized);
        return normalized;
      } catch (err) {
        console.error("[fetchEmployeeById] error:", err);
        alert(t("fetchEmployeeDetailError") || "فشل جلب تفاصيل الموظف");
        setSelectedEmployee(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // -------------------------
  // Helper: detect branchId/ministryId from normalized employee
  const detectBranchIdFromEmployee = (emp) => {
    if (!emp) return null;
    return (
      emp.branch?.id ||
      emp.branch?.branch_id ||
      emp.ministry_branch_id ||
      (emp.raw && (emp.raw.ministry_branch_id || emp.raw.branch_id)) ||
      (emp.raw && emp.raw.more_info && (emp.raw.more_info.ministry_branch_id || emp.raw.more_info.branch_id)) ||
      null
    );
  };

  const detectMinistryIdFromEmployee = (emp) => {
    if (!emp) return null;
    return (
      emp.ministry?.id ||
      emp.ministry?.ministry_id ||
      (emp.raw && (emp.raw.ministry?.id || emp.raw.ministry_id)) ||
      (emp.raw && emp.raw.more_info && (emp.raw.more_info.ministry?.id || emp.raw.more_info.ministry_id)) ||
      null
    );
  };

  // -------------------------
  // Helpers: determine if an employee is manager of a ministry/branch
  const _matchesManagerId = (mgr, empId) => {
    if (!mgr || !empId) return false;
    const mgrIds = [
      mgr.id,
      mgr.employee_id,
      mgr.employeeId,
      mgr.user_id,
      mgr.user?.id,
    ].filter(Boolean).map(String);
    const eIdStr = String(empId);
    return mgrIds.includes(eIdStr);
  };

 // replace the existing computeManagerFlags with this:
// replace the existing computeManagerFlags with this (removed unused hasBranch)
const computeManagerFlags = useCallback(() => {
  if (!selectedEmployee) {
    setIsBranchManagerForSelected(false);
    setIsMinistryManagerForSelected(false);
    return;
  }

  // role returned by dialog (user.role or raw.role)
  const roleRaw = (selectedEmployee.user?.role || selectedEmployee.raw?.role || "").toString().toLowerCase();

  // Decide flags based on role string (robust to small variants)
  const isBranchRole = roleRaw === "branch_manager" || roleRaw === "branch-manager" || roleRaw.includes("branch");
  const isMinistryRole = roleRaw === "ministry_manager" || roleRaw === "ministry-manager" || roleRaw.includes("ministry");

  setIsBranchManagerForSelected(Boolean(isBranchRole));
  setIsMinistryManagerForSelected(Boolean(isMinistryRole));

  // (optional) if backend provides explicit flags inside more_info, prefer them
  const raw = selectedEmployee.raw ?? {};
  if (raw.more_info && (raw.more_info.is_branch_manager || raw.more_info.is_branch)) {
    setIsBranchManagerForSelected(true);
  }
  if (raw.more_info && (raw.more_info.is_ministry_manager || raw.more_info.is_ministry)) {
    setIsMinistryManagerForSelected(true);
  }

}, [selectedEmployee]);



  useEffect(() => {
    computeManagerFlags();
  }, [computeManagerFlags]);

  // -------------------------
  // Assign to branch manager
 const assignBranchManager = async (branchId, employeeId) => {
  const empId = employeeId ?? (selectedEmployee && (selectedEmployee.employee_id || selectedEmployee.id));
  if (!branchId) { alert("لم يتم العثور على معرف الفرع للموظف. تأكد أن الموظف مرتبط بفرع."); return; }
  if (!empId) { alert("لم يتم العثور على معرف الموظف."); return; }
  if (!window.confirm("تأكيد: هل تريد ترقية هذا الموظف ليصبح مدير الفرع؟")) return;

  setAssignBranchLoading(true);
  try {
    await crud.post(`/ministry/branch/${branchId}/assign-manager/${empId}`);

    // تحديث البيانات بالترتيب: ministries -> employee detail -> employees list
    await fetchMinistries();
    const updated = await fetchEmployeeById(empId); // fetchEmployeeById يقوم setSelectedEmployee داخليًا
    await refreshEmployees();

    // تأكد من أن selectedEmployee محدث وأعد الحسابات
    if (updated) setSelectedEmployee(updated);
    computeManagerFlags();

    alert("تمت الترقية إلى مدير فرع بنجاح.");
  } catch (err) {
    console.error("[assignBranchManager] error:", err);
    const msg = err?.response?.data?.message || err?.message || "فشل الترقية";
    alert(msg);
  } finally {
    setAssignBranchLoading(false);
  }
};


  // Assign to ministry manager
 const assignMinistryManager = async (ministryId, employeeId) => {
  const empId = employeeId ?? (selectedEmployee && (selectedEmployee.employee_id || selectedEmployee.id));
  if (!ministryId) { alert("لم يتم العثور على معرف الوزارة للموظف. تأكد أن الموظف مرتبط بوزارة."); return; }
  if (!empId) { alert("لم يتم العثور على معرف الموظف."); return; }
  if (!window.confirm("تأكيد: هل تريد ترقية هذا الموظف ليصبح مدير الوزارة؟")) return;

  setAssignMinistryLoading(true);
  try {
    await crud.post(`/ministry/${ministryId}/assign-manager/${empId}`);

    // تحديث البيانات
    await fetchMinistries();
    const updated = await fetchEmployeeById(empId);
    await refreshEmployees();

    if (updated) setSelectedEmployee(updated);
    computeManagerFlags();

    alert("تمت الترقية إلى مدير وزارة بنجاح.");
  } catch (err) {
    console.error("[assignMinistryManager] error:", err);
    const msg = err?.response?.data?.message || err?.message || "فشل الترقية";
    alert(msg);
  } finally {
    setAssignMinistryLoading(false);
  }
};


  // -------------------------
  // Remove branch manager
  const removeBranchManager = async (branchId) => {
  if (!branchId) { alert("لا يوجد معرف الفرع."); return; }
  if (!window.confirm("تأكيد: هل تريد إزالة صلاحيات مدير الفرع؟")) return;

  setRemoveBranchLoading(true);
  try {
    await crud.post(`/ministry/branch/${branchId}/remove-manager`);

    // تحديث البيانات
    await fetchMinistries();
    // حاول إعادة جلب تفاصيل الموظف الحالي إن كان مفتوحاً
    const empId = selectedEmployee?.employee_id ?? selectedEmployee?.id;
    if (empId) {
      const updated = await fetchEmployeeById(empId);
      if (updated) setSelectedEmployee(updated);
    }
    await refreshEmployees();

    computeManagerFlags();

    alert("تمت إزالة مدير الفرع بنجاح.");
  } catch (err) {
    console.error("[removeBranchManager] error:", err);
    const msg = err?.response?.data?.message || err?.message || "فشل إزالة مدير الفرع";
    alert(msg);
  } finally {
    setRemoveBranchLoading(false);
  }
};


  // Remove ministry manager
 const removeMinistryManager = async (ministryId) => {
  if (!ministryId) { alert("لا يوجد معرف الوزارة."); return; }
  if (!window.confirm("تأكيد: هل تريد إزالة صلاحيات مدير الوزارة؟")) return;

  setRemoveMinistryLoading(true);
  try {
    await crud.post(`/ministry/${ministryId}/remove-manager`);

    // تحديث البيانات
    await fetchMinistries();
    const empId = selectedEmployee?.employee_id ?? selectedEmployee?.id;
    if (empId) {
      const updated = await fetchEmployeeById(empId);
      if (updated) setSelectedEmployee(updated);
    }
    await refreshEmployees();

    computeManagerFlags();

    alert("تمت إزالة مدير الوزارة بنجاح.");
  } catch (err) {
    console.error("[removeMinistryManager] error:", err);
    const msg = err?.response?.data?.message || err?.message || "فشل إزالة مدير الوزارة";
    alert(msg);
  } finally {
    setRemoveMinistryLoading(false);
  }
};

  // -------------------------
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
  }, [fetchMinistries, fetchEmployees]);

  // recompute flags when ministries or selectedEmployee change
  useEffect(() => {
    computeManagerFlags();
  }, [computeManagerFlags]);

  
  // -------------------------
  return (
    <div style={{ padding: 25 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#005c99" }}>{t("employees")}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ padding: "8px 14px", borderRadius: 8 }} onClick={() => setShowAdd(true)}>
            {t("addEmployee")}
          </button>
          <button style={{ padding: "8px 14px", borderRadius: 8, background: "#e8f4ff" }} onClick={refreshEmployees}>
            {t("refresh")}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <select value={selectedMinistry} onChange={onChangeMinistry} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">{t("allMinistries")}</option>
          {ministries.map((m) => (
            <option key={m.id} value={m.id}>{m.name || m.ministry_name}</option>
          ))}
        </select>

        <select value={selectedBranch} disabled={!branches.length} onChange={onChangeBranch} style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="">{t("allBranches")}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name || b.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>{t("loading")}</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 }}>
          {employees.map((e) => (
            <div key={e.employee_id ?? e.id ?? JSON.stringify(e.raw)} style={{ background: "#ffffff", borderRadius: 12, padding: 16, border: "1px solid #d1e7ff", boxShadow: "0 4px 12px rgba(0, 123, 255, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: "#003d66" }}>
                  { ( (e.user?.first_name || "") + " " + (e.user?.last_name || "") ).trim() || `موظف #${e.employee_id ?? e.id ?? "-"}` }
                </strong>
                <small style={{ background: "#e6f2ff", padding: "2px 6px", borderRadius: 6 }}>{e.user?.role || "-"}</small>
              </div>

              <div style={{ marginTop: 10, lineHeight: 1.7 }}>
                <div><strong style={{ color: "#005c99" }}>{t("email")}:</strong> {e.user?.email || "-"}</div>
                <div><strong style={{ color: "#005c99" }}>{t("phone")}:</strong> {e.user?.phone || "-"}</div>
                <div><strong style={{ color: "#005c99" }}>{t("startDate")}:</strong> {e.start_date || "-"}</div>
                <div><strong style={{ color: "#005c99" }}>{t("ministry")}:</strong> {e.ministry?.name || (e.raw?.more_info?.ministry?.name) || "-"}</div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button style={{ padding: "6px 10px", borderRadius: 8 }} onClick={() => fetchEmployeeById(e.employee_id ?? e.id)}>
                  {t("view")}
                </button>
                <button style={{ padding: "6px 10px", borderRadius: 8 }}>
                  {t("edit")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Dialog title={t("addEmployeeDialogTitle")} onClose={() => setShowAdd(false)}>
          <AddEmployee onAdded={() => refreshEmployees()} onCancel={() => setShowAdd(false)} />
        </Dialog>
      )}

      {selectedEmployee && (
        <Dialog title={t("employeeDetailDialogTitle")} onClose={() => setSelectedEmployee(null)}>
          <div>
            <h3>{(selectedEmployee.user?.first_name || "") + " " + (selectedEmployee.user?.last_name || "")}</h3>
            <p>{t("email")}: {selectedEmployee.user?.email || "-"}</p>
            <p>{t("phone")}: {selectedEmployee.user?.phone || "-"}</p>

            <p>{t("ministry")}: {selectedEmployee.ministry?.name || selectedEmployee.raw?.more_info?.ministry?.name || "-"}</p>

            <p>{t("startDate")}: {selectedEmployee.start_date || "-"}</p>
            <p>{t("branchId") || "فرع (ID)"}: {detectBranchIdFromEmployee(selectedEmployee) ?? "-"}</p>
            <p>
              {t("branchName") || "اسم الفرع"}: {
                selectedEmployee.branch?.name
                || selectedEmployee.raw?.more_info?.branch?.name
                || (() => {
                  const bid = detectBranchIdFromEmployee(selectedEmployee);
                  for (const m of ministries) {
                    if (!Array.isArray(m.branches)) continue;
                    const found = m.branches.find(b => String(b.id) === String(bid));
                    if (found) return found.name;
                  }
                  return "-";
                })()
              }
            </p>

            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {/* New rendering logic to satisfy user's rules */}
              {/*
                Cases:
                - If employee is ministry manager and NOT branch manager => show remove ministry only
                - If employee is branch manager and NOT ministry manager => show remove branch only
                - If both => show both remove buttons
                - If neither => show add ministry and (only if employee has branch) add branch
                - If employee has no branch => never show branch buttons
              */}
            {(() => {
  // read ids from selectedEmployee (dialog data)
  const hasBranch = !!detectBranchIdFromEmployee(selectedEmployee);
  const ministryId = detectMinistryIdFromEmployee(selectedEmployee);
  const branchId = hasBranch ? detectBranchIdFromEmployee(selectedEmployee) : null;
  const empId = selectedEmployee?.employee_id ?? selectedEmployee?.id;

  // Use the computed state flags (set by computeManagerFlags)
  //  - isMinistryManagerForSelected
  //  - isBranchManagerForSelected

  // both managers -> show both remove buttons
  if (isMinistryManagerForSelected && isBranchManagerForSelected) {
    return (
      <>
        <button
          onClick={() => removeBranchManager(branchId)}
          disabled={removeBranchLoading}
          style={{ padding: "8px 12px", borderRadius: 8, background: "#fecaca", border: "1px solid #f87171" }}
        >
          {removeBranchLoading ? "جاري..." : "إزالة مدير فرع"}
        </button>

        <button
          onClick={() => removeMinistryManager(ministryId)}
          disabled={removeMinistryLoading}
          style={{ padding: "8px 12px", borderRadius: 8, background: "#fecaca", border: "1px solid #f87171" }}
        >
          {removeMinistryLoading ? "جاري..." : "إزالة مدير الوزارة"}
        </button>
      </>
    );
  }

  // only ministry manager
  if (isMinistryManagerForSelected && !isBranchManagerForSelected) {
    return (
      <button
        onClick={() => removeMinistryManager(ministryId)}
        disabled={removeMinistryLoading}
        style={{ padding: "8px 12px", borderRadius: 8, background: "#fecaca", border: "1px solid #f87171" }}
      >
        {removeMinistryLoading ? "جاري..." : "إزالة مدير الوزارة"}
      </button>
    );
  }

  // only branch manager
  if (isBranchManagerForSelected && !isMinistryManagerForSelected) {
    if (!branchId) {
      return <div style={{ color: "#6b7280" }}>لا يوجد فرع معروف لإزالة مدير الفرع</div>;
    }
    return (
      <button
        onClick={() => removeBranchManager(branchId)}
        disabled={removeBranchLoading}
        style={{ padding: "8px 12px", borderRadius: 8, background: "#fecaca", border: "1px solid #f87171" }}
      >
        {removeBranchLoading ? "جاري..." : "إزالة مدير فرع"}
      </button>
    );
  }

  // neither manager => show add buttons (show branch add only if has branch)
  return (
    <>
      <button
        onClick={() => assignMinistryManager(ministryId, empId)}
        disabled={assignMinistryLoading}
        style={{ padding: "8px 12px", borderRadius: 8, background: "#bfdbfe", border: "1px solid #2563eb" }}
      >
        {assignMinistryLoading ? "جاري..." : "ترقية لمدير وزارة"}
      </button>

      {hasBranch ? (
        <button
          onClick={() => assignBranchManager(branchId, empId)}
          disabled={assignBranchLoading}
          style={{ padding: "8px 12px", borderRadius: 8, background: "#fde68a", border: "1px solid #f59e0b" }}
        >
          {assignBranchLoading ? "جاري..." : "ترقية لمدير فرع"}
        </button>
      ) : null}
    </>
  );
})()}

            </div>

            {/* raw data for debugging (toggle if you want) */}
            <div style={{ marginTop: 14 }}>
              <details>
                <summary style={{ cursor: "pointer" }}>عرض البيانات الخام (raw)</summary>
                <pre style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflow: "auto", background: "#f8fafc", padding: 8, borderRadius: 6 }}>
                  {JSON.stringify(selectedEmployee.raw ?? selectedEmployee, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
