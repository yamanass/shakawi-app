import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next"; 
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud";
import API from "../../services/api";

const AddBranch = ({ onClose, onAdded }) => {
  const { t, i18n } = useTranslation();

  const [branchNameAr, setBranchNameAr] = useState("");
  const [branchNameEn, setBranchNameEn] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); 
  const [messageType, setMessageType] = useState("success"); 

  const crud = new Crud({
    baseURL: API.BASE,
    storageService: {
      getToken: () => localStorage.getItem("access_token"),
      getLang: () => i18n.language,
    },
  });

  useEffect(() => {
    crud.get(API.MINISTRY.READ)
      .then((res) => setMinistries(res.data.data))
      .catch(console.error);
  }, []);

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

      setMessage(t("branchAdded", { name: branchNameAr }));
      setMessageType("success");

      if (onAdded) onAdded();
      setBranchNameAr("");
      setBranchNameEn("");
      setSelectedMinistry("");
      setSelectedGovernorate("");

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("خطأ عند إضافة الفرع:", err);
      setMessage(t("branchAddError"));
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog title={t("addBranch")} onClose={onClose}>
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
          <label>{t("selectMinistry")}:</label>
          <select
            value={selectedMinistry}
            onChange={(e) => setSelectedMinistry(e.target.value)}
            required
          >
            <option value="">{t("selectMinistry")}</option>
            {ministries.map((min) => (
              <option key={min.id} value={min.id}>
                {min.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>{t("branchNameAr")}:</label>
          <input
            type="text"
            value={branchNameAr}
            onChange={(e) => setBranchNameAr(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>{t("branchNameEn")}:</label>
          <input
            type="text"
            value={branchNameEn}
            onChange={(e) => setBranchNameEn(e.target.value)}
            placeholder={t("branchNameEnPlaceholder")}
          />
        </div>

        <div className="form-field">
          <label>{t("selectGovernorate")}:</label>
          <select
            value={selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            required
          >
            <option value="">{t("selectGovernorate")}</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dialog-buttons">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? t("loading") : t("addBranch")}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            {t("cancel")}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default AddBranch;
