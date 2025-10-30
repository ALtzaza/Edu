// src/components/layout/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom'; // 1. Import Outlet
import Navbar from './Navbar'; // (สมมติว่าคุณสร้าง Navbar แล้ว)
import Footer from './Footer'; // (สมมติว่าคุณสร้าง Footer แล้ว)

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      
      <main className="main-content">
        {/* 2. 👈 "ไส้ใน" (Pages) ทั้งหมดจะถูก Render ตรงนี้ */}
        <Outlet /> 
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;