// src/pages/CoursesPage/CoursesPage.jsx (ฉบับแก้ไข - Full Filters + Live Search)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api'; 
import './CoursesPage.css';   

import Dropdown from 'react-bootstrap/Dropdown';
import { ThemeProvider } from 'react-bootstrap'; 

const CoursesPage = () => {
  // --- State (กล่องเก็บข้อมูล) ---
  const [categories, setCategories] = useState([]); // (เก็บ "หมวดหมู่" จาก API)
  const [courses, setCourses] = useState([]);     // (เก็บ "คอร์ส" จาก API)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐️ 1. (แก้ไข) State สำหรับ "ตัวกรอง" ทั้งหมด
  const [filters, setFilters] = useState({
    category: null,     // (หมวดหมู่ที่เลือก)
    search: "",         // (คำที่พิมพ์ค้นหา)
    sort: "newest",     // (เรียงลำดับ (Default: ใหม่สุด))
    price: null         // (กรองราคา (Default: ทั้งหมด))
  });

  // --- (ยิง API ตอนโหลด) ---
  useEffect(() => {
    // (ดึง "หมวดหมู่" มาใส่ Dropdown แค่ครั้งเดียว)
    const fetchCategories = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []); // (ยิงครั้งเดียวตอนโหลด)


  // ⭐️ 2. (สำคัญ) "Live Search" (Debounce) ⭐️
  // (useEffect นี้ จะ "ดักฟัง" เมื่อ 'filters' (State) เปลี่ยน)
  useEffect(() => {
    setLoading(true);
    
    // 1. (Debounce) สร้าง "นาฬิกาจับเวลา" (500ms)
    const delayDebounceFn = setTimeout(() => {
      
      // 2. สร้าง Query String
      const params = new URLSearchParams();
      
      if (filters.category) {
        params.append('category', filters.category._id);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sort) {
        params.append('sort', filters.sort);
      }
      if (filters.price) {
        // (API 'courses' เรารองรับ min/max)
        if (filters.price === 'free') params.append('maxPrice', 0);
        if (filters.price === 'paid') params.append('minPrice', 1);
      }

      // 3. ⭐️ (API กรอง) ยิง API (ที่เราเทสใน Postman)
      // (เช่น GET /api/courses?search=...&category=...&sort=...)
      api.get(`/courses?${params.toString()}`)
        .then(res => {
          setCourses(res.data.data || []);
        })
        .catch(err => {
          console.error("Error filtering courses:", err);
          setError("ไม่สามารถกรองข้อมูลได้");
        })
        .finally(() => {
          setLoading(false);
        });

    }, 500); // ⬅️ (รอ 500ms หลังจาก "หยุดพิมพ์")

    // 4. (Cleanup) ถ้า User "พิมพ์ต่อ" 
    //    ให้ "ยกเลิก" นาฬิกา (setTimeout) เก่าทิ้ง
    return () => clearTimeout(delayDebounceFn); 

  }, [filters]); // ⬅️ (ทำงานใหม่ "ทุกครั้ง" ที่ filters เปลี่ยน)


  // --- (ฟังก์ชัน "Helper" สำหรับอัปเดต State) ---
  const handleFilterChange = (key, value) => {
    // (อัปเดต State 'filters' ทีละตัว)
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value
    }));
  };

  // --- (UI ตอน Loading / Error) ---
  if (error) return <div className="catalog-page-container" style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  // --- (JSX) ---
  return (
    <div className="catalog-page-container">
      
      {/* -------------------- 1. ส่วนหัว (Catalog + Filter) -------------------- */}
      <div className="catalog-header">
        <h1>Catalog</h1>
        
        {/* ⭐️ 3. (แก้ไข) "ช่องค้นหา" (Live Search) ⭐️ */}
        {/* (ลบ <form> และ <button> ทิ้ง) */}
        <div className="search-bar-container">
          <input 
            type="text"
            className="search-input"
            placeholder="ค้นหาคอร์สเรียนกับTid_code"
            value={filters.search}
            // (เมื่อ "พิมพ์" ➡️ ให้อัปเดต State 'search' ทันที)
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        {/* ⭐️ 4. (เพิ่ม) Filter "กรองราคา" ⭐️ */}
        <ThemeProvider data-bs-theme="dark">
          <Dropdown 
            className="filter-dropdown" 
            onSelect={(eventKey) => handleFilterChange('price', eventKey)}
          >
            <Dropdown.Toggle variant="dark">
              {filters.price === 'free' ? 'ฟรี' : filters.price === 'paid' ? 'มีค่าใช้จ่าย' : 'ราคาทั้งหมด'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey={null}>— ราคาทั้งหมด —</Dropdown.Item>
              <Dropdown.Item eventKey="free">ฟรี</Dropdown.Item>
              <Dropdown.Item eventKey="paid">มีค่าใช้จ่าย</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </ThemeProvider>

        {/* ⭐️ 5. (เพิ่ม) Filter "เรียงลำดับ" (API ที่เรามี) ⭐️ */}
        <ThemeProvider data-bs-theme="dark">
          <Dropdown 
            className="filter-dropdown" 
            onSelect={(eventKey) => handleFilterChange('sort', eventKey)}
          >
            <Dropdown.Toggle variant="dark">
              {/* (แสดงผลลัพธ์) */}
              {filters.sort === 'newest' ? 'ใหม่สุด' : 
               filters.sort === 'title_asc' ? 'A-Z' :
               filters.sort === 'title_desc' ? 'Z-A' :
               filters.sort === 'price_asc' ? 'ราคา (น้อยไปมาก)' :
               filters.sort === 'price_desc' ? 'ราคา (มากไปน้อย)' : 'เรียงลำดับ'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="newest">ใหม่สุด</Dropdown.Item>
              <Dropdown.Item eventKey="title_asc">ตัวอักษร (A-Z)</Dropdown.Item>
              <Dropdown.Item eventKey="title_desc">ตัวอักษร (Z-A)</Dropdown.Item>
              <Dropdown.Item eventKey="price_asc">ราคา (น้อยไปมาก)</Dropdown.Item>
              <Dropdown.Item eventKey="price_desc">ราคา (มากไปน้อย)</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </ThemeProvider>
        
        {/* ⭐️ 6. (แก้ไข) Filter "หมวดหมู่" (API 'categories') ⭐️ */}
        <ThemeProvider data-bs-theme="dark">
          <Dropdown 
            className="filter-dropdown" 
            onSelect={(eventKey, e) => handleFilterChange('category', eventKey ? { _id: eventKey, name: e.target.textContent } : null)}
          >
            <Dropdown.Toggle variant="dark">
              {filters.category ? filters.category.name : "กรองหมวดหมู่"}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item eventKey={null}>— ดูทั้งหมด —</Dropdown.Item>
              {categories.map(cat => (
                <Dropdown.Item key={cat._id} eventKey={cat._id}>
                  {cat.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </ThemeProvider>
      </div>

      {/* -------------------- 2. ส่วนแสดงผลคอร์ส (Grid) -------------------- */}
      <div className="courses-grid-container">
        <div className="track-section" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h2>Choose Your Dev Track</h2>
        </div>

        {/* (Grid ที่เชื่อม API 'courses') */}
        <div className="courses-grid">
          {loading ? (
            <p style={{ color: 'white' }}>Loading courses...</p>
          ) : courses.length > 0 ? (
            courses.map(course => (
              <Link to={`/courses/${course._id}`} key={course._id} style={{ textDecoration: 'none' }}>
                <div className="course-card">
                  <div 
                    className="course-card-image"
                    style={{ backgroundImage: course.thumbnail ? `url(${course.thumbnail})` : 'none' }}
                  >
                    {!course.thumbnail && "C"}
                  </div>
                  <div className="course-card-content">
                    <h3>{course.title}</h3>
                    <p>{course.price === 0 ? "Free" : `฿${course.price}`}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>ไม่พบคอร์สที่ตรงกับการค้นหา</p> // (ถ้าค้นหาไม่เจอ)
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;