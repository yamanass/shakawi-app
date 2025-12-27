// src/api/api.js
const BASE = import.meta.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

const API = {
   BASE: `${BASE}/api`,
  MINISTRY: {
    READ: `/ministry/read`,
    STORE: `${BASE}/api/ministry/store`, // 👈 الرابط الصحيح للإضافة
  },
   BRANCH: {
      STORE: `/ministry/branch/store`,
      READ_ONE: `/ministry/branch/readOne`, // 👈 هنا رابط API لتفاصيل الفرع
    },
  GOVERNORATE: {
    READ: "/get-governorates",   // 👈 هذا هو رابطك الحقيقي
  },
  AUTH: {
    LOGIN: `${BASE}/api/login`,
    LOGOUT: `${BASE}/api/logout`,
  },
  
};

export default API;