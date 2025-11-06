// src/components/layout/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom'; // 1. Import Outlet

import Navbar from '../layout/navbar/Navbar.jsx'
 import Footer from'../layout/footer/Footer.jsx';


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