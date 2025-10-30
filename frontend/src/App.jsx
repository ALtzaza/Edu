// // src/App.jsx

// import React from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';

// // 1. Import Layout (ตัวคุม Outlet)
// import Layout from './components/layout/Layout';

// // 2. Import "หน้า" (Pages) ทั้งหมด
// import HomePage from './pages/HomePage/HomePage';
// import CoursesPage from './pages/CoursesPage/CoursesPage';
// import CourseDetailPage from './pages/CourseDetailPage/CourseDetailPage';
// import ClassroomPage from './pages/ClassroomPage/ClassroomPage';
// import LoginPage from './pages/LoginPage/LoginPage';
// import NotFoundPage from './pages/NotFoundPage/NotFoundPage';

// function App() {
//   return (
//     // <BrowserRouter>
//     //   <Routes>
//     //     {/* 3. 👈 Route "Layout" จะคุม Route ลูกทั้งหมด */}
//     //     <Route path="/" element={<Layout />}>
        
//     //       {/* 4. 👈 "ไส้ใน" ที่ Outlet จะแสดง */}
//     //       <Route index element={<HomePage />} /> {/* หน้าแรก (path="/") */}
//     //       <Route path="courses" element={<CoursesPage />} /> {/* path="/courses" */}
//     //       <Route path="courses/:id" element={<CourseDetailPage />} /> {/* path="/courses/abc1234" */}
//     //       <Route path="classroom/:courseId" element={<ClassroomPage />} /> {/* path="/classroom/abc1234" */}
//     //       <Route path="login" element={<LoginPage />} /> {/* path="/login" */}

//     //       <Route path="*" element={<NotFoundPage />} /> {/* 404 Not Found */}
          
//     //     </Route>
//     //   </Routes>
//     // </BrowserRouter>
//   );
// }

// export default App;