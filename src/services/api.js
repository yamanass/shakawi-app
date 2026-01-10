// src/api/api.js
const BASE = import.meta.env.REACT_APP_API_BASE || 'http://10.43.36.32:8000';

const API = {
   BASE: `${BASE}/api`,
  MINISTRY: {
    READ: `/api/v1/ministry/readAll`,
    STORE: `${BASE}/api/v1/ministry/store`, // 👈 الرابط الصحيح للإضافة
  },
   BRANCH: {
      STORE: `/api/v1/ministry/branch/store`,
      READ_ONE: `/api/v1/ministry/branch/readOne`, // 👈 هنا رابط API لتفاصيل الفرع
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