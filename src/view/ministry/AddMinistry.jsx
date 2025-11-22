import React, { useState } from "react";
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud";
import API from "../../services/api";
import "./ministry.css";

export default function AddMinistry({ onClose, onAdded }) {
  const [ministryNameAr, setMinistryNameAr] = useState("");
  const [ministryNameEn, setMinistryNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [status, setStatus] = useState(true);

  const crud = new Crud({
    baseURL: API.BASE,         // 👈 استخدام الـ BASE فقط
    storageService: {
      getToken: () => localStorage.getItem("access_token"),
      getLang: () => "ar",
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

    console.log("Payload:", payload);

    try {
const res = await crud.post(API.MINISTRY.STORE, payload); // 👈 استخدام STORE بدل ADD أو undefined

      console.log("Created:", res.data);

      if (onAdded) onAdded();
      if (onClose) onClose();
    } catch (err) {
      console.error("Error creating ministry:", err);
    }
  };

  return (
    <Dialog title="إضافة وزارة جديدة" onClose={onClose}>
      <form className="ministry-form" onSubmit={handleSubmit}>
        
        <div className="form-field">
          <label>اسم الوزارة (عربي)</label>
          <input
            type="text"
            value={ministryNameAr}
            onChange={(e) => setMinistryNameAr(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>اسم الوزارة (إنجليزي)</label>
          <input
            type="text"
            value={ministryNameEn}
            onChange={(e) => setMinistryNameEn(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>الوصف (عربي)</label>
          <input
            type="text"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>الوصف (إنجليزي)</label>
          <input
            type="text"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>الاختصار</label>
          <input
            type="text"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>الحالة</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value === "true")}
          >
            <option value="true">نشطة</option>
            <option value="false">غير نشطة</option>
          </select>
        </div>

        <div className="dialog-buttons">
          <button className="submit-btn" type="submit">حفظ</button>
          <button className="cancel-btn" type="button" onClick={onClose}>إلغاء</button>
        </div>

      </form>
    </Dialog>
  );
}