// src/services/Crud.js
import axios from 'axios';
export default class Crud {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.storage = options.storageService || {
      getToken: () => localStorage.getItem('token'),
      getLang: () => localStorage.getItem('lang') || 'en',
    };

    this._initClient();
    this._initHeaders();
  }

  _initClient() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Request interceptor — نطبع الطلبات
    this.client.interceptors.request.use((config) => {
      // طباعة للتتبّع
      console.log('[Crud] Request ->', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
      });
      return config;
    }, (error) => {
      console.error('[Crud] Request error ->', error);
      return Promise.reject(error);
    });

    // Response interceptor — نطبع الاستجابات والأخطاء
    this.client.interceptors.response.use(
      (res) => {
        console.log('[Crud] Response <-', {
          url: res.config?.url,
          status: res.status,
          data: res.data,
        });
        return res;
      },
      (error) => {
        // إذا في response من السيرفر نطبعها مفصلاً
        if (error.response) {
          console.error('[Crud] Response error <-', {
            url: error.response.config?.url,
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else {
          console.error('[Crud] Network / Axios error <-', error.message, error);
        }
        return Promise.reject(error);
      }
    );
  }

  _initHeaders() {
    const lang = this.storage.getLang ? this.storage.getLang() : 'en';
    this.headers = {
      Accept: 'application/json',
      'Accept-Language': lang,
    };

    const token = this.storage.getToken ? this.storage.getToken() : null;
    if (token) this.headers.Authorization = `Bearer ${token}`;
    else delete this.headers.Authorization;
  }

  // refreshToken: يبقي الهيدرز مبّعلّمة بأحدث توكن
  refreshToken() {
    const token = this.storage.getToken ? this.storage.getToken() : null;
    if (token) this.headers.Authorization = `Bearer ${token}`;
    else delete this.headers.Authorization;
  }

  async getData(url) {
    try {
      this._initHeaders();
      const res = await this.client.get(url, { headers: this.headers });
      if (res.status === 200 || res.status === 201) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // ======= هنا أصلحت: استدعاء _initHeaders() قبل الإرسال + طباعة =======
  async postData(url, data) {
    try {
      // تحديث الهيدرز بحيث يلتقط أحدث توكن من localStorage
      this._initHeaders();

      console.log('[Crud] postData called', { url, data, headers: this.headers });

      const res = await this.client.post(url, data, {
        headers: { 'Content-Type': 'application/json', ...this.headers },
      });

      if ([200, 201, 422].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      // طباعة الخطأ بالتفصيل
      if (e.response) {
        console.error('[Crud.postData] Error response:', {
          url,
          status: e.response.status,
          data: e.response.data,
        });
        return { success: false, error: e, status: e.response.status, data: e.response.data };
      } else {
        console.error('[Crud.postData] Network/Error:', e.message, e);
        return { success: false, error: e };
      }
    }
  }

  async postDataWithHeaders(url, data) {
    try {
      this._initHeaders();
      const reqHeaders = { 'Content-Type': 'application/json', ...this.headers };
      console.log('[Crud] postDataWithHeaders', { url, data, headers: reqHeaders });
      const res = await this.client.post(url, data, { headers: reqHeaders });
      if ([200, 201, 422].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      } else if (res.status === 401) {
        return { success: false, status: 401, message: 'Unauthorized', raw: res };
      } else {
        return { success: false, status: res.status, raw: res };
      }
    } catch (e) {
      if (e.response) {
        console.error('[Crud.postDataWithHeaders] Error response:', e.response.status, e.response.data);
        return { success: false, error: e, status: e.response.status, data: e.response.data };
      }
      console.error('[Crud.postDataWithHeaders] Network/Error:', e.message, e);
      return { success: false, error: e };
    }
  }

  // POST file + data (single file). fileInput can be a File object or Blob
  async postFileAndData(url, data = {}, fileField, fileInput, fileName) {
    try {
      this.refreshToken();
      const form = new FormData();

      // fields
      Object.keys(data || {}).forEach((k) => {
        // if value is array encode as JSON (like in your Dart)
        const v = data[k];
        if (Array.isArray(v)) form.append(k, JSON.stringify(v));
        else form.append(k, v);
      });

      // file
      form.append(fileField, fileInput, fileName || (fileInput.name || 'file'));

      const res = await this.client.post(url, form, {
        headers: { ...this.headers, 'Content-Type': 'multipart/form-data' },
      });

      if ([200, 201, 422].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // POST multiple images and files
  async postMultipleImagesAndData(url, data = {}, images = [], files = [], fileNamePrefix = 'file') {
    try {
      this.refreshToken();
      const form = new FormData();

      // append files array (files param expected to be array of File objects)
      files.forEach((f, i) => {
        form.append(`${fileNamePrefix}[${i}]`, f, f.name || `file_${i}`);
      });

      // append images array
      images.forEach((img, i) => {
        form.append(`images[${i}]`, img, img.name || `image_${i}`);
      });

      // append fields
      Object.keys(data || {}).forEach((k) => {
        const v = data[k];
        if (Array.isArray(v)) form.append(k, JSON.stringify(v));
        else form.append(k, v);
      });

      const res = await this.client.post(url, form, {
        headers: { ...this.headers, 'Content-Type': 'multipart/form-data' },
      });

      if ([200, 201, 422].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // PUT (json)
  async putData(url, data) {
    try {
      this.refreshToken();
      const res = await this.client.put(url, data, {
        headers: { 'Content-Type': 'application/json', ...this.headers },
      });
      if ([200, 201].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // DELETE
  async deleteData(url) {
    try {
      this.refreshToken();
      const res = await this.client.delete(url, { headers: this.headers });
      if ([200, 201, 400, 401, 422, 500].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }
}