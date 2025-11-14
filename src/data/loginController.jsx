// src/data/login/loginController.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loginAPI from './loginAPI';
import ServerError from './serverError';

export default function useLoginController() {
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [error, setError] = useState(null);

  const validate = () => {
    if (!loginValue?.trim() || !password?.trim()) {
      setError('الرجاء تعبئة جميع الحقول');
      return false;
    }
    return true;
  };

  const login = async () => {
    if (!validate()) return;
    setStatus('loading');
    setError(null);

    try {
      const resp = await loginAPI.login(loginValue, password);
      setStatus('success');

      const role = resp.user?.role || localStorage.getItem('role') || '';
      switch (role) {
        case 'secretary':
          navigate('/secretary', { replace: true });
          break;
        case 'super_admin':
          navigate('/super-admin', { replace: true });
          break;
        case 'center_admin':
          navigate('/center-admin', { replace: true });
          break;
        case 'citizen':
          navigate('/home', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
          break;
      }
    } catch (e) {
      setStatus('error');
      if (e instanceof ServerError) setError(e.message);
      else if (e?.response?.data?.message) setError(e.response.data.message);
      else setError(e?.message || 'حدث خطأ غير متوقع');
    }
  };

  return {
    loginValue,
    setLoginValue,
    password,
    setPassword,
    status,
    error,
    login,
  };
}
