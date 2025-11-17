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

  // adapt to your backend shape:
  // previous shape: data.tokens.access_token, refresh_token
  const accessToken = data?.tokens?.access_token || data?.accessToken || null;
  const refreshToken = data?.tokens?.refresh_token || data?.refreshToken || null;
  const user = data?.user || data?.userData || null;

  if (!accessToken || !refreshToken) {
    throw new ServerError('Invalid server response: tokens missing', res.status, body);
  }

  // store access & refresh tokens in localStorage (to avoid cookie CORS issues)
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);

  // store user info & role
  localStorage.setItem('role', user?.role || '');
  localStorage.setItem('user_id', String(user?.id || ''));
  localStorage.setItem('user', JSON.stringify(user));

  console.log('[loginAPI] saved tokens and user to localStorage');

  return { user, accessToken, refreshToken, message: body.message || body.status || 'Logged in' };
};

export default { login };
