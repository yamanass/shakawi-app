// src/services/crudInstance.js
import axios from 'axios';
import API from './api.js'; // تأكد من أن AUTH.REFRESH موجود فيه
import ServerError from '../utils/ServerError.js';

// دالة لقراءة الكوكيز
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

class Crud {
  constructor({ baseURL = BASE } = {}) {
    this.baseURL = baseURL;
    this.client = axios.create({ baseURL: this.baseURL, timeout: 30000 });
  }

  _getHeaders() {
    const lang = localStorage.getItem('lang') || 'ar';
    const headers = {
      Accept: 'application/json',
      'Accept-Language': lang,
      'Content-Type': 'application/json',
    };
    const token = getCookie('access_token');
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async post(url, data) {
    return this._requestWithRefresh('post', url, data);
  }

  async get(url, params = {}) {
    return this._requestWithRefresh('get', url, { params });
  }

  // كل أنواع الطلبات مع دعم تجديد التوكن
 async _requestWithRefresh(method, url, data) {
  try {
    const res = await this.client[method](url, data, { headers: this._getHeaders(), validateStatus: () => true });

    // Access token انتهى
    if (res.status === 401 && url !== API.AUTH.REFRESH) {
      const now = new Date();
      console.log(`[Crud] Access token expired at ${now.toLocaleTimeString()}`);

      const refresh_token = getCookie('refresh_token');
      console.log(`[Crud] Using refresh token: ${refresh_token}`);

      if (!refresh_token) throw new ServerError('Refresh token missing');

      const refreshRes = await this.client.post(API.AUTH.REFRESH, { refresh_token }, { validateStatus: () => true });
      const newToken = refreshRes.data?.data?.access_token;
      if (!newToken) throw new ServerError('Cannot refresh token');

      // تحديث الكوكيز
      document.cookie = `access_token=${newToken}; path=/; secure; samesite=strict; max-age=${60*15}`;

      const newTime = new Date();
      console.log(`[Crud] New access token received at ${newTime.toLocaleTimeString()}: ${newToken}`);

      // إعادة الطلب الأصلي مع التوكن الجديد
      return await this.client[method](url, data, { headers: this._getHeaders(), validateStatus: () => true });
    }

    return res;
  } catch (err) {
    console.error('[Crud] request error', err);
    throw err;
  }
}

}

const crud = new Crud();
export default crud;
