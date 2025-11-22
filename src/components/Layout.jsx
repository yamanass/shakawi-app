// src/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./Topbar";
import { Outlet } from "react-router-dom";
import "./layout.css"; // نضيف ستايل مركزي

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <TopBar />

      <div className="main-content">
        <div className="page-inner">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
