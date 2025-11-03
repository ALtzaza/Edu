import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet คือที่ที่เนื้อหาของ Page (เช่น Home) จะมาแสดง
import Navbar from '../components/Navbar.jsx'; // 1. Import Navbar ที่เราสร้าง
// import Footer from '../components/Footer.jsx'; // (ถ้าคุณมี Footer ก็ import มาด้วย)

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 2. เรียกใช้ Navbar ไว้บนสุดของ Layout */}
      <Navbar />

      {/* 3. เนื้อหาของหน้า (เช่น Home, Blog) จะถูกเรนเดอร์ตรงนี้ */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* 4. (ถ้ามี) เรียกใช้ Footer ไว้ล่างสุด */}
      {/* <Footer /> */}

    </div>
  );
};

export default MainLayout;
