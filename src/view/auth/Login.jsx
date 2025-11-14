import React, { useState } from "react";
import InputField from "../../components/common/InputField.jsx";
import AppButton from "../../components/common/AppButton.jsx";
import Card from "../../components/common/Card.jsx";
import axios from "axios";
import '../../App.css';
import illustration from '../../assets/bb.png';

const DEBUG_TOKEN = "1|zFGvJIe34xi7NhobOyQSJJ2m5GSGWO5RiwGL0HDnaf5f110f";
const LOGIN_URL = "http://127.0.0.1:8000/api/login";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const prettyLog = (tag, obj) => console.log(`[${tag}]`, JSON.parse(JSON.stringify(obj)));

  const sendRequest = async (payload, headers) => {
    // validateStatus:true => axios لا يرمي استثناء على حالة status غير 2xx، نقدر نفحص الرد
    const cfg = {
      headers,
      timeout: 30000,
      validateStatus: () => true,
    };
    prettyLog("axios.request", { url: LOGIN_URL, payload, headers: cfg.headers });
    try {
      const res = await axios.post(LOGIN_URL, payload, cfg);
      // طباعة كاملة للرد
      prettyLog("axios.response", {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data,
      });
      return { ok: true, res };
    } catch (err) {
      // خطأ شبكة حقيقي أو timeout
      console.error("[axios.error] network or unexpected error:", err);
      return { ok: false, err };
    }
  };

  const handleLogin = async () => {
    prettyLog("Login.clicked (inputs)", { login: email, password });

    if (!email.trim() || !password.trim()) {
      alert("الرجاء تعبئة جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      const payload = { login: email, password: password }; // **مفتاح login صحيح**
      prettyLog("Payload", payload);

      // 1) محاولة الإرسال مع الـ Authorization header (حسب طلبك)
      const headersWithAuth = {
        Authorization: `Bearer ${DEBUG_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      const attempt1 = await sendRequest(payload, headersWithAuth);

      if (!attempt1.ok) {
        // خطأ شبكة — نطبع وننهي
        console.error("[Login] Attempt1 network error:", attempt1.err);
        alert("خطأ شبكة أثناء محاولة الاتصال. راجع الكونسول (network).");
        return;
      }

      const r1 = attempt1.res;
      // لو السيرفر رد بـ 200 ونوع البيانات متوقع — نعالج وننتهي
      if (r1.status === 200 && r1.data && r1.data.data && r1.data.data.token) {
        prettyLog("Login.success (with auth)", r1.data);
        const { token, user } = r1.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        alert("تم تسجيل الدخول بنجاح (attempt with auth)!");
        return;
      }

      // لو الرد ليس 200 أو لا يحتوي token — نطبع السبب ثم نجرب الإرسال بدون Authorization للتأكد
      console.warn("[Login] Attempt1 returned non-200 or missing token", {
        status: r1.status,
        data: r1.data,
      });

      // 2) حاول من غير Authorization header (بعض السيرفرات ترفض header أثناء login — اختبار مهم)
      const headersNoAuth = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const attempt2 = await sendRequest(payload, headersNoAuth);

      if (!attempt2.ok) {
        console.error("[Login] Attempt2 network error:", attempt2.err);
        alert("خطأ شبكة أثناء محاولة الاتصال (attempt2). راجع الكونسول.");
        return;
      }

      const r2 = attempt2.res;
      if (r2.status === 200 && r2.data && r2.data.data && r2.data.data.token) {
        prettyLog("Login.success (no auth)", r2.data);
        const { token, user } = r2.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        alert("تم تسجيل الدخول بنجاح (attempt without auth)!");
        return;
      }

      // إذا وصلنا لهنا، رد السيرفر غير متوقع — نطبع تفاصيل ونبلغ المستخدم
      console.error("[Login] Both attempts failed. Details:", {
        attempt1: { status: attempt1.res?.status, data: attempt1.res?.data },
        attempt2: { status: attempt2.res?.status, data: attempt2.res?.data },
      });
      alert(`فشل تسجيل الدخول. راجع الكونسول للخطأ (status: ${attempt1.res?.status || attempt2.res?.status})`);

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
          <div className="app-title">منصة الشكاوي</div>

          <InputField
            label="البريد الإلكتروني أو رقم الموبايل"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="أدخل البريد أو الموبايل"
          />

          <InputField
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="أدخل كلمة المرور"
          />

          <AppButton
            title={loading ? "جاري الدخول..." : "تسجيل الدخول"}
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          />
        </div>
      </Card>
    </div>
  );
};

export default Login;
