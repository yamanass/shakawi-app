import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";   // ← أضفناها
import AddMinistry from "./AddMinistry";
import AddBranch from "./AddBranch";
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud.js";
import API from "../../services/api.js";
import "./ministry.css";

export default function Ministries() {

  const { t } = useTranslation();   // ← أضفناها

  const [ministries, setMinistries] = useState([]);
  const [showAddMinistry, setShowAddMinistry] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const crud = useMemo(() => {
    return new Crud({
      baseURL: API.BASE,
      storageService: {
        getToken: () => localStorage.getItem("access_token"),
        getLang: () => "ar",
      },
    });
  }, []);

  const fetchMinistries = useCallback(async () => {
    try {
      const res = await crud.get(API.MINISTRY.READ);
      if (res.data && Array.isArray(res.data.data)) {
        setMinistries(res.data.data);
      } else {
        setMinistries([]);
      }
    } catch (err) {
      console.error("Error fetching ministries:", err);
    }
  }, [crud]);

  useEffect(() => {
    fetchMinistries();
  }, [fetchMinistries]);

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
  };

  const handleCloseBranch = () => {
    setSelectedBranch(null);
  };

  return (
    <div className="ministries-container">

      <h2 className="page-title">{t("ministries")}</h2>

      <div className="buttons-container">
        <button className="add-btn" onClick={() => setShowAddMinistry(true)}>
          {t("addMinistry")}
        </button>

        <button className="add-btn" onClick={() => setShowAddBranch(true)}>
          {t("addBranch")}
        </button>
      </div>

      {showAddMinistry && (
        <AddMinistry
          onAdded={fetchMinistries}
          onClose={() => setShowAddMinistry(false)}
        />
      )}

      {showAddBranch && (
        <AddBranch
          ministryId={ministries[0]?.id}
          onAdded={fetchMinistries}
          onClose={() => setShowAddBranch(false)}
        />
      )}

      <div className="ministries-cards">
        {ministries.length > 0 ? (
          ministries.map((min) => (
            <div
              className="ministry-card"
              key={min.id}
              title={min.description}
              onClick={() => setSelectedMinistry(min)}
              style={{ cursor: "pointer" }}
            >
              <h3 className="min-title">{min.name}</h3>
              <p className="abbreviation">{min.abbreviation}</p>
              <p className="description">
                {min.description || t("noDescription")}
              </p>
              <p className="branches-count">
                {t("branchesCount")}: {min.branches.length}
              </p>
            </div>
          ))
        ) : (
          <p className="loading">{t("loadingData")}...</p>
        )}
      </div>

      {selectedMinistry && (
        <Dialog
          title={`${t("ministryDetails")} ${selectedMinistry.name}`}
          onClose={() => setSelectedMinistry(null)}
        >
          <p><strong>{t("abbreviation")}:</strong> {selectedMinistry.abbreviation}</p>
          <p><strong>{t("description")}:</strong> {selectedMinistry.description || t("noDescription")}</p>

          <h4>{t("branchesCount")}:</h4>

          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {selectedMinistry.branches.length > 0 ? (
              selectedMinistry.branches.map((branch) => (
                <li
                  key={branch.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 0",
                  }}
                >
                  <span>
                    {branch.name} - {branch.governorate?.name || t("undefined")}
                  </span>

                  <button
                    onClick={() => handleBranchClick(branch)}
                    style={{
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      color: "#0ea5e9",
                      fontSize: "18px",
                    }}
                    title={t("branchDetails")}
                  >
                    👁️
                  </button>
                </li>
              ))
            ) : (
              <li>{t("noDescription")}</li>
            )}
          </ul>
        </Dialog>
      )}

      {selectedBranch && (
        <Dialog title={t("branchDetails")} onClose={handleCloseBranch}>
          <p><strong>{t("branchNumber")}:</strong> {selectedBranch.id}</p>
          <p><strong>{t("governorate")}:</strong> {selectedBranch.governorate?.name || t("undefined")}</p>
          <p><strong>{t("branchManager")}:</strong> {selectedBranch.manager_id || t("undefined")}</p>
          <p><strong>{t("creationDate")}:</strong> {new Date(selectedBranch.created_at).toLocaleString()}</p>
        </Dialog>
      )}
    </div>
  );
}
