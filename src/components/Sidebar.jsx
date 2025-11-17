import React, { useState } from "react";
import {
  FaHome,
  FaUsers,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./sidebar.css";


export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={collapsed ? "sidebar collapsed" : "sidebar"}>
      {/* Header */}
      <div className="sidebar-header">
        <h2>{!collapsed && "Dashboard"}</h2>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Menu */}
      <div className="sidebar-menu">
        <a href="#" className="menu-item">
          <FaHome />
          {!collapsed && <span>Home</span>}
        </a>

        <a href="#" className="menu-item">
          <FaUsers />
          {!collapsed && <span>Users</span>}
        </a>

        <a href="#" className="menu-item">
          <FaBuilding />
          {!collapsed && <span>Ministries</span>}
        </a>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && <small>© 2025 Admin Panel</small>}
      </div>
    </div>
  );
}
