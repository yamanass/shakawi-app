import axios from 'axios';
export default class Crud {
  constructor(options = {}) {
    // options: { baseURL, storageService }
    this.baseURL = options.baseURL || ''; // يمكن ضبط baseURL عند الإنشاء
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
      // لا نحدد Content-Type هنا لأن بعض الطلبات (multipart) تحتاجه تلقائياً من axios
      timeout: 30000,
    });

    // مختصر: interceptor طباعة الطلبات والأخطاء كما في الدارت
    this.client.interceptors.request.use((config) => {
      // console.log('[Crud] Request:', config.method, config.url, config.data);
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        // يمكنك تسجيل الأخطاء هنا
        // console.error('[Crud] Response error', error);
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
  }

  // استدعاء لتحديث التوكن في الهيدرز (مثل Token() عندك في Dart)
  refreshToken() {
    const token = this.storage.getToken ? this.storage.getToken() : null;
    if (token) this.headers.Authorization = `Bearer ${token}`;
    else delete this.headers.Authorization;
  }

  // GET basic (returns { success, status, data, raw })
  async getData(url) {
    try {
      this._initHeaders();
      const res = await this.client.get(url, { headers: this.headers });
      // مشابه للطريقة في دارت: تحقق status
      if (res.status === 200 || res.status === 201) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      // console.error('[Crud.getData] ', e);
      return { success: false, error: e };
    }
  }

  // GET image or binary
  async getImageWithToken(url) {
    try {
      this.refreshToken();
      const res = await this.client.get(url, {
        headers: this.headers,
        responseType: 'blob',
      });
      if (res.status === 200) {
        return { success: true, blob: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // POST JSON without default headers (simple)
  async postData(url, data) {
    try {
      const res = await this.client.post(url, data, {
        headers: { 'Content-Type': 'application/json', ...this.headers },
      });
      if ([200, 201, 422].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      }
      return { success: false, status: res.status, raw: res };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // POST with prepared headers and logging (like postDataWithHeaders)
  async postDataWithHeaders(url, data) {
    try {
      this._initHeaders();
      const reqHeaders = { 'Content-Type': 'application/json', ...this.headers };
      // debug logs
      // console.log('[Crud] POST', url, reqHeaders, data);
      const res = await this.client.post(url, data, { headers: reqHeaders });
      if ([200, 201, 422].includes(res.status)) {
        return { success: true, status: res.status, data: res.data, raw: res };
      } else if (res.status === 401) {
        return { success: false, status: 401, message: 'Unauthorized', raw: res };
      } else {
        return { success: false, status: res.status, raw: res };
      }
    } catch (e) {
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