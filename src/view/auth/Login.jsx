// src/view/auth/Login.jsx
import React, { Suspense, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import InputField from "../../components/common/InputField.jsx";
import AppButton from "../../components/common/AppButton.jsx";
import Card from "../../components/common/Card.jsx";
import "../../App.css";

import illustration from "../../assets/bb.png";
import loginAPI from "../../data/logindata.jsx";
import ServerError from "../../utils/ServerError.js";
import { validInput } from "../../utils/validation.js";
//import { useTranslation } from 'react-i18next';

const Login = () => {
  const VALIDATE = true;
  const navigate = useNavigate();
 //const { t, i18n } = useTranslation();
 const { t } = useTranslation();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ login: null, password: null });
  const [loading, setLoading] = useState(false);

  const prettyLog = (tag, obj) =>
    console.log(`[${tag}]`, JSON.parse(JSON.stringify(obj)));

  const validateField = (field, value) => {
    if (!VALIDATE) return null;
    if (field === "login") return validInput(value, 5, 100, "emailOrPhone");
    if (field === "password") return validInput(value, 6, 40, "password");
    return null;
  };

  const onLoginChange = (e) => {
    const v = e.target.value;
    setLoginValue(v);
    const err = validateField("login", v);
    setErrors((prev) => ({ ...prev, login: err }));
    prettyLog("onLoginChange", { value: v, error: err });
  };

  const onPasswordChange = (e) => {
    const v = e.target.value;
    setPassword(v);
    const err = validateField("password", v);
    setErrors((prev) => ({ ...prev, password: err }));
    prettyLog("onPasswordChange", { value: v, error: err });
  };

  const isFormValid = useMemo(() => {
    if (!VALIDATE) return loginValue.trim().length > 0 && password.trim().length > 0;
    return (
      !errors.login &&
      !errors.password &&
      loginValue.trim().length > 0 &&
      password.trim().length > 0
    );
  }, [errors, loginValue, password, VALIDATE]);

  const validateForm = () => {
    if (!VALIDATE) {
      if (!loginValue.trim() || !password.trim()) {
        setErrors({
          login: !loginValue.trim() ? "This field cannot be empty" : null,
          password: !password.trim() ? "This field cannot be empty" : null,
        });
        return false;
      }
      return true;
    }

    const errLogin = validateField("login", loginValue);
    const errPass = validateField("password", password);

    setErrors({ login: errLogin, password: errPass });

    return !errLogin && !errPass;
  };

  const handleLogin = async () => {
    if (!validateForm() || !isFormValid) return;

    setLoading(true);
    try {
      const result = await loginAPI.login(loginValue, password);
      prettyLog("UI.login.success", result);

      const role = result?.user?.role;

      if (["citizen", "admin", "secretary", "center admin", "ministry"].includes(role)) {
    navigate("/home", { replace: true });
} else {
    alert(`Unsupported role: ${role}`);
}

    } catch (e) {
      console.error("[UI.login.error]", e);
      const msg =
        e instanceof ServerError
          ? e.message
          : e?.response?.data?.message || e?.message || "An error occurred while logging in    ";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Card className="app-card">
        <div className="left-side">
          <img src={illustration} className="illustration" alt="" />
        </div>
        <div className="right-side">
          <div className="app-title">Complaint Platform</div>

          <InputField
            label={t('emailOrPhone')}
            type="text"
            value={loginValue}
            onChange={onLoginChange}
            placeholder={t('emailOrPhone')}
            error={errors.login}
            required={true}
          />

          <InputField
            label={t('password')}
            type="password"
            value={password}
            onChange={onPasswordChange}
            placeholder="Enter password"
            error={errors.password}
            required={true}
          />

          <AppButton
            title={loading ? "Logging in..." : "Log in"}
            className="login-button"
            onClick={handleLogin}
            disabled={!isFormValid || loading}
            width="100%"
            height="52px"
          />
        </div>
      </Card>
    </div>
  );
};

export default Login;
