import React, { useState } from "react";
import Dialog from "../../components/common/Dialog";

export default function MinistryDetails({ ministry, onClose }) {
  const [selectedBranch, setSelectedBranch] = useState(null);

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
  };

  const handleCloseBranch = () => {
    setSelectedBranch(null);
  };

  return (
    <>
      <Dialog title={`تفاصيل ${ministry.name}`} onClose={onClose}>
        <p><strong>الاختصار:</strong> {ministry.abbreviation}</p>
        <p><strong>الوصف:</strong> {ministry.description || "لا يوجد وصف"}</p>

        <h4>الفروع:</h4>
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
                  {branch.name} - {branch.governorate?.name || "غير محدد"}
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
  title="عرض تفاصيل الفرع"
>
  👁️
</button>

              </li>
            ))
          ) : (
            <li>لا يوجد فروع</li>
          )}
        </ul>
      </Dialog>

      {selectedBranch && (
        <Dialog title={`تفاصيل الفرع`} onClose={handleCloseBranch}>
          <p><strong>رقم الفرع:</strong> {selectedBranch.id}</p>
          <p><strong>المحافظة:</strong> {selectedBranch.governorate?.name || "غير محدد"}</p>
          <p><strong>مدير الفرع:</strong> {selectedBranch.manager_id || "غير محدد"}</p>
          <p><strong>تاريخ الإنشاء:</strong> {new Date(selectedBranch.created_at).toLocaleString()}</p>
        </Dialog>
      )}
    </>
  );
}