import crud from '../services/crudInstance.js';
import API from '../services/api.js';
import ServerError from '../utils/ServerError.js';



const logindata = async (loginValue, password) => {
  console.log('[loginAPI] called with:', { login: loginValue, password });

  const payload = { login: loginValue, password };
  console.log('[loginAPI] payload:', payload);

  // حاول الإرسال مباشرة (crud.post يطبع الهيدرز والـ response)
  const res = await crud.post(API.AUTH.LOGIN, payload);

  console.log('[loginAPI] crud.post returned:', res);

  if (!res || res.success === false) {
    // حالة فشل (شبكة أو رد غير متوقع)
    const msg = res?.data?.message || res?.error?.message || 'Network or server error';
    console.error('[loginAPI] failed:', msg, res);
    throw new ServerError(msg, res?.status ?? null, res);
  }

  const body = res.data;
  if (!body || !body.data || !body.data.token) {
    console.error('[loginAPI] invalid body:', body);
    throw new ServerError('Invalid server response', res.status, body);
  }

  const { token, user } = body.data;
  // حفظ البيانات مثل Flutter box
  localStorage.setItem('token', token);
  localStorage.setItem('role', user?.role || '');
  localStorage.setItem('user_id', String(user?.id || ''));
  localStorage.setItem('user', JSON.stringify(user));

  console.log('[loginAPI] saved token and user to localStorage');

  return { user, token, message: body.message || body.status || 'Logged in' };
};

export default { login: logindata };
