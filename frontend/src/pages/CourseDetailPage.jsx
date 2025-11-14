// src/pages/CourseDetailPage.jsx

// 1. ⭐️ (เพิ่ม) import useLocation
import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import styles from './CourseDetailPage.module.css'; 

const getBannerSrc = (thumb) => {
    const t = (thumb || '').trim();
    return t ? t : '/images/default-banner.png';
};

const mapSectionsForDisplay = (sections) => {
    // ... (ฟังก์ชันนี้เหมือนเดิม ไม่ต้องแก้ไข) ...
    let totalLessons = 0;
    let totalQuizzes = 0;
    let totalWorkshops = 0;

    const mappedSections = sections.map(section => {
        const lessons = section.lessons || [];
        totalLessons += lessons.length;
        lessons.forEach(lesson => {
            const isQuizLesson = lesson.type === 'quiz' || (Array.isArray(lesson.quizzes) && lesson.quizzes.length > 0);
            const isWorkshopLesson = lesson.type === 'workshop';
            if (isQuizLesson) totalQuizzes += 1;
            if (isWorkshopLesson) totalWorkshops += 1;
        });
        
        return {
            title: section.title,
            lessons: lessons.map(lesson => ({
                title: lesson.title,
                _id: lesson._id
            }))
        };
    });

    return { mappedSections, totalLessons, totalQuizzes, totalWorkshops };
}

