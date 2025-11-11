// src/pages/Admin/ManageCoursesPage.jsx (V2 - "Smart Form")

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/api'; 
import './ManageCoursesPage.css'; 

// ⭐️ 1. (แก้ไข) "CourseForm" (V2) ⭐️
const CourseForm = ({ categories, onCourseUpdated, editingCourse, setEditingCourse }) => {
  
  // ⭐️ (แก้ไข) 2. "ย้าย" State (กล่องเก็บข้อมูล) มาไว้ข้างบน
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [difficulty, setDifficulty] = useState('beginner');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState(null); // (ไฟล์รูป)
  const [existingThumbnail, setExistingThumbnail] = useState(null); // (รูปเก่า (String))
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⭐️ (ใหม่) 3. "useEffect" (ดักฟัง 'editingCourse')
  // (ถ้า 'editingCourse' (ที่ส่งมาจากแม่) เปลี่ยน ➡️ "ดึง" ข้อมูลเก่ามาใส่ Form)
  useEffect(() => {
    if (editingCourse) {
      // (โหมด "แก้ไข")
      setTitle(editingCourse.title);
      setDescription(editingCourse.description || '');
      setPrice(editingCourse.price || 0);
      setDifficulty(editingCourse.difficulty || 'beginner');
      setCategory(editingCourse.category?._id || '');
      setExistingThumbnail(editingCourse.thumbnail || null); // (เก็บ Path รูปเก่า)
      setThumbnail(null); // (เคลียร์ช่อง 'file' เก่า)
    } else {
      // (โหมด "สร้าง")
      clearForm();
    }
  }, [editingCourse]); // (ทำงานใหม่ เมื่อ 'editingCourse' เปลี่ยน)

  // (ฟังก์ชัน "เคลียร์" Form)
  const clearForm = () => {
    setTitle('');
    setDescription('');
    setPrice(0);
    setDifficulty('beginner');
    setCategory('');
    setThumbnail(null);
    setExistingThumbnail(null);
    setError(null);
  };

  // (ฟังก์ชัน "ยิง API" (V2))
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !title) { // (Price อาจจะเป็น 0 (Free))
      setError("กรุณากรอก Category และ Title");
      return;
    }
    setLoading(true);
    setError(null);

    // 1. (สร้าง FormData) (เหมือน V1)
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('difficulty', difficulty);
    formData.append('category', category);
    
    // (ถ้า "อัปโหลด" รูปใหม่ ➡️ ค่อย "แนบ" ไฟล์)
    if (thumbnail) {
      formData.append('thumbnail', thumbnail); 
    }

    try {
      let res;
      // ⭐️ 4. (แก้ไข) "เช็ค" โหมด (V2) ⭐️
      if (editingCourse) {
        // (โหมด "แก้ไข") ➡️ ยิง 'PUT'
        res = await api.put(`/courses/${editingCourse._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onCourseUpdated(res.data.data, 'update'); // (ส่งข้อมูล (อัปเดต) กลับไปที่ "ตาราง")
        
      } else {
        // (โหมด "สร้าง") ➡️ ยิง 'POST'
        res = await api.post('/courses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onCourseUpdated(res.data.data, 'add'); // (ส่งข้อมูล (ใหม่) กลับไปที่ "ตาราง")
      }
      
      alert(`สำเร็จ: ${res.data.message}`);
      setEditingCourse(null); // (บังคับ Form กลับไปโหมด "สร้าง")
      
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      {/* ⭐️ (แก้ไข) 5. "เปลี่ยน" หัวข้อ (Title) ⭐️ */}
      <h2>{editingCourse ? `แก้ไข คอร์ส: ${editingCourse.title}` : "เพิ่มคอร์สใหม่"}</h2>
      
      <form className="admin-form-grid" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="title">Title</label>
          <input type="text" id="title" className="admin-form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label htmlFor="price">Price (THB)</label>
          <input type="number" id="price" className="admin-form-input" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        
        <div className="admin-form-group">
          <label htmlFor="category">Category</label>
          <select id="category" className="admin-form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">— เลือกหมวดหมู่ —</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="admin-form-group">
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" className="admin-form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="description">Description</label>
          <textarea id="description" className="admin-form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        
        {/* (ช่องอัปโหลดรูป) */}
        <div className="admin-form-group">
          <label htmlFor="thumbnail">Thumbnail Image (อัปโหลดใหม่ ถ้าต้องการเปลี่ยน)</label>
          <input 
            type="file" id="thumbnail" className="admin-form-input"
            accept="image/png, image/jpeg"
            onChange={(e) => setThumbnail(e.target.files[0])} 
          />
          {/* (แสดงรูป "เก่า" (ถ้ามี)) */}
          {existingThumbnail && !thumbnail && (
            <img 
              src={`http://localhost:3000/${existingThumbnail.replace(/^\//, '')}`} 
              alt="Current" 
              style={{ width: '100px', height: 'auto', marginTop: '10px' }} 
            />
          )}
        </div>

        {/* ⭐️ (แก้ไข) 6. "ปุ่ม" (Submit / Cancel) ⭐️ */}
        <div className="admin-form-group" style={{ gridColumn: '1 / -1', alignItems: 'flex-end', gap: '1rem', flexDirection: 'row' }}>
          {editingCourse && (
            <button type="button" className="admin-submit-button" 
                    style={{ backgroundColor: '#555' }} 
                    onClick={() => setEditingCourse(null)}> {/* ⬅️ (ปุ่ม Cancel) */}
              Cancel Edit
            </button>
          )}
          <button type="submit" className="admin-submit-button" disabled={loading}>
            {loading ? "Loading..." : (editingCourse ? "Update Course" : "Create Course")}
          </button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
};


