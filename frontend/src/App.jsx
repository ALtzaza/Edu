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
// import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminRoute from './routes/AdminRoutes.jsx';
import DashboardPage from '../src/page/AdminPage/DashboardPage/DashboardPage.jsx';
import ManageCoursesPage from './page/AdminPage/ManageCoursesPage/ManageCoursesPage.jsx';
import ManageCategoriesPage from './page/AdminPage/ManageCategoriesPage/ManageCategoriesPage.jsx';
import ManageContentPage from './page/AdminPage/ManageContentPage/ManageContentPage.jsx';
import ManageUsersPage from './page/AdminPage/ManageUsersPage/ManageUsersPage.jsx';
import ManageUserProfilePage from './page/AdminPage/ManageUsersPages/ManageUserProfilePage.jsx';
import ManagePurchasesPage from './page/AdminPage/ManagePurchasesPage/ManagePurchasesPage.jsx';
import ProfilePage from './pages/ProfilePage/ProfilePage.jsx';

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
          <Route path="Profile" element={<ProfilePage/>} />
          {/* <Route path="login" element={<LoginPage />} /> */}
        </Route>
        
       
        <Route element={<AdminRoute />}> {/* ⬅️ 1. "ยาม" หุ้ม */}
          <Route path="/admin" element={<AdminLayout />}> {/* ⬅️ 2. "โครงสร้าง Admin" หุ้ม */}
            {/* 3. "ไส้ใน" Admin */}
            <Route index element={<DashboardPage />} /> 
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="manage-courses" element={<ManageCoursesPage />} />
            <Route path="manage-categories" element={<ManageCategoriesPage />} />
            <Route path="manage-content/:courseId" element={<ManageContentPage />} />
            <Route path="manage-users" element={<ManageUsersPage />} />
            <Route path="manage-users/:id" element={<ManageUserProfilePage />} />
            <Route path="manage-purchases" element={<ManagePurchasesPage />} />
          </Route>
        </Route>

        
          
      </Routes>
    </BrowserRouter>
  );
}

export default App;
