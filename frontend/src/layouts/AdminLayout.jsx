// src/layouts/AdminLayout.jsx

import React from "react";
// 1. (Import) 'Outlet' (ตัวแสดงไส้ใน) และ 'Link'
import { Outlet, Link, useNavigate } from "react-router-dom";
// 2. (Import) "สมอง" (เพื่อดึง 'user' และ 'logout')
import { useAuth } from "../context/AuthContext";
// 3. (Import) CSS
import "./AdminLayout.css";

const AdminLayout = () => {
  // 4. (ดึง "สมอง")
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // (ฟังก์ชัน Logout ที่ "เด้ง" กลับหน้าแรก)
  const handleLogout = () => {
    logout(); // (ล้าง Token/User)
    navigate("/"); // (เด้งกลับหน้าแรก)
  };

  return (
    <div className="admin-layout-container">
      {/* 1. (Sidebar - เมนูซ้าย) */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Admin Panel</h3>
          <p>Welcome, {user?.name || "Admin"}!</p>
        </div>

        <hr />

        {/* (เมนู) */}
        <Link to="/admin/dashboard" className="admin-nav-link">
          Dashboard
        </Link>
        <Link to="/admin/manage-categories" className="admin-nav-link">
          Manage Categories
        </Link>
        <Link to="/admin/manage-courses" className="admin-nav-link">
          Manage Courses
        </Link>
        <Link to="/admin/manage-quizzes" className="admin-nav-link">
          Manage Quizzes
        </Link>
        <Link to="/admin/manage-workshop" className="admin-nav-link">
          Manage Workshop Approvals
        </Link>
        <Link to="/admin/manage-users" className="admin-nav-link">
          Manage Users
        </Link>
        <Link to="/admin/manage-purchases" className="admin-nav-link">
          Manage Purchases
        </Link>

        <hr />

        <Link to="/" className="admin-nav-link">
          กลับหน้าแรก (Home)
        </Link>
        <button onClick={handleLogout} className="admin-logout-button">
          Logout
        </button>
      </aside>

      {/* 2. (Content - เนื้อหาขวา) */}
      <main className="admin-content">
        {/* ( "ไส้ใน" (เช่น DashboardPage) 
            จะถูก Render (แสดงผล) ตรงนี้) */}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
