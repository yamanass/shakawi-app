// src/services/Crud.js
import axios from 'axios';
import API from './api.js';
import ServerError from '../utils/ServerError.js';

// helper: read cookie (fallback)
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const BASE = import.meta.env.VITE_API_BASE || '/api';

// URLs we skip adding Authorization for (login, refresh)
const SKIP_AUTH_URLS = [
  API?.AUTH?.LOGIN || '/api/login',
  API?.AUTH?.REFRESH || '/api/refresh-token',
];

export default class Crud {
  constructor({ baseURL = BASE } = {}) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: false, // change to true only if you use cookie-based auth (Sanctum)
    });
  }

  /**
   * Read headers. If skipAuth === true -> do not include Authorization header.
   */
  _getHeaders(skipAuth = false) {
    const lang = localStorage.getItem('lang') || 'ar';
    const headers = {
      Accept: 'application/json',
      'Accept-Language': lang,
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = localStorage.getItem('access_token') || null;
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async post(url, data) {
    return this._requestWithRefresh('post', url, data);
  }

  async get(url, params = {}) {
    return this._requestWithRefresh('get', url, { params });
  }
   async delete(url, data = {}) {
    return this._requestWithRefresh('delete', url, data);
  }

  // unified request with refresh-token handling
  async _requestWithRefresh(method, url, data) {
    try {
      // normalize check for skip-auth URLs (compare endsWith to be tolerant)
      const absoluteRefresh = API?.AUTH?.REFRESH || '/api/refresh-token';
      const absoluteLogin = API?.AUTH?.LOGIN || '/api/login';
      const skipAuth = [absoluteLogin, absoluteRefresh].some(u => {
        if (!u) return false;
        return url === u || url.endsWith(u) || String(url).endsWith(u);
      });

      const config = {
        headers: this._getHeaders(skipAuth),
        validateStatus: () => true,
        withCredentials: false,
      };

      console.log(`[Crud] Request → ${method.toUpperCase()} ${url}`, { skipAuth, config, data });

      let res;
      if (method.toLowerCase() === 'get') {
        res = await this.client.get(url, { ...config, params: data?.params || {} });
      } else {
        res = await this.client[method](url, data, config);
      }

      console.log(`[Crud] Response ${res.status} ← ${url}`, res.data);

      // If unauthorized, attempt to refresh (but don't loop if we're already calling refresh)
      const refreshEndpoint = absoluteRefresh;
      if (res.status === 401 && !(String(url).includes(refreshEndpoint))) {
        console.warn('[Crud] 401 detected → attempting token refresh');

        // try read refresh token from localStorage first, fallback to cookie
        const refresh_token = localStorage.getItem('refresh_token') || getCookie('refresh_token');
        console.log('[Crud] refresh_token present?', !!refresh_token);

        if (!refresh_token) {
          // no refresh token: return original response (caller can handle logout)
          return res;
        }

        // call refresh endpoint without Authorization header
        const refreshConfig = {
          headers: this._getHeaders(true),
          validateStatus: () => true,
          withCredentials: false,
        };

        try {
          console.log('[Crud] Calling refresh endpoint:', refreshEndpoint);
          const refreshRes = await this.client.post(refreshEndpoint, { refresh_token }, refreshConfig);
          console.log('[Crud] Refresh response', refreshRes.status, refreshRes.data);

          const newToken = refreshRes?.data?.data?.access_token || refreshRes?.data?.access_token;
          if (!newToken) {
            console.warn('[Crud] Cannot refresh token - no access token in response', refreshRes.data);
            return res;
          }

          // save new access token
          localStorage.setItem('access_token', newToken);
          console.log('[Crud] New access token saved to localStorage');

          // retry original request once with new token
          const retryConfig = {
            headers: this._getHeaders(false),
            validateStatus: () => true,
            withCredentials: false,
          };

          if (method.toLowerCase() === 'get') {
            const retryRes = await this.client.get(url, { ...retryConfig, params: data?.params || {} });
            console.log('[Crud] Retry response after refresh', retryRes.status, retryRes.data);
            return retryRes;
          } else {
            const retryRes = await this.client[method](url, data, retryConfig);
            console.log('[Crud] Retry response after refresh', retryRes.status, retryRes.data);
            return retryRes;
          }
        } catch (refreshErr) {
          console.error('[Crud] Refresh request failed:', refreshErr);
          // if refresh fails, propagate original 401 response or throw
          return res;
        }
      }

      // otherwise return original response
      return res;
    } catch (err) {
      console.error('[Crud] Request error:', err);
      throw err;
    }
  }
}
