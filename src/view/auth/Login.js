// src/pages/Login.jsx
import React, { useState } from 'react';
import InputField from '../components/InputField';
import AppButton from '../components/AppButton';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // هنا تضيف منطق تسجيل الدخول: مثلاً إرسال API
    console.log("Login with", { email, password });
  };

  return (
    <div className="login-container">
      <h2>تسجيل الدخول</h2>
      <form onSubmit={handleLogin} className="login-form">
        <InputField
          label="البريد الإلكتروني"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@example.com"
        />

        <InputField
          label="كلمة المرور"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <AppButton
          title="دخول"
          type="submit"
          disabled={!(email && password)}
        />
      </form>
    </div>
  );
};

export default Login;
