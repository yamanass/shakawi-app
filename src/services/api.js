// src/api/api.js
const BASE = import.meta.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

const API = {
  AUTH: {
    LOGIN: `${BASE}/api/login`,
    LOGOUT: `${BASE}/api/logout`,
  },
};

export default API;
