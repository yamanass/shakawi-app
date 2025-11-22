import React, { useState, useEffect } from "react";
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud";
import API from "../../services/api";

const AddBranch = ({ onClose, onAdded }) => {
  const [branchNameAr, setBranchNameAr] = useState("");
  const [branchNameEn, setBranchNameEn] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // رسالة النجاح/الخطأ
  const [messageType, setMessageType] = useState("success"); // "success" أو "error"

  const crud = new Crud({
    baseURL: API.BASE,
    storageService: {
      getToken: () => localStorage.getItem("access_token"),
      getLang: () => "ar",
    },
  });

  // جلب الوزارات
  useEffect(() => {
    crud.get(API.MINISTRY.READ)
      .then((res) => setMinistries(res.data.data))
      .catch(console.error);
  }, []);

  // جلب المحافظات
  useEffect(() => {
    crud.get(API.GOVERNORATE.READ)
      .then((res) => setGovernorates(res.data.data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMinistry || !selectedGovernorate || !branchNameAr) return;

    const payload = {
      ministry_id: parseInt(selectedMinistry),
      governorate_id: parseInt(selectedGovernorate),
      translations: {
        ar: { name: branchNameAr },
        en: { name: branchNameEn || branchNameAr },
      },
    };

    try {
      setLoading(true);
      await crud.post("/ministry/branch/store", payload);

      setMessage(`تم إضافة الفرع "${branchNameAr}" بنجاح!`);
      setMessageType("success");

      if (onAdded) onAdded();
      setBranchNameAr("");
      setBranchNameEn("");
      setSelectedMinistry("");
      setSelectedGovernorate("");

      // الرسالة تختفي بعد 3 ثواني
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("خطأ عند إضافة الفرع:", err);
      setMessage("حدث خطأ أثناء الإضافة. حاول مرة أخرى.");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog title="إضافة فرع جديد" onClose={onClose}>
      {/* رسالة النجاح / الخطأ تظهر فوق الفورم */}
      {message && (
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: messageType === "success" ? "#4CAF50" : "#f44336",
            color: "white",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}

      <form className="ministry-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>اختر الوزارة:</label>
          <select
            value={selectedMinistry}
            onChange={(e) => setSelectedMinistry(e.target.value)}
            required
          >
            <option value="">اختر الوزارة</option>
            {ministries.map((min) => (
              <option key={min.id} value={min.id}>
                {min.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>اسم الفرع بالعربي:</label>
          <input
            type="text"
            value={branchNameAr}
            onChange={(e) => setBranchNameAr(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>اسم الفرع بالإنجليزية:</label>
          <input
            type="text"
            value={branchNameEn}
            onChange={(e) => setBranchNameEn(e.target.value)}
            placeholder="يمكن تركه فارغ لاستخدام الاسم بالعربي"
          />
        </div>

        <div className="form-field">
          <label>اختر المحافظة:</label>
          <select
            value={selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            required
          >
            <option value="">اختر المحافظة</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dialog-buttons">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "جاري الإضافة..." : "إضافة فرع"}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default AddBranch;