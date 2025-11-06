import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. Import Pages
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import CoursePage from './pages/Course.jsx';         
import CategoryPage from './pages/Category.jsx';       
import CourseDetailPage from './pages/CourseDetailPage.jsx';  
import CourseLessonPage from './pages/CourseLessonPage.jsx'; 


const NotFound = () => <div>404 - Page Not Found</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Layout Route หลัก (มี Navbar/Header) */}
        <Route path="/" element={<MainLayout />}>
          
          <Route index element={<HomePage />} /> 
          <Route path="catalog" element={<CoursePage />} />
          <Route path="catalog/:categoryName" element={<CategoryPage />} />
          <Route path="course/:id" element={<CourseDetailPage />} />
          
          
{/*          <Route path="course/:id/lesson/:lessonId" element={<LessonPage />} /> */}

          
          {/* 🟢 ย้าย Lesson Page แบบละเอียด เข้ามาใน MainLayout */}
          <Route path="/lessons/:courseId/:lessonId" element={<CourseLessonPage />} />
          
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;