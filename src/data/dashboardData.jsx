// src/data/dashboardData.js
import Crud from "../services/Crud.js";
import API from "../services/api.js";

const crud = new Crud({
  baseURL: API.BASE,
  storageService: {
    getToken: () => localStorage.getItem("access_token"),
    getLang: () => localStorage.getItem("lang") || "ar",
  },
});

/**
 * Fetch dashboard raw data from /getLog and normalize to a predictable shape.
 */
export async function fetchDashboardData() {
  try {
    const res = await crud.get("/getLog");
    const body = res?.data ?? res?.raw?.data ?? res ?? {};

    const ministries =
      Number(body.ministries) ||
      Number(body.ministries_count) ||
      Number(body.total_ministries) ||
      (Array.isArray(body.ministries_list) ? body.ministries_list.length : 0) ||
      0;

    const branches =
      Number(body.branches) ||
      Number(body.branches_count) ||
      Number(body.total_branches) ||
      (Array.isArray(body.branches_list) ? body.branches_list.length : 0) ||
      0;

    const employees =
      Number(body.employees) ||
      Number(body.employees_count) ||
      Number(body.total_employees) ||
      (Array.isArray(body.employees_list) ? body.employees_list.length : 0) ||
      0;

    const metrics = body.metrics || body.stats || body.statistics || {};
    const updatedAt = body.updated_at || body.generated_at || new Date().toISOString();

    return {
      ministries,
      branches,
      employees,
      metrics,
      raw: body,
      updatedAt,
    };
  } catch (err) {
    console.error("[dashboardData] fetch failed:", err);
    throw err;
  }
}

/**
 * Fetch the dashboard report (binary / PDF) from /getLog and open it.
 * - If openInNewTab === true, will open the generated URL in a new browser tab.
 * - Returns { blob, url, contentType } on success.
 */

export async function fetchStatsByStatus() {
  try {
    const res = await crud.get("/v1/statistics/statsByStatus");
    const body = res?.data ?? res?.raw?.data ?? res ?? [];
    // ensure array
    return Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  } catch (err) {
    console.error("[dashboardData] fetchStatsByStatus failed:", err);
    return []; // نفس نمط الباقي: لا ترمي خطأ هنا لتبقى الواجهة صامدة
  }
}

/**
 * /api/statistics/statsByMinistryAndBranch
 * returns: [{ ministry_id, ministry_branch_id, total, ministry, ministry_branch }, ...]
 */
export async function fetchStatsByMinistryAndBranch() {
  try {
    const res = await crud.get("/v1/statistics/statsByMinistryAndBranch");
    const body = res?.data ?? res?.raw?.data ?? res ?? [];
    return Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  } catch (err) {
    console.error("[dashboardData] fetchStatsByMinistryAndBranch failed:", err);
    return [];
  }
}

/**
 * /api/statistics/statsByMonth
 * returns: [{ year, month, new_count, in_progress_count, resolved_count, rejected_count, total }, ...]
 */
export async function fetchStatsByMonth() {
  try {
    const res = await crud.get("/v1/statistics/statsByMonth");
    const body = res?.data ?? res?.raw?.data ?? res ?? [];
    return Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  } catch (err) {
    console.error("[dashboardData] fetchStatsByMonth failed:", err);
    return [];
  }
}
export async function fetchStatsByUserActivity() {
  try {
    const res = await crud.get("/v1/statistics/statsByUserActivity");
    const body = res?.data ?? res?.raw?.data ?? res ?? null;
    // backend may return array directly or { data: [...] }
    const list = body?.data ?? (Array.isArray(body) ? body : []);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("[fetchStatsByUserActivity] error:", err);
    return [];
  }
}
export async function fetchCounts() {
  try {
    const res = await crud.get("/v1/statistics/getCounts");
    const body = res?.data ?? res?.raw?.data ?? res ?? null;
    const payload = body?.data ?? body ?? {};

    const employees_count = Number(payload?.employees_count ?? payload?.employees ?? 0) || 0;
    const ministries_count = Number(payload?.ministries_count ?? payload?.ministries ?? 0) || 0;
    const branches_count = Number(payload?.branches_count ?? payload?.branches ?? 0) || 0;

    return {
      employees_count,
      ministries_count,
      branches_count,
      raw: payload,
    };
  } catch (err) {
    console.error("[fetchCounts] error:", err);
    return { employees_count: 0, ministries_count: 0, branches_count: 0, raw: null };
  }
}
export async function fetchActivityLog() {
  try {
    // مسار النسخة التي أعطيتني إياها هو /v1/statistics/getActivity
    const res = await crud.get("/v1/statistics/getActivity");
    // backend قد يرجع { status, message, data: [...] } أو يرجع المصفوفة مباشرة
    const body = res?.data ?? res ?? null;
    const list = body?.data ?? (Array.isArray(body) ? body : []);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("[fetchActivityLog] error:", err);
    return [];
  }
}