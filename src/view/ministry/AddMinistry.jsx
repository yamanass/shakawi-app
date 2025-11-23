import React, { useState } from "react";
import { useTranslation } from "react-i18next"; 
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud";
import API from "../../services/api";
import "./ministry.css";

export default function AddMinistry({ onClose, onAdded }) {

  const { t, i18n } = useTranslation(); 

  const [ministryNameAr, setMinistryNameAr] = useState("");
  const [ministryNameEn, setMinistryNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [status, setStatus] = useState(true);

  const crud = new Crud({
    baseURL: API.BASE,
    storageService: {
      getToken: () => localStorage.getItem("access_token"),
      getLang: () => i18n.language,  // 👈 أهم شي: خلي اللغة تشبه لغة i18n
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      abbreviation: abbreviation,
      translations: {
        ar: {
          name: ministryNameAr,
          description: descriptionAr,
        },
        en: {
          name: ministryNameEn,
          description: descriptionEn,
        },
      },
      status: status,
    };

    try {
await crud.post(API.MINISTRY.STORE, payload);

      if (onAdded) onAdded();
      if (onClose) onClose();
    } catch (err) {
      console.error("Error creating ministry:", err);
    }
  };

  return (
    <Dialog title={t("addMinistry")} onClose={onClose}>
      <form className="ministry-form" onSubmit={handleSubmit}>

        <div className="form-field">
          <label>{t("ministryNameAr")}</label>
          <input
            type="text"
            value={ministryNameAr}
            onChange={(e) => setMinistryNameAr(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>{t("ministryNameEn")}</label>
          <input
            type="text"
            value={ministryNameEn}
            onChange={(e) => setMinistryNameEn(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>{t("descriptionAr")}</label>
          <input
            type="text"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>{t("descriptionEn")}</label>
          <input
            type="text"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>{t("abbreviation")}</label>
          <input
            type="text"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>{t("status")}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value === "true")}
          >
            <option value="true">{t("active")}</option>
            <option value="false">{t("inactive")}</option>
          </select>
        </div>

        <div className="dialog-buttons">
          <button className="submit-btn" type="submit">{t("save")}</button>
          <button className="cancel-btn" type="button" onClick={onClose}>
            {t("cancel")}
          </button>
        </div>

      </form>
    </Dialog>
  );
}
