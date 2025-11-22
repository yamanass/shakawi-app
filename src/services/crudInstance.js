import axios from 'axios';
import API from './api.js';
import ServerError from '../utils/ServerError.js';

// helper: read cookie (fallback)
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

// URLs we skip adding Authorization for (login, refresh)
const SKIP_AUTH_URLS = [
  API.AUTH?.LOGIN || '/api/login',
  API.AUTH?.REFRESH || '/api/refresh-token',
];

class Crud {
  constructor({ baseURL = BASE } = {}) {
    this.baseURL = baseURL;

    // IMPORTANT: do NOT send credentials by default to avoid cookie-based CORS problems
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: false,
    });
  }

  /**
   * _getHeaders(skipAuth = false)
   * If skipAuth === true -> do not include Authorization header (login/refresh)
   */
  _getHeaders(skipAuth = false) {
    const lang = localStorage.getItem('lang') || 'ar';
    const headers = {
      Accept: 'application/json',
      'Accept-Language': lang,
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      // read access token from localStorage (changed from cookie)
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

  // unified request with refresh-token handling
  async _requestWithRefresh(method, url, data) {
    try {
      const skipAuth = SKIP_AUTH_URLS.includes(url);

      const config = {
        headers: this._getHeaders(skipAuth),
        validateStatus: () => true,
        // do not send cookies by default from frontend now (avoid CORS credential issues)
        withCredentials: false,
      };

      console.log(`[Crud] Request → ${method.toUpperCase()} ${url}`, { skipAuth, config, data });

      // call axios with proper shape (get => params; others => body)
      let res;
      if (method.toLowerCase() === 'get') {
        res = await this.client.get(url, { ...config, params: data?.params || {} });
      } else {
        res = await this.client[method](url, data, config);
      }

      console.log(`[Crud] Response ${res.status} ← ${url}`, res.data);

      // if unauthorized, try refresh (but don't retry if we're on the refresh endpoint)
      if (res.status === 401 && url !== API.AUTH?.REFRESH) {
        console.warn('[Crud] 401 detected → attempting token refresh');

        // try read refresh token from localStorage first, fallback to cookie
        const refresh_token = localStorage.getItem('refresh_token') || getCookie('refresh_token');
        console.log('[Crud] refresh_token present?', !!refresh_token);

        if (!refresh_token) {
          throw new ServerError('Refresh token missing');
        }

        // call refresh endpoint without Authorization and without credentials
        const refreshConfig = {
          headers: this._getHeaders(true),
          validateStatus: () => true,
          withCredentials: false,
        };

        console.log('[Crud] Calling refresh endpoint:', API.AUTH.REFRESH);
        const refreshRes = await this.client.post(API.AUTH.REFRESH, { refresh_token }, refreshConfig);

        console.log(`[Crud] Refresh response ${refreshRes.status}`, refreshRes.data);

        const newToken = refreshRes.data?.data?.access_token;
        if (!newToken) {
          throw new ServerError('Cannot refresh token', refreshRes.status, refreshRes.data);
        }

        // save new access token in localStorage (frontend-managed)
        localStorage.setItem('access_token', newToken);
        console.log('[Crud] New access token saved to localStorage');

        // retry original request with new Authorization header
        const retryConfig = {
          headers: this._getHeaders(false),
          validateStatus: () => true,
          withCredentials: false,
        };

        console.log('[Crud] Retrying original request after refresh...');
        let retryRes;
        if (method.toLowerCase() === 'get') {
          retryRes = await this.client.get(url, { ...retryConfig, params: data?.params || {} });
        } else {
          retryRes = await this.client[method](url, data, retryConfig);
        }

        console.log(`[Crud] Retry response ${retryRes.status} ← ${url}`, retryRes.data);
        return retryRes;
      }

      return res;
    } catch (err) {
      console.error('[Crud] Request error:', err);
      throw err;
    }
  }
}

const crud = new Crud();
export default crud;