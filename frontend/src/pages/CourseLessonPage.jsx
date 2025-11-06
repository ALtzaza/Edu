import React, { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useOutletContext,
} from "react-router-dom";
import QuizComponent from "../components/QuizComponent";
import WorkshopComponent from "../components/WorkshopComponent"; // 🟢 1. IMPORT COMPONENT ใหม่

import styles from "./CourseLessonPage.module.css";

// 🟢 กำหนดประเภทบทเรียน Workshop
const LESSON_TYPE_WORKSHOP = 'workshop'; 
// 🟢 กำหนดเกณฑ์และจำนวนครั้งสูงสุด (ปรับแก้ได้ที่นี่)
const MAX_ATTEMPTS = 3; 
const PASSING_GRADE = 70; 


// 💡 Helper Function เพื่อจัดโครงสร้างสารบัญให้ใช้งานง่าย
const mapSectionsForSidebar = (sections, currentLessonId) => {
  return sections.map((section) => ({
    title: section.title,
    lessons: section.lessons.map((lesson) => ({
      title: lesson.title,
      _id: lesson._id,
      isActive: lesson._id === currentLessonId,
    })),
  }));
};

// 🟢 Component ใหม่สำหรับแสดงกฎ (Rules/Start Screen) และประวัติการทำควิซ
const QuizStartScreen = ({ lessonTitle, onStart, quizRules }) => {
    const { 
        totalQuestions, 
        passingGrade, 
        attemptsLeft, 
        isPassed, 
        lastAttempt,
        canTakeQuiz,
        history
    } = quizRules;

    const passingScore = Math.ceil(totalQuestions * (passingGrade / 100));

    // 💡 ส่วนแสดงผลลัพธ์ล่าสุด
    const LastAttemptResult = () => {
        if (!lastAttempt) return null;
        
        const score = lastAttempt.score || 0;
        const scorePercentage = (score / totalQuestions * 100);
        const isLastPassed = lastAttempt.passed || scorePercentage >= passingGrade;

        return (
            <div className={`${styles.resultContainer} ${isLastPassed ? styles.resultSuccess : styles.resultFail}`}>
                <h4>ผลการทำครั้งล่าสุด (ครั้งที่ {lastAttempt.attemptNumber})</h4>
                <p>
                    คะแนน: **{score}/{totalQuestions}** (**{scorePercentage.toFixed(2)}%**)
                </p>
                <p>สถานะ: **{isLastPassed ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}**</p>
            </div>
        );
    };

    return (
        <div className={styles.quizStartContainer}>
            <div className={styles.quizHeader}>
                <h3 className={styles.quizTitle}>{lessonTitle} (แบบทดสอบเก็บคะแนน)</h3>
                {isPassed && <h2 className={styles.passedMessage}>✅ คุณผ่านแบบทดสอบนี้แล้ว!</h2>}
                <p className={styles.quizSubtitle}>แบบทดสอบความเข้าใจครั้งที่ 1</p>
            </div>

            <LastAttemptResult />
            
            <div className={styles.quizDetails}>
                <p>แบบทดสอบมีจำนวน **{totalQuestions} ข้อ**</p>
                <p>กรุณาตรวจสอบความถูกต้องก่อนกดส่งคำตอบ เพราะคุณสามารถส่งคำตอบได้เพียง 1 ครั้ง/การพยายาม</p>
            </div>

            {history && history.length > 0 && (
                <div className={styles.quizHistorySection}>
                    <h4>📋 ประวัติการทำแบบทดสอบ ({history.length} ครั้ง)</h4>
                    <ul className={styles.historyList}>
                        {history.map((attempt, index) => (
                            <li key={attempt._id} className={attempt.passed ? styles.historyPassed : styles.historyFailed}>
                                <span>
                                    ครั้งที่ {attempt.attemptNumber}: 
                                    **{attempt.score}/{attempt.total}** ({attempt.percentage.toFixed(2)}%)
                                </span>
                                <span>
                                    สถานะ: **{attempt.passed ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}**
                                </span>
                                
                            </li>
                        ))}
                    </ul>
                </div>
            )}


            <div className={styles.quizMetrics}>
                <div className={styles.quizAlert}>
                    <p>⚠️ การทำแบบทดสอบนี้มีผลต่อการออกใบรับรอง (Certificate)</p>
                    
                    {!isPassed && (
                        <p className={styles.alertNote}>หากทำไม่ผ่านในจำนวนครั้งที่กำหนดจะไม่ได้ใบรับรอง*</p>
                    )}

                    <p>
                        เกณฑ์คะแนนที่ผ่าน: **{passingGrade}%** (ต้องได้ **{passingScore} ข้อ** ขึ้นไป)
                    </p>
                    <p>จำนวนครั้งที่เหลือ: **{Math.max(0, attemptsLeft)} ครั้ง**</p>
                    
                    {canTakeQuiz ? (
                        <button onClick={onStart} className={styles.startQuizButton}>
                            เริ่มทำ/ทำควิซต่อ
                        </button>
                    ) : (
                        <button disabled className={styles.disabledButton}>
                            {isPassed ? "คุณผ่านแล้ว" : "หมดสิทธิ์ทำแล้ว"}
                        </button>
                    )}
                    
                    {attemptsLeft <= 0 && !isPassed && (
                        <p className={styles.alertNoteRed}>**คุณทำครบตามจำนวนครั้งที่กำหนดแล้ว และยังไม่ผ่านเกณฑ์**</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ✅ Component "หลัก" (CourseLessonPage) ✅
export default function CourseLessonPage() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext(); 
    const API_BASE_URL = "http://localhost:3000"; 

    const [lesson, setLesson] = useState(null);
    const [courseSections, setCourseSections] = useState([]);
    const [courseTitle, setCourseTitle] = useState("กำลังโหลดคอร์ส...");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({ percentage: 0, totalLessons: 1 });
    
    // 🟢 State สำหรับเก็บข้อมูลจริงของควิซและผลลัพธ์ (รวมถึง History)
    const [quizMetrics, setQuizMetrics] = useState({
        totalQuestions: 0,
        lastAttempt: null, 
        attemptsMade: 0, 
        isPassed: false, 
        history: []
    });
    
    // 🟢 State ใหม่สำหรับ Workshop
    const [userWorkshop, setUserWorkshop] = useState(null);
    const [isWorkshopLesson, setIsWorkshopLesson] = useState(false);
    
    // 🟢 สถานะใหม่: จัดการว่าจะแสดง Rules หรือ Quiz จริง
    const [quizState, setQuizState] = useState('rules'); // 'rules' | 'taking' 

    const trackLesson = async (courseId, lessonId) => {
        console.log(
            `[Mock Track] Lesson ${lessonId} in course ${courseId} is being watched.`
        );
    };

    // 🟢 ฟังก์ชันใหม่: ดึงข้อมูลเมตริกของควิซ (จำนวนข้อ, ผลลัพธ์)
    const fetchQuizMetrics = useCallback(async (id) => {
        try {
            const quizResponse = await fetch(`${API_BASE_URL}/api/lessons/${id}/quizzes/take`);
            if (!quizResponse.ok) throw new Error("Failed to fetch quiz data");
            const quizzes = await quizResponse.json();
            const totalQuestions = quizzes.length;
            
            const resultResponse = await fetch(`${API_BASE_URL}/api/lessons/${id}/results/me`);
            if (!resultResponse.ok) throw new Error("Failed to fetch quiz results");
            const results = await resultResponse.json(); 

            // ผลลัพธ์ถูกจัดเรียงจากใหม่ไปเก่าใน Backend แล้ว
            const attemptsMade = results.length;
            const lastAttempt = attemptsMade > 0 ? results[0] : null; 
            
            // ตรวจสอบว่าเคยผ่านแล้วหรือไม่
            const isPassed = results.some(r => r.passed); 
            
            // เตรียม History โดยกำหนดเลขครั้งจากเก่าไปใหม่ (หรือใหม่ไปเก่าตามที่ Backend จัดเรียง)
            const history = results.map((r, i) => ({ 
                ...r, 
                // กำหนดเลขครั้งจาก 1 ถึง N (เก่าไปใหม่)
                attemptNumber: attemptsMade - i, 
            })).reverse(); 

            setQuizMetrics({
                totalQuestions,
                lastAttempt: lastAttempt ? { ...lastAttempt, attemptNumber: attemptsMade } : null,
                attemptsMade,
                isPassed,
                history,
            });
        } catch (err) {
            console.error("Error fetching quiz metrics:", err);
            setError("ไม่สามารถดึงข้อมูลควิซ/ผลลัพธ์ได้");
        }
    }, [API_BASE_URL]);

    // 🟢 ฟังก์ชันใหม่: ดึงข้อมูล Workshop ของผู้ใช้
    const fetchUserWorkshop = useCallback(async (courseId, lessonId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/lessons/${lessonId}/workshops/me`);
            if (!response.ok) throw new Error("Failed to fetch workshop data");
            const result = await response.json();
            
            if (result.success) {
                setUserWorkshop(result.data); // Workshop object หรือ null
            } else {
                setUserWorkshop(null);
            }
        } catch (err) {
            console.error("Error fetching user workshop:", err);
            // ไม่ต้อง setError รุนแรง เพราะมันอาจจะแค่ยังไม่เคยส่ง
        }
    }, [API_BASE_URL]);

    // 💡 แก้ไข fetchLesson ให้กำหนด isWorkshopLesson
    const fetchLesson = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/lessons/${id}`);
            if (!response.ok) throw new Error("Lesson not found");
            const result = await response.json();
            if (result.success && result.data) {
                setLesson(result.data);
                setQuizState('rules'); 
                // 🟢 กำหนดสถานะว่าเป็นบทเรียน Workshop หรือไม่
                setIsWorkshopLesson(result.data.type === LESSON_TYPE_WORKSHOP); 
            } else {
                setLesson(null);
                setError("ไม่พบบทเรียน");
            }
        } catch (err) {
            setError(err.message);
            console.error("Error fetching lesson:", err);
        }
    }, [API_BASE_URL]);

    const fetchCourseSections = useCallback(
        async (id) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/courses/${id}`);
                if (!response.ok) throw new Error("Course not found");
                const result = await response.json();
                if (result.success && result.data) {
                    const fetchedTitle = result.data.title;
                    setCourseTitle(fetchedTitle);
                    setPageTitle(fetchedTitle);
                    setCourseSections(result.data.sections || []);
                }
            } catch (err) {
                console.error("Error fetching course sections:", err);
                setPageTitle("ข้อผิดพลาด");
            }
        },
        [setPageTitle, API_BASE_URL]
    );

    // 💡 แก้ไข useEffect ให้เรียก fetchUserWorkshop ด้วย
    useEffect(() => {
        if (courseId && lessonId) {
            setLoading(true);
            setError(null);
            setUserWorkshop(null); // Reset workshop state on lesson change

            // 🟢 เรียก API ทั้งหมดพร้อมกัน (เพิ่ม fetchUserWorkshop)
            Promise.all([
                fetchCourseSections(courseId), 
                fetchLesson(lessonId),
                fetchQuizMetrics(lessonId),
                fetchUserWorkshop(courseId, lessonId) // 🟢 New API call
            ])
                .then(() => {
                    setProgress({ percentage: 21, totalLessons: 20 });
                    trackLesson(courseId, lessonId);
                })
                .finally(() => setLoading(false));
        }
    }, [courseId, lessonId, fetchCourseSections, fetchLesson, fetchQuizMetrics, fetchUserWorkshop]); // 🟢 เพิ่ม dependency

    // 🟢 ฟังก์ชันใหม่: รองรับการเสร็จสิ้นทั้ง Quiz และ Workshop
    const handleActionFinished = async (isQuiz = false) => {
        // 1. ถ้าเป็น Quiz
        if (isQuiz) {
            setQuizState('rules');
            await fetchQuizMetrics(lessonId); // ดึงข้อมูล Quiz ใหม่
        } else {
            // 2. ถ้าเป็น Workshop
            await fetchUserWorkshop(courseId, lessonId); // ดึงข้อมูล Workshop ใหม่
        }
    };


    // --- Loading & Error States ---
    if (loading) return <div>กำลังโหลดบทเรียน...</div>;
    if (error || !lesson) {
        setPageTitle("ไม่พบบทเรียน");
        return <div>ไม่สามารถเข้าถึงบทเรียนนี้ได้: {error}</div>;
    }

    // 💡 เตรียม Data สำหรับ Sidebar
    const mappedSections = mapSectionsForSidebar(courseSections, lesson._id);
    const isQuizLesson = lesson.quizzes && lesson.quizzes.length > 0;

    // 🟢 เตรียม Quiz Rules/Metrics สำหรับส่งให้ QuizStartScreen
    const quizRulesForStartScreen = {
        totalQuestions: quizMetrics.totalQuestions || (lesson.quizzes ? lesson.quizzes.length : 0),
        passingGrade: PASSING_GRADE,
        attemptsLeft: MAX_ATTEMPTS - quizMetrics.attemptsMade,
        isPassed: quizMetrics.isPassed,
        lastAttempt: quizMetrics.lastAttempt,
        canTakeQuiz: !quizMetrics.isPassed && quizMetrics.attemptsMade < MAX_ATTEMPTS,
        history: quizMetrics.history, // 🟢 ส่งประวัติทั้งหมด
    };


    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                {/* --- Main Content (วิดีโอ & เนื้อหา) --- */}
                <div className={styles.mainLessonContent}>
                    {/* 1. Header (แสดงเสมอ) */}
                    <header className={styles.lessonHeader}>
                        <h2 className={styles.lessonTitle}>{lesson.title}</h2>
                        <Link to={`/courses/${courseId}`} className={styles.backToCourse}>
                            &larr; กลับไปยังหน้าคอร์ส: {courseTitle}
                        </Link>
                    </header>

                    {/* 2. Video Player (แสดงเสมอ เพราะคุณต้องการให้วิดีโออยู่ด้านบน) */}
                    <div className={styles.videoPlayer}>
                        {lesson.videoUrl ? (
                            <iframe
                                src={lesson.videoUrl}
                                title={lesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className={styles.videoFrame}
                            ></iframe>
                        ) : (
                            <div className={styles.noVideoPlaceholder}>
                                วิดีโออยู่ระหว่างการอัปโหลด
                            </div>
                        )}
                    </div>

                    {/* 3. Content Body (พื้นที่แสดงเนื้อหา หรือ Quiz / Workshop) */}
                    <div className={styles.contentBody}>
                        {isWorkshopLesson ? ( // 🟢 Logic สำหรับ Workshop Lesson
                            <WorkshopComponent
                                courseId={courseId}
                                lessonId={lessonId}
                                lessonTitle={lesson.title}
                                workshopData={userWorkshop} // ส่งข้อมูลสถานะปัจจุบัน
                                onSubmissionSuccess={() => handleActionFinished(false)} // Callback เมื่อส่งสำเร็จ (ส่ง false = ไม่ใช่ Quiz)
                            />
                        ) : isQuizLesson ? (
                            // 🟢 Logic สำหรับ Quiz Lesson: แสดง Rules หรือ Taking
                            quizState === 'rules' ? (
                                <QuizStartScreen 
                                    lessonTitle={lesson.title}
                                    onStart={() => setQuizState('taking')} 
                                    quizRules={quizRulesForStartScreen}
                                />
                            ) : (
                                // 🟢 ถ้า quizState เป็น 'taking' จะแสดงคำถามควิซ
                                <QuizComponent 
                                    lessonId={lessonId} 
                                    lessonTitle={lesson.title}
                                    courseId={courseId}
                                    onQuizFinished={() => handleActionFinished(true)} // 💡 แก้ไข handler (ส่ง true = Quiz)
                                />
                            )
                        ) : (
                            // 🟡 Logic สำหรับ Video/Content Lesson (แสดง Content Text)
                            <>
                                {lesson.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                ) : (
                                    <div className={styles.noContentPlaceholder}>
                                        <p>
                                            บทเรียนนี้ไม่มีเนื้อหาข้อความประกอบ สามารถรับชมเนื้อหาได้จากวิดีโอด้านบน
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* 4. Navigation (ปุ่มถัดไป/ก่อนหน้า) - แสดงเฉพาะเมื่อไม่ใช่ควิซ */}
                    {/* {!isQuizLesson && (
                        <div className={styles.lessonNav}>
                            <button className={styles.navButton} disabled>
                                &larr; บทเรียนก่อนหน้า
                            </button>
                            <button className={styles.navButton}>
                                บทเรียนถัดไป &rarr;
                            </button>
                        </div>
                    )} */}
                </div>

                {/* --- Sidebar (สารบัญ) --- */}
                <div className={styles.sidebar}>
                    <div className={styles.progressHeader}>
                        <div className={styles.progressText}>ความคืบหน้า</div>
                        <div className={styles.progressBarWrapper}>
                            <div
                                className={styles.progressBar}
                                style={{ width: `${progress.percentage}%` }}
                            ></div>
                        </div>
                        <div className={styles.progressTextRight}>
                            {courseTitle} **{progress.percentage}%**
                        </div>
                    </div>

                    {/* สารบัญ Section/Lesson */}
                    {mappedSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                SECTION {sectionIndex + 1} {section.title}
                            </h3>
                            <ul className={styles.lessonList}>
                                {section.lessons.map((item, lessonIndex) => (
                                    <li
                                        key={item._id}
                                        className={`${styles.lessonItem} ${
                                            item.isActive ? styles.activeLesson : ""
                                        }`}
                                    >
                                        <Link
                                            to={`/lessons/${courseId}/${item._id}`}
                                            className={styles.lessonLink}
                                        >
                                            <span className={styles.lessonIcon}>
                                                {item.isActive ? "▶️" : "📄"} 
                                            </span>
                                            {item.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* ส่วนของห้องพูดคุย (Mock) */}
                    {/* <div className={styles.discussionSection}>
                        <h4>💬 ห้องพูดคุย สอบถาม แลกเปลี่ยนความคิดเห็น</h4>
                        <p>และผู้สอนจะใช้เวลาทุกท่านเข้ามาตอบข้อซักถามในอาการะชมรม</p>
                        <button className={styles.discussButton}>ไปที่ห้องพูดคุย</button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}