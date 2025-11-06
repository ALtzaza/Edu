import React, { useState, useEffect } from 'react'; 
import { useParams, Link } from 'react-router-dom';

import styles from './Category.module.css'; 

// ฟังก์ชันแปลง "web-development" ให้เป็น "Web Development"
function formatCategoryName(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// *** สมมติ: ฟังก์ชันนี้จะแปลง slug เป็น MongoDB Category ID (ตามโค้ดก่อนหน้า) ***
const categorySlugToIdMap = {
  // ต้องแน่ใจว่าค่านี้ถูกต้องและครบ 24 ตัวอักษร
  'frontend-development': '68f89f2a3dd96217052ea706', // ใช้ ID ที่คุณพบใน URL
  // ...
};

const getCategoryIdForApi = (slug) => {
    // ใช้ ID ที่ถูกต้อง (หากมี) หรือส่ง slug กลับไป ถ้า Backend ถูกแก้ไขให้ค้นหาจากชื่อ
    // ในตัวอย่างนี้ เราใช้ ID ที่ได้จากการ Map (ที่ต้องแก้ไขให้ถูกต้องเป็น 24 ตัวอักษร)
    return categorySlugToIdMap[slug] || slug;
}


export default function CategoryPage() {
  const { categoryName: categorySlug } = useParams(); // เปลี่ยนชื่อเป็น categorySlug
  
  // formattedName จะถูกใช้เป็นชื่อเริ่มต้น แต่เราจะใช้ชื่อจาก API ถ้ามี
  const defaultFormattedName = formatCategoryName(categorySlug); 

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // *** State ใหม่สำหรับชื่อหมวดหมู่จริงจาก API ***
  const [actualCategoryName, setActualCategoryName] = useState(defaultFormattedName);

  
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      
      const categoryIdOrSlug = getCategoryIdForApi(categorySlug);
      // ในตัวอย่างนี้เราส่ง ID (หรือ Slug) เข้าไปใน query
      const apiUrl = `/api/courses?category=${categoryIdOrSlug}`;
      try {
        const API_BASE_URL = 'http://localhost:3000';
        const response = await fetch(`${API_BASE_URL}${apiUrl}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          
          setCourses(result.data);
          
          // 💡 จุดสำคัญ: ดึงชื่อหมวดหมู่จริงจากคอร์สแรก
          if (result.data.length > 0 && result.data[0].category) {
            // คอร์สแรกในรายการจะมี object category ที่ถูก populate มา
            setActualCategoryName(result.data[0].category.name);
          } else {
            // หากไม่พบคอร์ส ให้ใช้ชื่อที่ถูก format จาก slug
            setActualCategoryName(defaultFormattedName);
          }

        } else {
          setCourses([]);
          setActualCategoryName(defaultFormattedName);
        }

      } catch (err) {
        console.error(`Failed to fetch courses for ${categorySlug}:`, err);
        setError("ไม่สามารถดึงรายการคอร์สได้");
        setCourses([]);
        setActualCategoryName(defaultFormattedName);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchCourses();
    }
  }, [categorySlug]); // ใช้ categorySlug เป็น dependency

  // --- ส่วน Render ---
  if (loading) {
    return (
        <div className={styles.container}>
            <h1 className={styles.headerTitle}>กำลังโหลดคอร์สใน {actualCategoryName}...</h1>
        </div>
    );
  }

  if (error) {
    return (
        <div className={styles.container}>
            <h1 className={styles.headerTitle}>Error</h1>
            <p className={styles.headerSubtitle}>{error}</p>
        </div>
    );
  }

  return (
    <div>
      
      <Link to="/catalog" className={styles.backLink}>
        &larr; กลับไปหน้าหมวดหมู่ทั้งหมด
      </Link>

      <h1 className={styles.headerTitle}>
        Category: {actualCategoryName} {/* ⬅ ใช้ชื่อที่ดึงมาจาก API */}
      </h1>
      
      <p className={styles.headerSubtitle}>
        คอร์สทั้งหมดในหมวดหมู่นี้: ({courses.length} รายการ) {/* ⬅ ใช้ .length เพื่อนับ */}
      </p>

      {courses.length === 0 ? (
        <p className={styles.noCourses}>
            ไม่พบคอร์สในหมวดหมู่ "{actualCategoryName}"
        </p>
      ) : (
        /* Grid สำหรับคอร์ส */
        <div className={styles.courseGrid}>
          {courses.map(course => (
            
            <Link
              key={course._id} 
              to={`/course/${course._id}`} 
              className={styles.courseCard}
            >
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseDescription}>
                {course.description || 'ไม่มีคำอธิบายโดยย่อ'}
              </p>
              <div className={styles.courseFooter}>
                  <span>{course.price === 0 ? 'Free' : `${course.price} THB`}</span>
                  <span>{course.instructor?.name || 'Unknown Instructor'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}