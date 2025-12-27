// src/data/complaintData.js
// ✅ استخدم الـ instance المركزي من services/crudInstance.js
import crud from "../services/crudInstance.js";

/**
 * بدء معالجة شكوى
 * @param {number|string} complaintId
 * @returns {Promise<any>} response.data
 */
const startProcessingComplaint = async (complaintId) => {
  if (!complaintId) throw new Error("Complaint ID is required");

  try {
    // تأكد أن crud لديه post (debug)
    if (!crud || typeof crud.post !== "function") {
      throw new Error("crud.post is not available — check import path for crud instance");
    }

    // POST /complaint/startProcessing/{id}
    const response = await crud.post(`/api/complaint/startProcessing/${complaintId}`);

    // عادة response.data يحتوي على الجسم الفعلي
    return response?.data ?? response;
  } catch (error) {
    console.error("Start Processing Error:", error);
    // رمي الخطأ إلى الواجهة حتى تتعامل معها
    throw error;
  }
};
const addReply = async (complaintId, content = "", files = []) => {
  if (!complaintId) throw new Error("Complaint ID is required for reply");

  try {
    // build FormData
    const fd = new FormData();
    if (content !== undefined && content !== null) fd.append("content", String(content));
    if (files && files.length) {
      files.forEach((f) => {
        // backend expects media[] (as you described)
        fd.append("media[]", f);
      });
    }

    // Use fetch to allow multipart and explicit Authorization header
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token available");

    const url = `/api/complaint/reply/add/${complaintId}`; // relative -> goes through Vite proxy in dev

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        // do NOT set Content-Type; browser will set the correct multipart boundary
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    if (!resp.ok) {
      let errBody = null;
      try { errBody = await resp.json(); } catch { /* ignore */ }
      const msg = errBody?.message || `Server returned ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.body = errBody;
      throw err;
    }

    const data = await resp.json();
    return data;
  } catch (err) {
    console.error("[complaintData] addReply error:", err);
    throw err;
  }
};
const getReplies = async (complaintId) => {
  if (!complaintId) throw new Error("Complaint ID is required");
  try {
    const res = await crud.get(`/api/complaint/reply/read/${complaintId}`);
    // backend يعطي { status, message, data: [...] }
    const body = res?.data ?? res?.raw?.data ?? res;
    return body?.data ?? [];
  } catch (err) {
    console.error("[complaintData.getReplies] error:", err);
    throw err;
  }
};
const deleteReply = async (replyId) => {
  if (!replyId) throw new Error("Reply ID is required for deletion");
  try {
    // fallback: if crud.delete missing but crud.client (axios) exists
    if (typeof crud.delete !== "function" && crud && crud.client && typeof crud.client.delete === "function") {
      const res = await crud.client.delete(`/api/complaint/reply/delete/${replyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      return res?.data ?? res;
    }

    // normal path
    const res = await crud.delete(`/api/complaint/reply/delete/${replyId}`);
    return res?.data ?? res;
  } catch (err) {
    console.error("[complaintData.deleteReply] error:", err);
    throw err;
  }
};

export default {
  startProcessingComplaint,
  addReply,
   getReplies,
    deleteReply,
};