// ⭐️ (แก้ไข) "ManageCoursesPage" (V2) ⭐️
const ManageCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐️ (ใหม่) 1. "State" (สำหรับเก็บว่ากำลังแก้ตัวไหน)
  const [editingCourse, setEditingCourse] = useState(null); 

  // (ยิง API (V14) (GET /courses และ /categories))
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, catRes] = await Promise.all([
          api.get('/courses'), 
          api.get('/categories') 
        ]);
        setCourses(courseRes.data.data || []);
        setCategories(catRes.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // (ฟังก์ชัน "ลบ" (V15))
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("คุณแน่ใจนะ ว่าจะลบคอร์สนี้ (และบทเรียนทั้งหมด)?")) {
      return;
    }
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(courses.filter(c => c._id !== courseId));
    } catch (err) {
      alert("Error: " + err.response?.data?.message);
    }
  };
  
  // (ฟังก์ชัน "อัปเดตตาราง" (V2))
  const handleCourseUpdated = (updatedCourse, mode) => {
    if (mode === 'add') {
      // (เพิ่ม)
      setCourses([updatedCourse, ...courses]);
    } else {
      // (แก้ไข)
      setCourses(courses.map(c => 
        c._id === updatedCourse._id ? updatedCourse : c
      ));
    }
  };

  if (loading) return <div>Loading Courses...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Manage Courses</h1>
      
      {/* 1. (Form (V2)) 
          (ส่ง "State" (V2) ลงไปให้ลูก) */}
      <CourseForm 
        categories={categories} 
        onCourseUpdated={handleCourseUpdated}
        editingCourse={editingCourse}
        setEditingCourse={setEditingCourse}
      />
      
      {/* 2. (Table) */}
      <h1>Existing Courses ({courses.length})</h1>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            {/* ... (th ... เหมือนเดิม) ... */}
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course._id}>
                <td>
                  {course.thumbnail ? (
                    <img 
                      src={`http://localhost:3000/${course.thumbnail.replace(/^\//, '')}`} 
                      alt={course.title} 
                      className="thumbnail-preview" 
                    />
                  ) : ( "No Image" )}
                </td>
                <td>{course.title}</td>
                <td>{course.category?.name || "N/A"}</td>
                <td>{course.price === 0 ? "Free" : `฿${course.price}`}</td>
                <td className="actions-cell">
                  
                  {/* (ปุ่ม "จัดการเนื้อหา" (V16)) */}
                  <Link to={`/admin/manage-content/${course._id}`}>
                    <button className="action-button manage-button">
                      Manage Content
                    </button>
                  </Link>
                  
                  {/* ⭐️ (แก้ไข) 2. (ปุ่ม "แก้ไข") ⭐️
                      (เมื่อ "คลิก" ➡️ สั่ง "แม่" (V2) ให้ 'setEditingCourse') */}
                  <button 
                    className="action-button edit-button"
                    onClick={() => setEditingCourse(course)}
                  >
                    Edit
                  </button>
                  
                  {/* (ปุ่ม "ลบ" (V15)) */}
                  <button 
                    className="action-button delete-button"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCoursesPage;