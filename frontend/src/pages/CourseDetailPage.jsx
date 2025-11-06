import React, { useState, useEffect } from 'react'; // 1. นำเข้า useState
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import styles from './CourseDetailPage.module.css'; 

// --- Database จำลอง (Mock Data) ถูกลบออก ---
// ********* MOCK DATA ถูกลบออก *********

// ฟังก์ชันสำหรับแปลง Section/Lesson Data (ใช้ในภายหลังเพื่อแสดงสารบัญ)
const mapSectionsForDisplay = (sections) => {
    // ในที่นี้เราจะรวมการนับชั่วโมงและบทเรียน
    let totalLessons = 0;
    // เราจะดึงเฉพาะข้อมูลที่จำเป็นจากโครงสร้าง API ของคุณ
    const mappedSections = sections.map(section => {
        const lessons = section.lessons || [];
        totalLessons += lessons.length;
        
        return {
            title: section.title,
            lessons: lessons.map(lesson => ({
                title: lesson.title,
                _id: lesson._id
            }))
        };
    });

    return { mappedSections, totalLessons };
}


// ✅ Component "หลัก" (CourseDetailPage) ✅
export default function CourseDetailPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext(); 

    // 1. สร้าง State สำหรับเก็บข้อมูลคอร์สจริง
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- โลจิก Fetch Data ---
    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            setError(null);
            
            // ในโหมด Dev ใช้ Proxy, แต่ถ้ายังติด error เดิมให้ใช้ Absolute URL
            // const apiUrl = `/api/courses/${id}`;
            // const API_BASE_URL = 'http://localhost:3000'; // ถ้า Proxy ไม่ทำงาน
            
            try {
                const API_BASE_URL = 'http://localhost:3000';
                const response = await fetch(`${API_BASE_URL}/api/courses/${id}`); // หรือ fetch(`${API_BASE_URL}${apiUrl}`)
                
                if (!response.ok) {
                    throw new Error(`Course not found or network error: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setCourse(result.data);
                    setPageTitle(result.data.title);
                } else {
                    setCourse(null);
                    setPageTitle("Course Not Found");
                }

            } catch (err) {
                console.error("Failed to fetch course details:", err);
                setError("ไม่สามารถดึงรายละเอียดคอร์สนี้ได้");
                setPageTitle("Course Not Found");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourse();
        }
    }, [id, setPageTitle]); 


    // --- Handlers ---
    const handleEnrollClick = () => {
  if (course && course.sections && course.sections.length > 0) {
        const firstSection = course.sections[0];
        if (firstSection.lessons && firstSection.lessons.length > 0) {
            const firstLessonId = firstSection.lessons[0]._id;
            // นำทางไปยังหน้าบทเรียนแรก: /lessons/:courseId/:lessonId
            navigate(`/lessons/${id}/${firstLessonId}`); 
            return;
        }
    }
    // หากไม่พบบทเรียนแรก ให้นำทางไปหน้า Index ของคอร์ส
    navigate(`/lessons/${id}`);
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <h2>กำลังโหลดรายละเอียดคอร์ส...</h2>
            </div>
        );
    }
    
    // --- Error & Not Found State ---
    if (error || !course) {
        return (
            <div>
                <h2>404 - {error || 'ไม่พบคอร์ส'}</h2>
                <Link to="/catalog">&larr; กลับไปหน้า Catalog</Link>
            </div>
        );
    }

    // --- Mapping Data จาก API ไปเป็น Format สำหรับ Render ---
    
    // *️⃣ Data จาก API: course.category.name, course.instructor.name, course.sections (Array)
    const categoryName = course.category?.name || 'Uncategorized';
    const instructorName = course.instructor?.name || 'Unknown Instructor';
    const instructorBio = course.instructor?.bio || 'ไม่มีประวัติผู้สอน';
    const totalDurationText = 'ยังไม่ระบุ'; // 💡 คุณต้องคำนวณหรือเพิ่ม field ใน Backend
    
    // 💡 การจัดการสารบัญ (Sections/Lessons)
    const { mappedSections, totalLessons } = mapSectionsForDisplay(course.sections || []);

    // 💡 Mock/Hardcoded Meta Data (ควรรวมเข้ากับ API ถ้าเป็นไปได้)
    const metaData = [
        { icon: '📚', text: `${totalLessons} บทเรียน` }, // ⬅ ใช้ค่าที่คำนวณ
        { icon: '🕒', text: totalDurationText }, // ⬅ ต้องคำนวณ/ดึงจาก API
        { icon: '📋', text: 'แบบทดสอบ 8 ชุด' }, // ⬅ Mock
        { icon: '/images/certificate.png', text: 'ประกาศนียบัตรเมื่อจบคอร์ส' } // ⬅ Mock
    ];
    
    // *️⃣ โครงสร้างเนื้อหาหลัก (Content Body)
    const contentHtml = `
        <h2>เกี่ยวกับคอร์ส: ${course.title}</h2>
        <p>${course.description || 'ไม่มีคำอธิบายโดยละเอียดสำหรับคอร์สนี้'}</p>
        
        <h3>ผู้สอน: ${instructorName}</h3>
        <p>${instructorBio}</p>
        
        <h2>สารบัญคอร์ส (${totalLessons} บทเรียน)</h2>
        ${mappedSections.map(section => `
            <h4>${section.title} (${section.lessons.length} บท)</h4>
            <ul>
                ${section.lessons.map(lesson => `<li>${lesson.title}</li>`).join('')}
            </ul>
        `).join('')}
    `;

    // *️⃣ Tools/Tags (ยังต้อง Hardcode จนกว่าจะมี field ใน Schema)
    const mockTags = ['HTML', 'Frontend', categoryName.toUpperCase()];
    const mockTools = [
        { name: 'VS Code', icon: '/images/vscode-logo.png' }
    ];


    return (
        <div className={styles.pageContainer}>
            
            {/* --- คอลัมน์ซ้าย (Main Content) --- */}
            <div className={styles.mainContent}>
                
                <nav className={styles.breadcrumbs}>
                    {/* Breadcrumbs */}
                    <Link to="/catalog">Catalog</Link> &gt; 
                    <Link to={`/catalog/${categoryName.toLowerCase().replace(' ', '-')}`}> {categoryName}</Link> &gt; 
                    <span> {course.title}</span>
                </nav>

                <img 
                    src={course.thumbnail || '/images/default-banner.png'} // ⬅ ใช้ thumbnail
                    alt={course.title} 
                    className={styles.featureBanner} 
                />

                <nav className={styles.subNav}>
                    {/* Sub Navigation (Sticky) */}
                    <a href="#about" className={styles.subNavLinkActive}>เกี่ยวกับ</a>
                    {/* อาจเพิ่ม Link ไปยัง สารบัญ, รีวิว, ผู้สอน */}
                </nav>

                {/* เนื้อหา "เกี่ยวกับ" */}
                <div 
                    id="about"
                    className={styles.contentBody} 
                    // ⬅ ใช้ contentHtml ที่เราสร้างจาก API Data
                    dangerouslySetInnerHTML={{ __html: contentHtml }} 
                />
            </div>

            {/* --- คอลัมน์ขวา (Sidebar) --- */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarCard}>
                    <div className={styles.price}>
                        {course.price} <span>บาท</span>
                    </div>
                    
                    {/* ✅ ปุ่มสมัครเรียน */}
                    <button 
                        className={styles.enrollButton}
                        onClick={handleEnrollClick} 
                    >
                        เข้าสู่บทเรียน
                    </button>

                    {/* Meta List (Icon/Emoji Check) */}
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
                    
                    {/* Tags */}
                    <div className={styles.tagGroup}>
                        {mockTags.map((tag, index) => (
                            <span key={index} className={styles.tag}>{tag}</span>
                        ))}
                    </div>

                    {/* Tools/Software แนะนำ */}
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