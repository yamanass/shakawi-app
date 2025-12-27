// src/data/logindata.jsx (أو المسار الذي تستخدمه)
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

  // --- NEW: store ministry & branch info (best-effort using fallbacks) ---
  try {
    // possible shapes: user.more_info.ministry_branch_id, user.more_info.ministry.ministry_branch_id, user.employee_id links to employee record, etc.
    const ministryId =
      user?.more_info?.ministry?.id ||
      user?.more_info?.ministry_id ||
      user?.ministry?.id ||
      user?.ministry_id ||
      null;

    const ministryBranchId =
      user?.more_info?.ministry_branch_id ||
      user?.more_info?.ministry_branch?.id ||
      user?.ministry_branch_id ||
      user?.ministry_branch?.id ||
      null;

    // store as strings (or empty string if null) so code reading is simple
    if (ministryId) localStorage.setItem('ministry_id', String(ministryId));
    else localStorage.removeItem('ministry_id');

    if (ministryBranchId) localStorage.setItem('ministry_branch_id', String(ministryBranchId));
    else localStorage.removeItem('ministry_branch_id');

    // store ministry object (optional) so UI can read name quickly
    const ministryObj = user?.more_info?.ministry || user?.ministry || null;
    if (ministryObj) localStorage.setItem('ministry', JSON.stringify(ministryObj));
    else localStorage.removeItem('ministry');

    console.log('[loginAPI] saved tokens, user, ministry & branch to localStorage');
  } catch (e) {
    console.warn('[loginAPI] could not persist ministry/branch to localStorage', e);
  }

  return { user, accessToken, refreshToken, message: body.message || body.status || 'Logged in' };
};

export default { login };
