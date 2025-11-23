import React, { useState } from "react";
import Dialog from "../../components/common/Dialog";
import { useTranslation } from "react-i18next";

export default function MinistryDetails({ ministry, onClose }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const { t } = useTranslation();

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
  };

  const handleCloseBranch = () => {
    setSelectedBranch(null);
  };

  return (
    <>
      <Dialog title={`${t("ministryDetails")} ${ministry.name}`} onClose={onClose}>
        <p><strong>{t("abbreviation")}:</strong> {ministry.abbreviation}</p>
        <p><strong>{t("description")}:</strong> {ministry.description || t("noDescription")}</p>

        <h4>{t("branches")}:</h4>
        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
          {ministry.branches.length > 0 ? (
            ministry.branches.map((branch) => (
              <li
                key={branch.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0"
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
            <li>{t("noBranches")}</li>
          )}
        </ul>
      </Dialog>

      {selectedBranch && (
        <Dialog title={t("branchDetails")} onClose={handleCloseBranch}>
          <p><strong>{t("branchNumber")}:</strong> {selectedBranch.id}</p>
          <p><strong>{t("governorate")}:</strong> {selectedBranch.governorate?.name || t("undefined")}</p>
          <p><strong>{t("branchManager")}:</strong> {selectedBranch.manager_id || t("undefined")}</p>
          <p><strong>{t("creationDate")}:</strong> {new Date(selectedBranch.created_at).toLocaleString()}</p>
        </Dialog>
      )}
    </>
  );
}
