// src/services/Crud.js
import axios from 'axios';

export default class Crud {
  constructor({ baseURL = '', storageService = null } = {}) {
    this.baseURL = baseURL;
    this.storage = storageService || {
      getToken: () => localStorage.getItem('token'),
      getLang: () => localStorage.getItem('lang') || 'ar',
    };
    this.client = axios.create({ baseURL: this.baseURL, timeout: 30000 });
  }

  _getHeaders() {
    const lang = this.storage.getLang ? this.storage.getLang() : 'ar';
    const headers = {
      Accept: 'application/json',
      'Accept-Language': lang,
      'Content-Type': 'application/json',
    };
    const token = this.storage.getToken ? this.storage.getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  // for compatibility with previous code name postData -> post
  async post(url, data) {
    const headers = this._getHeaders();
    console.log('[Crud.post] url:', url);
    console.log('[Crud.post] headers:', headers);
    console.log('[Crud.post] payload:', data);

    try {
      const res = await this.client.post(url, data, {
        headers,
        validateStatus: () => true, 
      });

      console.log('[Crud.post] response status:', res.status);
      console.log('[Crud.post] response data:', res.data);

      return {
        success: [200, 201, 422].includes(res.status),
        status: res.status,
        data: res.data,
        raw: res,
      };
    } catch (err) {
      console.error('[Crud.post] network/error:', err);
      return { success: false, error: err };
    }
  }
   // === NEW: get method ===
  async get(url, params = {}) {
    const headers = this._getHeaders();
    console.log('[Crud.get] url:', url);
    console.log('[Crud.get] headers:', headers);
    console.log('[Crud.get] params:', params);

    try {
      const res = await this.client.get(url, {
        headers,
        params,
        validateStatus: () => true,
      });

      console.log('[Crud.get] response status:', res.status);
      console.log('[Crud.get] response data:', res.data);

      return {
        success: [200, 201, 422].includes(res.status),
        status: res.status,
        data: res.data,
        raw: res,
      };
    } catch (err) {
      console.error('[Crud.get] network/error:', err);
      return { success: false, error: err };
    }
  }

}