// ✅ Component "หลัก" (CourseDetailPage) ✅
export default function CourseDetailPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext(); 
    const location = useLocation(); // 2. ⭐️ (เพิ่ม) ดึง location ปัจจุบัน

    // 3. ⭐️ (เพิ่ม) State สำหรับเช็คสถานะ
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false); // ⭐️ State ใหม่: เช็คว่าซื้อคอร์สนี้หรือยัง

    // 4. ⭐️ (เพิ่ม) ดึง token มาเช็คสถานะ login
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token; // แปลงเป็น true/false
    
    // --- 5. ⭐️ (แก้ไข) โลจิก Fetch Data ---
    // (เปลี่ยนเป็น fetch ข้อมูลคอร์ส และ สถานะการลงทะเบียน พร้อมกัน)
    useEffect(() => {
        const fetchCourseAndStatus = async () => {
            setLoading(true);
            setError(null);
            setIsEnrolled(false); // Reset สถานะก่อนโหลด
            
            try {
                const API_BASE_URL = 'http://localhost:3000';
                
                // 1. ดึงข้อมูลคอร์ส (Public)
                const courseRes = await fetch(`${API_BASE_URL}/api/courses/${id}`);
                if (!courseRes.ok) throw new Error(`Course not found: ${courseRes.status}`);
                const result = await courseRes.json();
                
                if (result.success && result.data) {
                    setCourse(result.data);
                    setPageTitle(result.data.title);
                } else {
                    throw new Error('Course data invalid');
                }

                // 2. (เพิ่ม) ถ้า Login อยู่ ให้เช็คสถานะการลงทะเบียน (Private)
                if (isLoggedIn) {
                    // 🚨 (นี่คือ API Endpoint ใหม่ที่คุณต้องสร้างที่ Back-end)
                    const statusRes = await fetch(`${API_BASE_URL}/api/courses/${id}/status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        // (สมมติ Back-end ตอบกลับ { isEnrolled: true })
                        if (statusData.isEnrolled) {
                            setIsEnrolled(true);
                        }
                    } 
                    // ถ้า fetch status ไม่สำเร็จ (เช่น 401, 404) ก็ไม่เป็นไร
                    // isEnrolled จะยังคงเป็น false (ยังไม่ซื้อ)
                }

            } catch (err) {
                console.error("Failed to fetch course data:", err);
                setError("ไม่สามารถดึงรายละเอียดคอร์สนี้ได้");
                setPageTitle("Course Not Found");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourseAndStatus();
        }
    // 6. ⭐️ (เพิ่ม) ใส่ isLoggedIn, token ใน dependency array
    }, [id, setPageTitle, isLoggedIn, token]); 


    // --- Handlers ---
    const handleEnrollClick = () => {
        // (ฟังก์ชันเดิมของคุณ: สำหรับคนที่ซื้อแล้ว)
        if (course && course.sections && course.sections.length > 0) {
            const firstSection = course.sections[0];
            if (firstSection.lessons && firstSection.lessons.length > 0) {
                const firstLessonId = firstSection.lessons[0]._id;
                navigate(`/lessons/${id}/${firstLessonId}`); 
                return;
            }
        }
        navigate(`/lessons/${id}`);
    };

    // 7. ⭐️ (เพิ่ม) Handler ใหม่สำหรับกดปุ่ม "สั่งซื้อ"
    const handlePurchaseClick = () => {
        if (!isLoggedIn) {
            // Flow 1: ยังไม่ Login
            alert("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ");
            // เด้งไปหน้า Login และ "จำ" หน้าปัจจุบันไว้ (location)
            navigate('/login', { state: { from: location } });
        } else {
            // Flow 2: Login แล้ว
            // เด้งไปหน้า PurchasePage ที่คุณสร้างไว้
            navigate(`/courses/${id}/purchase`);
        }
    };

    // --- Loading State ---
    if (loading) {
        // ... (เหมือนเดิม) ...
        return (
            <div className={styles.pageContainer}>
                <h2>กำลังโหลดรายละเอียดคอร์ส...</h2>
            </div>
        );
    }
    
    // --- Error & Not Found State ---
    if (error || !course) {
        // ... (เหมือนเดิม) ...
        return (
            <div>
                <h2>404 - {error || 'ไม่พบคอร์ส'}</h2>
                <Link to="/catalog">&larr; กลับไปหน้า Catalog</Link>
            </div>
        );
    }

    // --- Mapping Data (เหมือนเดิม) ---
    const categoryName = course.category?.name || 'Uncategorized';
    const instructorName = course.instructor?.name || 'Unknown Instructor';
    // const instructorBio = course.instructor?.bio || 'ไม่มีประวัติผู้สอน';
    const totalDurationText = 'ยังไม่ระบุ'; 
    const { mappedSections, totalLessons, totalQuizzes, totalWorkshops } = mapSectionsForDisplay(course.sections || []);
    const metaData = [
        { icon: '📚', text: `${totalLessons} บทเรียน` },
        { icon: '🧪', text: `${totalQuizzes} แบบทดสอบ` },
        { icon: '🛠️', text: `${totalWorkshops} เวิร์กชอป` },
        { icon: '🕒', text: totalDurationText },
        { icon: '/images/certificate.png', text: 'ประกาศนียบัตรเมื่อจบคอร์ส' }
    ];
    const contentHtml = `
        <h2>เกี่ยวกับคอร์ส: ${course.title}</h2>
        <p>${course.description || 'ไม่มีคำอธิบายโดยละเอียดสำหรับคอร์สนี้'}</p>
        <h3>ผู้สอน: ${instructorName}</h3>
        <h2>สารบัญคอร์ส (${totalLessons} บทเรียน)</h2>
        ${mappedSections.map(section => `
            <h4>${section.title} (${section.lessons.length} บท)</h4>
            <ul>
                ${section.lessons.map(lesson => `<li>${lesson.title}</li>`).join('')}
            </ul>
        `).join('')}
    `;
    const mockTags = ['HTML', 'Frontend', categoryName.toUpperCase()];
    const mockTools = [
        { name: 'VS Code', icon: '/images/vscode-logo.png' }
    ];

    // --- 8. ⭐️ (แก้ไข) JSX Render (ส่วน Sidebar) ---
    return (
        <div className={styles.pageContainer}>
            
            {/* --- คอลัมน์ซ้าย (Main Content) --- */}
            <div className={styles.mainContent}>
                {/* ... (ส่วนนี้เหมือนเดิมทั้งหมด) ... */}
                <nav className={styles.breadcrumbs}>
                    <Link to="/catalog">Catalog</Link> &gt; 
                    <Link to={`/catalog/${categoryName.toLowerCase().replace(' ', '-')}`}> {categoryName}</Link> &gt; 
                    <span> {course.title}</span>
                </nav>
                <img
                    src={getBannerSrc(course.thumbnail)}
                    alt={course.title}
                    className={styles.featureBanner}
                    onError={(e) => { e.currentTarget.src = '/images/default-banner.png'; }}
                />
                <nav className={styles.subNav}>
                    <a href="#about" className={styles.subNavLinkActive}>เกี่ยวกับ</a>
                </nav>
                <div 
                    id="about"
                    className={styles.contentBody} 
                    dangerouslySetInnerHTML={{ __html: contentHtml }} 
                />
            </div>

            {/* --- คอลัมน์ขวา (Sidebar) --- */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarCard}>
                    <div className={styles.price}>
                        {course.price} <span>บาท</span>
                    </div>
                    
                    {/* ✅ ⭐️ (จุดที่แก้ไข)
                      ใช้ 'isEnrolled' เป็นตัวสลับปุ่ม
                      เราใช้ 'styles.enrollButton' ทั้งสองปุ่มเพื่อกัน CSS พัง 
                    */}
                    {isEnrolled ? (
                        // A. ถ้าซื้อแล้ว: แสดงปุ่ม "เข้าสู่บทเรียน"
                        <button 
                            className={styles.enrollButton}
                            onClick={handleEnrollClick} 
                        >
                            เข้าสู่บทเรียน
                        </button>
                    ) : (
                        // B. ถ้ายังไม่ซื้อ: แสดงปุ่ม "สั่งซื้อคอร์สนี้"
                        <button 
                            className={styles.enrollButton} // ⬅️ ใช้ Style เดียวกัน
                            onClick={handlePurchaseClick}   // ⬅️ แต่ใช้คนละ Handler
                        >
                            สั่งซื้อคอร์สนี้
                        </button>
                    )}

                    {/* Meta List (เหมือนเดิม) */}
                    <ul className={styles.metaList}>
                        {metaData.map((item, index) => (
                            <li key={index} className={styles.metaItem}>
                                {item.icon.startsWith('/') ? (
                                    <img src={item.icon} alt="" className={styles.metaIcon} />
                                ) : (
                                    <span className={styles.metaEmoji}>{item.icon}</span>
                                )}
                                {item.text}
                            </li>
                        ))}
                    </ul>
                    
                    {/* Tags (เหมือนเดิม) */}
                    <div className={styles.tagGroup}>
                        {mockTags.map((tag, index) => (
                            <span key={index} className={styles.tag}>{tag}</span>
                        ))}
                    </div>

                    {/* Tools (เหมือนเดิม) */}
                    <div className={styles.toolsGroup}>
                        <h4 className={styles.toolsTitle}>
                            ซอฟต์แวร์แนะนำสำหรับคอร์สนี้
                        </h4>
                        <ul className={styles.toolsList}>
                            {mockTools.map((tool, index) => (
                                <li key={index} className={styles.toolItem}>
                                    <img src={tool.icon} alt={tool.name} className={styles.toolIcon} />
                                    {tool.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}