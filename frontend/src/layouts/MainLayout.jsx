import React, { useState, useEffect } from 'react'; // <-- 1. Import useState, useEffect
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../component/layout/layout/navbar/Navbar.jsx'
import styles from './MainLayout.module.css'; 

// Component PageHeader (ไม่ต้องแก้)
const PageHeader = ({ title }) => {
  if (!title) return null; // ถ้า title ว่าง = ไม่โชว์

  return (
    <div className={styles.pageHeader}>
      <div className={styles.container}>
        <h1 className={styles.headerTitle}>{title}</h1>
      </div>
    </div>
  );
};

export default function MainLayout() {
  const location = useLocation();
  
  // --- ⬇️ นี่คือส่วนที่เรา "ลืม" ใส่ ⬇️ ---

  // 2. สร้าง "กล่องเก็บความจำ" (State) สำหรับ Title
  const [pageTitle, setPageTitle] = useState(''); 

  // 3. เมื่อ URL เปลี่ยน... ให้เรา "ลบ" Title เก่าทิ้ง
  // (กันไม่ให้ Title ค้าง)
  useEffect(() => {
    setPageTitle(''); 
  }, [location.pathname]); // ทำงานทุกครั้งที่ URL เปลี่ยน

  // --- ⬆️ จบส่วนที่ลืม ⬆️ ---

  return (
    <div> 
      <Navbar />
      
      {/* 4. ให้แบนเนอร์โชว์ Title จาก State */}
      <PageHeader title={pageTitle} /> 
      
      <main className={styles.container}>
        
        {/* 5. (สำคัญที่สุด!) 
            ส่ง "ตัวเปลี่ยน Title" (setPageTitle) 
            ลงไปให้ "หน้าลูก" (Outlet) ทุกหน้า
        */}
        <Outlet context={{ setPageTitle }} /> 
        
      </main>
    </div>
  );
}