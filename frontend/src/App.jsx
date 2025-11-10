// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ⭐️ 1. (แก้ไข Path) ⭐️
// (แก้ไข Path ให้ตรงกับโครงสร้างที่เราตกลงกัน)
import Layout from './layouts/MainLayout.jsx'

// ⭐️ 2. (แก้ไข Path) ⭐️
// (ย้าย 'page' เป็น 'pages' และ 'Import' หน้าที่จำเป็น)
import HomePage from './page/HomePage/HomePage';
import CoursesPage from './page/CoursesPage/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage.jsx';  
import CourseLessonPage from './pages/CourseLessonPage.jsx'; 
import LoginPage from './page/LoginPage/LoginPage.jsx';
import ForgotPasswordPage from './page/ForgotPasswordPage/ForgotPasswordPage.jsx';
import ResetPasswordPage from './page/ResetPasswordPage/ResetPasswordPage.jsx';
import PurchaseFlowPage from "./pages/PurchasesPage/PurchaseFlowPage";
import PurchasesPage from "./pages/PurchasesPage/PurchasesPage";

function App() {
  return (
    <BrowserRouter>
    
      <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Route "Layout" (มี Navbar/Footer) */}
        <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} /> 
          {/* ⭐️ 3. (เปิด) หน้าแรก ⭐️ */}
          
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="/lessons/:courseId/:lessonId" element={<CourseLessonPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchase/:courseId" element={<PurchaseFlowPage />} />
          {/* (Route อื่นๆ ที่อยู่ใน Layout) */}
          {/* <Route path="courses" element={<CoursesPage />} /> */}
          {/* <Route path="login" element={<LoginPage />} /> */}
        </Route>
        
       

        {/* (Route 404 - ปิดไว้ก่อนได้ถ้ายังไม่สร้าง) */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
          
      </Routes>
    </BrowserRouter>
  );
}

export default App;
