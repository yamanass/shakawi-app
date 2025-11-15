// src/view/auth/Login.jsx
import React, { useState, useMemo } from "react";
import InputField from "../../components/common/InputField.jsx";
import AppButton from "../../components/common/AppButton.jsx";
import Card from "../../components/common/Card.jsx";
import '../../App.css';
import illustration from '../../assets/bb.png';
// src/view/auth/Login.jsx
import loginAPI from '../../data/logindata.jsx';
import ServerError from '../../utils/ServerError.js';
   // <-- default import (NOT { ServerError })
import { validInput } from '../../utils/validation.js';

import DropdownSelect from '../../components/common/DropdownSelect.jsx';
const Login = () => {
  const VALIDATE = true;
const [selectedPermission, setSelectedPermission] = useState("");
const permissionOptions = [
  "ministry.create",
  "ministry.read",
  "ministry.update",
  "ministry.delete",
  "branch.create",
  "branch.read",
  "branch.update",
  "branch.delete",
  "employee.create",
  "employee.read",
  "employee.update",
  "employee.delete",
];

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    login: null,
    password: null,
  });

  const [loading, setLoading] = useState(false);

  const prettyLog = (tag, obj) =>
    console.log(`[${tag}]`, JSON.parse(JSON.stringify(obj)));

  const validateField = (field, value) => {
    if (!VALIDATE) return null;
    if (field === "login") {
      return validInput(value, 5, 100, "emailOrPhone");
    }
    if (field === "password") {
      return validInput(value, 6, 40, "password");
    }
    return null;
  };

  // live handlers
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

  // compute form validity (used to disable button)
  const isFormValid = useMemo(() => {
    if (!VALIDATE) {
      return loginValue.trim().length > 0 && password.trim().length > 0;
    }
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
    prettyLog("UI.submit", { loginValue, password, errors });

    if (!validateForm()) {
      prettyLog("UI.validation.failed", { loginValue, password, errors });
      return;
    }

    if (!isFormValid) {
      console.warn("Form not valid - stopping submit", { errors, loginValue, password });
      return;
    }

    setLoading(true);
    try {
      const result = await loginAPI.login(loginValue, password);
      prettyLog("UI.login.success", result);
      alert("Login successful");
    } catch (e) {
      console.error("[UI.login.error]", e);
      if (e instanceof ServerError) {
        alert(e.message || "Server error");
      } else {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "An unexpected error occurred";
        alert(msg);
      }
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
            label="Email or Phone"
            type="text"
            value={loginValue}
            onChange={onLoginChange}
            placeholder="Enter email or phone"
            error={errors.login}
            required={true}
          />
<DropdownSelect
  label="Role"
  options={permissionOptions}
  value={selectedPermission}
  onChange={(val) => setSelectedPermission(val)}
  placeholder="Select a permission..."
  maxWidth="300px"        // <-- تحدد هنا أقصى عرض
  className="dropdown-compact" // <-- أو تضيف كلاس compact
/>
          <InputField
            label="Password"
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
