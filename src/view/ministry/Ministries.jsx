import React, { useEffect, useState, useCallback, useMemo } from "react";
import AddMinistry from "./AddMinistry";
import AddBranch from "./AddBranch";
import Dialog from "../../components/common/Dialog";
import Crud from "../../services/Crud.js";
import API from "../../services/api.js";
import "./ministry.css";

export default function Ministries() {
  const [ministries, setMinistries] = useState([]);
  const [showAddMinistry, setShowAddMinistry] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // إنشاء Crud مرة واحدة فقط
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
      <h2 className="page-title">الوزارات</h2>

      <div className="buttons-container">
        <button className="add-btn" onClick={() => setShowAddMinistry(true)}>
          إضافة وزارة جديدة
        </button>

        <button className="add-btn" onClick={() => setShowAddBranch(true)}>
          إضافة فرع للوزارة
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
              <p className="description">{min.description || "لا يوجد وصف"}</p>
              <p className="branches-count">عدد الفروع: {min.branches.length}</p>
            </div>
          ))
        ) : (
          <p className="loading">جاري تحميل البيانات...</p>
        )}
      </div>

      {/* Dialog تفاصيل الوزارة */}
      {selectedMinistry && (
        <Dialog
          title={`تفاصيل ${selectedMinistry.name}`}
          onClose={() => setSelectedMinistry(null)}
        >
          <p><strong>الاختصار:</strong> {selectedMinistry.abbreviation}</p>
          <p><strong>الوصف:</strong> {selectedMinistry.description || "لا يوجد وصف"}</p>

          <h4>الفروع:</h4>
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {selectedMinistry.branches.length > 0 ? (
              selectedMinistry.branches.map((branch) => (
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
                      fontSize: "18px"
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
      )}

      {/* Dialog تفاصيل الفرع */}
      {selectedBranch && (
        <Dialog
          title={`تفاصيل الفرع`}
          onClose={handleCloseBranch}
        >
          <p><strong>رقم الفرع:</strong> {selectedBranch.id}</p>
          <p><strong>المحافظة:</strong> {selectedBranch.governorate?.name || "غير محدد"}</p>
          <p><strong>مدير الفرع:</strong> {selectedBranch.manager_id || "غير محدد"}</p>
          <p><strong>تاريخ الإنشاء:</strong> {new Date(selectedBranch.created_at).toLocaleString()}</p>
        </Dialog>
      )}
    </div>
  );
}