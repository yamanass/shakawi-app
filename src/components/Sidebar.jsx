// src/components/Sidebar.jsx
import React from "react";
import { FaHome, FaUsers, FaBuilding, FaChartPie } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./sidebar.css";
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();

  const menuItems = [
    { icon: <FaHome />, label: t("Dashboard"), to: "/home" },
    { icon: <FaBuilding />, label: t("Ministries"), to: "/ministries" },
    { icon: <FaUsers />, label: t("Employees"), to: "/employees" },
    { icon: <FaChartPie />, label: t("Complaints"), to: "/complaints" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        {menuItems.map((item, index) => (
          <NavLink key={index} to={item.to} end className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>
            {item.icon} <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <small>© 2025 Admin Panel</small>
      </div>
    </div>
  );
}
