// src/data/login/loginAPI.jsx
import crud from '../../services/crudInstance'; // تأكد المسار صحيح
import API from '../../api/api';
import ServerError from '../../utils/serverError';

const loginAPI = {
  async login(loginValue, password, role = '') {
    const payload = {
      login: loginValue,
      password: password,
      role,
    };

    console.log('[loginAPI] login called', { url: API.AUTH.LOGIN, payload });

    const res = await crud.postData(API.AUTH.LOGIN, payload);

    console.log('[loginAPI] raw result from crud.postData', res);

    if (!res || res.success === false) {
      // طباعة إضافية لتوضيح سبب الفشل
      console.error('[loginAPI] login failed response', res);
      throw new ServerError(res?.error?.message || 'Network or server error', res?.status ?? null, res?.error ?? null);
    }

    const body = res.data;
    console.log('[loginAPI] body', body);

    if (!body?.data) {
      console.error('[loginAPI] invalid body', body);
      throw new ServerError('Invalid server response', res.status, body);
    }

    const { user, token } = body.data;
    if (!user || !token) {
      console.error('[loginAPI] missing user or token', { user, token });
      throw new ServerError(body.message || 'Authentication failed', res.status, body);
    }

    // حفظ التوكن وبيانات المستخدم
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role || '');
    localStorage.setItem('user_id', String(user.id || ''));
    localStorage.setItem('user_name', `${user.first_name || ''} ${user.last_name || ''}`.trim());
    localStorage.setItem('user', JSON.stringify(user));

    // بعد الحفظ، حدّث هيدرز الـ crud
    crud.refreshToken();
    console.log('[loginAPI] token saved and crud.headers updated', token);

    return { success: true, user, token, message: body.message || body.status || 'Logged in' };
  },
};

export default loginAPI;
