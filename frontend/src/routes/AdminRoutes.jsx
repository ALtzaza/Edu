// src/routes/AdminRoute.jsx

import React from 'react';
// 1. (Import) 'Navigate' (สำหรับ "เด้ง") และ 'Outlet' (สำหรับ "เปิดประตู")
import { Navigate, Outlet } from 'react-router-dom';
// 2. (Import) "สมอง" (ที่เราสร้างไว้)
import { useAuth } from '../context/AuthContext'; 

const AdminRoute = () => {
  // 3. "ถาม" สมอง (AuthContext)
  const { user, loading } = useAuth();

  // 4. (ถ้ายังเช็ค Token ไม่เสร็จ)
  if (loading) {
    // (แสดง "Loading..." เพื่อป้องกันหน้ากระตุก)
    return <div>Loading Authentication...</div>; 
  }

  // 5. (ตัดสินใจ)
  // (เช็คว่า: "Login แล้ว" (user) 
  //  และ "ยศ" (user.role) คือ "admin")
  if (user && user.role === 'admin') {
    
    // 6. ⭐️ (ถ้าเป็น Admin) "เปิดประตู"
    // (อนุญาตให้ <Outlet /> (ลูกๆ) ทำงาน (เช่น AdminLayout))
    return <Outlet />; 
    
  } else {
    
    // 7. ⭐️ (ถ้า "ไม่" ใช่ Admin) "เด้ง"
    // (ส่งกลับไปหน้าแรก)
    return <Navigate to="/" replace />; 
  }
};

export default AdminRoute;