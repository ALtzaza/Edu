import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import styles from './Course.module.css'; // <-- Import CSS







export default function CourseCatalog() {
  // 2. กำหนด State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // เพิ่ม State สำหรับจัดการข้อผิดพลาด

  // 3. ใช้ useEffect เพื่อดึงข้อมูลเมื่อ Component ถูกโหลดครั้งแรก
  useEffect(() => {
    const fetchCategories = async () => {
      try {

        const API_BASE_URL = 'http://localhost:3000';
        // ใช้ fetch API เรียกข้อมูลจาก endpoint ที่คุณกำหนดไว้
        const response = await fetch(`${API_BASE_URL}/api/categories`);

        // จัดการกรณีที่ Response ไม่สำเร็จ (เช่น 404, 500)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // ตรวจสอบว่า API ส่งข้อมูลในรูปแบบที่คาดหวังหรือไม่ (result.data เป็น Array)
        if (result.success && Array.isArray(result.data)) {
          // อัปเดต State ด้วยข้อมูลที่ดึงมาได้
          // **หมายเหตุ:** ข้อมูลจาก Backend อาจมี Field แตกต่างจากข้อมูล Mock 
          // เช่น numCourses, imageUrl, slug อาจต้องมีการ Mapping หรือแก้ไขใน Backend
          setCategories(result.data.map(cat => ({
            ...cat,
            // ในทางปฏิบัติ: ต้องแน่ใจว่า Backend มี field ที่จำเป็นเหล่านี้
            slug: cat.slug || cat._id, // ใช้ slug หรือ _id เป็น fallback
            title: cat.name, // สมมติว่า field ชื่อคือ name
            description: cat.description,
            imageUrl: cat.imageUrl || '/images/default.jpg', // ภาพ Default
            numCourses: cat.numCourses || 0, // จำนวนคอร์ส
          })));
          setError(null);
        } else {
          throw new Error('Data format is incorrect.');
        }

      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("ไม่สามารถดึงข้อมูลหมวดหมู่ได้"); // ตั้งค่าข้อผิดพลาด
        setCategories([]); // เคลียร์รายการ
      } finally {
        setLoading(false); // ไม่ว่าจะสำเร็จหรือไม่ก็ตาม ให้ตั้งค่า loading เป็น false
      }
    };

    fetchCategories();
  }, []); // Array ว่าง [] หมายความว่าให้ Effect ทำงานเพียงครั้งเดียวหลังการ Render ครั้งแรก

  // --- ส่วน Render ---

  // แสดงสถานะกำลังโหลด
  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.headerTitle}>Loading Categories...</h1>
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.headerTitle}>Error</h1>
        <p className={styles.headerSubtitle}>{error}</p>
        <p>กรุณาลองใหม่อีกครั้งในภายหลัง</p>
      </div>
    );
  }

  // แสดงผลหากไม่มีหมวดหมู่
  if (categories.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.headerTitle}>No Categories Found</h1>
        <p className={styles.headerSubtitle}>ไม่พบหมวดหมู่ใดๆ ในขณะนี้</p>
      </div>
    );
  }

  return (
    <div>
      {/* (Padding มาจาก MainLayout.module.css) */}

      {/* ส่วนหัวย่อย */}
      <h1 className={styles.headerTitle}>Choose Your Dev Track</h1>
      <p className={styles.headerSubtitle}>
        เลือกหมวดหมู่ที่เหมาะกับเส้นทางอาชีพของคุณ
      </p>

      {/* Grid สำหรับ Card */}
      <div className={styles.cardGrid}>
        {categories.map((category) => (

          <Link
            key={category.slug}
            to={`/catalog/${category.slug}`}
            className={styles.cardLink}
          >
            {/* รูปภาพพื้นหลัง */}
            <div
              className={styles.cardImage}
              style={{
                backgroundImage: `url(${category.imageUrl})`
              }}
            ></div>

            {/* Content ของ Card */}
            <div className={styles.cardContent}>
              <div>
                <h2 className={styles.cardTitle}>{category.title}</h2>
                <p className={styles.cardDescription}>{category.description}</p>
              </div>
              <div className={styles.cardFooter}>
                <span>{category.numCourses} Courses</span>
                <span>View All &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}