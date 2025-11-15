// src/data/logindata.jsx
import crud from '../services/crudInstance.js';
import API from '../services/api.js';
import ServerError from '../utils/ServerError.js';

const login = async (loginValue, password) => {
  const payload = { login: loginValue, password };

  const res = await crud.post(API.AUTH.LOGIN, payload);

  if (!res || res.success === false) {
    const msg = res?.data?.message || res?.error?.message || 'Network or server error';
    throw new ServerError(msg, res?.status ?? null, res);
  }

  const body = res.data;
  const data = body.data;

  const accessToken = data?.tokens?.access_token;
  const refreshToken = data?.tokens?.refresh_token;
  const user = data?.user;

  if (!accessToken || !refreshToken) {
    throw new ServerError('Invalid server response: tokens missing', res.status, body);
  }

  // تخزين التوكن في الكوكيز
  document.cookie = `access_token=${accessToken}; path=/; secure; samesite=strict; max-age=${60*15}`; // 15 دقيقة
  document.cookie = `refresh_token=${refreshToken}; path=/; secure; samesite=strict; max-age=${60*60*24*7}`; // أسبوع

  // تخزين بيانات المستخدم
  localStorage.setItem('role', user?.role || '');
  localStorage.setItem('user_id', String(user?.id || ''));
  localStorage.setItem('user', JSON.stringify(user));

  return { user, accessToken, refreshToken, message: body.message || body.status || 'Logged in' };
};

export default { login };
