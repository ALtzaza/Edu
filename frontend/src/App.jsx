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

// import LoginPage from './pages/LoginPage/LoginPage';
// import NotFoundPage from './pages/NotFoundPage/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
    
      <Routes>
      
        {/* Route "Layout" (มี Navbar/Footer) */}
        <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} /> 
          {/* ⭐️ 3. (เปิด) หน้าแรก ⭐️ */}
          
          <Route path="catalog" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="/lessons/:courseId/:lessonId" element={<CourseLessonPage />} />
          
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