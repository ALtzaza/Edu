import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useOutletContext,
} from "react-router-dom";
import QuizComponent from "../components/QuizComponent";
import WorkshopComponent from "../components/WorkshopComponent";
import { useAuth } from "../context/AuthContext";

import styles from "./CourseLessonPage.module.css";

const LESSON_TYPE_WORKSHOP = 'workshop'; 
const MAX_ATTEMPTS = 3; 
const PASSING_GRADE = 70; 

// (Helper Function ... ไม่มีการแก้ไข ... )
const mapSectionsForSidebar = (sections = [], currentLessonId) => {
  return sections.map((section) => {
    const lessons = section.lessons || [];
    const sectionId =
      section._id?.toString() ??
      section.id?.toString() ??
      section.sectionId?.toString() ??
      section.title;
    const isActiveSection = lessons.some(
      (lesson) => lesson._id === currentLessonId
    );

    return {
      title: section.title,
      sectionId,
      isActive: isActiveSection,
      lessons: lessons.map((lesson) => ({
        title: lesson.title,
        _id: lesson._id,
        isActive: lesson._id === currentLessonId,
      })),
    };
  });
};

// (QuizStartScreen Component ... ไม่มีการแก้ไข ... )
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
    const LastAttemptResult = () => {
        if (!lastAttempt) return null;
        const score = lastAttempt.score || 0;
        const scorePercentage = totalQuestions > 0 ? (score / totalQuestions * 100) : 0;
        const isLastPassed = lastAttempt.passed || scorePercentage >= passingGrade;
        return (
            <div className={`${styles.resultContainer} ${isLastPassed ? styles.resultSuccess : styles.resultFail}`}>
                <h4>ผลการทำครั้งล่าสุด (ครั้งที่ {lastAttempt.attemptNumber})</h4>
                <p>คะแนน: **{score}/{totalQuestions}** (**{scorePercentage.toFixed(2)}%**)</p>
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
                                <span>ครั้งที่ {attempt.attemptNumber}: **{attempt.score}/{attempt.total}** ({attempt.percentage.toFixed(2)}%)</span>
                                <span>สถานะ: **{attempt.passed ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}**</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className={styles.quizMetrics}>
                <div className={styles.quizAlert}>
                    <p>⚠️ การทำแบบทดสอบนี้มีผลต่อการออกใบรับรอง (Certificate)</p>
                    {!isPassed && (<p className={styles.alertNote}>หากทำไม่ผ่านในจำนวนครั้งที่กำหนดจะไม่ได้ใบรับรอง*</p>)}
                    <p>เกณฑ์คะแนนที่ผ่าน: **{passingGrade}%** (ต้องได้ **{passingScore} ข้อ** ขึ้นไป)</p>
                    <p>จำนวนครั้งที่เหลือ: **{Math.max(0, attemptsLeft)} ครั้ง**</p>
                    {canTakeQuiz ? (
                        <button onClick={onStart} className={styles.startQuizButton}>เริ่มทำ/ทำควิซต่อ</button>
                    ) : (
                        <button disabled className={styles.disabledButton}>{isPassed ? "คุณผ่านแล้ว" : "หมดสิทธิ์ทำแล้ว"}</button>
                    )}
                    {attemptsLeft <= 0 && !isPassed && (
                        <p className={styles.alertNoteRed}>**คุณทำครบตามจำนวนครั้งที่กำหนดแล้ว และยังไม่ผ่านเกณฑ์**</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ⭐️ (เพิ่ม) Component Modal ใหม่ สำหรับแจ้งเตือน "บังคับเรียนใหม่"
// ⭐️ (เพิ่ม) Component Modal ใหม่ สำหรับแจ้งเตือน "บังคับเรียนใหม่"
const FailResetModal = ({ onClose }) => {
    return (
        <div className={styles.resetModalCenteredOverlay}>
            <div className={styles.resetModalCentered}>
                <h3>⚠️ คุณใช้สิทธิ์ทำแบบทดสอบครบแล้ว</h3>
                <p>คุณทำแบบทดสอบนี้ครบ {MAX_ATTEMPTS} ครั้งแล้ว และยังไม่ผ่านเกณฑ์</p>
                <p className={styles.retakeNote}>
                    ระบบจะทำการรีเซ็ตความคืบหน้า (ติ๊กถูก ✅) ทั้งหมดใน Section นี้
                    และนำคุณกลับไปทบทวนบทเรียนแรกของ Section ใหม่อีกครั้ง
                </p>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.retakeButton}> 
                        ตกลง, กลับไปเรียนใหม่
                    </button>
                </div>
            </div>
        </div>
    );
};


// ✅ Component "หลัก" (CourseLessonPage) ✅
export default function CourseLessonPage() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext(); 
    const API_BASE_URL = "http://localhost:3000"; 
    const { user } = useAuth?.() || {};

    const [lesson, setLesson] = useState(null);
    const [courseSections, setCourseSections] = useState([]);
    const [courseTitle, setCourseTitle] = useState("กำลังโหลดคอร์ส...");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({
        percentage: 0,
        totalLessons: 1, 
        completedLessons: 0,
        completedLessonIds: [],
    });
    
    const [quizMetrics, setQuizMetrics] = useState({
        totalQuestions: 0,
        lastAttempt: null, 
        attemptsMade: 0, 
        isPassed: false, 
        history: []
    });
    
    const [userWorkshop, setUserWorkshop] = useState(null);
    const [isWorkshopLesson, setIsWorkshopLesson] = useState(false);
    
    const [isQuizLesson, setIsQuizLesson] = useState(false); 

    const videoRef = useRef(null);
    const lastAllowedTimeRef = useRef(0);
    const [isVideoFinished, setIsVideoFinished] = useState(false);
    const [isConfirmWatched, setIsConfirmWatched] = useState(false);
    
    const [quizState, setQuizState] = useState('rules'); 
    const [expandedSections, setExpandedSections] = useState({});

    // ⭐️ (เพิ่ม) State ใหม่สำหรับ Modal บังคับเรียนใหม่
    const [showFailResetModal, setShowFailResetModal] = useState(false);

    // (useCallback functions ... trackLesson, fetchProgress, markCurrentLessonComplete ... ไม่มีการแก้ไข ...)
    const trackLesson = useCallback(async (courseIdParam, lessonIdParam) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/api/progresses/mark-complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                    body: JSON.stringify({ 
                       courseId: courseIdParam,
                           lessonId: lessonIdParam 
                    }),
            });
            if (!response.ok) {
                throw new Error("Failed to mark lesson as complete");
            }
            const result = await response.json();
            if (result.success && result.data) {
                const newProgressState = {
                    percentage: result.data.percentage,
                    completedLessons: result.data.lessonsCompleted?.length || 0,
                    totalLessons: result.data.totalLessons || 1, 
                    completedLessonIds: result.data.lessonsCompleted?.map(l => typeof l === 'string' ? l : l?._id) || [],
                };
                setProgress(newProgressState);
                return newProgressState; 
            }
        } catch (err) {
            console.error("Error tracking lesson progress:", err);
        }
        return null; 
    }, [API_BASE_URL]);

    const fetchProgress = useCallback(async (courseIdParam) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                const defaultProgress = { 
                   percentage: 0, totalLessons: 1, completedLessons: 0, completedLessonIds: [] 
                };
                setProgress(defaultProgress);
                return defaultProgress; 
            }
            const response = await fetch(`${API_BASE_URL}/api/progresses/${courseIdParam}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch progress");
            const result = await response.json();
            if (result.success && result.data) {
                const {
                    percentage = 0,
                    totalLessons = 0,
                    lessonsCompleted = [],
                } = result.data;
                console.log("--- DEBUG fetchProgress: totalLessons from backend =", totalLessons, "lessonsCompleted.length =", lessonsCompleted.length);
                const completedLessons = Array.isArray(lessonsCompleted)
                    ? lessonsCompleted.length
                    : 0;
                const safeTotalLessons = Math.max(
                    totalLessons || 0,
                    1 
                );
                const clampedPercentage = Math.max(
                    0,
                    Math.min(100, Number(percentage) || 0)
                );
                
                const newProgressState = {
                    percentage: clampedPercentage,
                    totalLessons: safeTotalLessons,
                    completedLessons,
                    completedLessonIds: Array.isArray(lessonsCompleted)
                        ? lessonsCompleted.map((l) => (typeof l === "string" ? l : l?._id)).filter(Boolean)
                        : [],
                };
                
                setProgress(newProgressState);
                return newProgressState; 
            }
        } catch (err) {
            console.error("Error fetching progress:", err);
        }
        return null; 
    }, [API_BASE_URL]);

    const markCurrentLessonComplete = useCallback(async () => {
        try {
            const newProgress = await trackLesson(courseId, lessonId);
            return newProgress; 
        } catch (e) {
            // already logged inside helpers
        }
        return null; 
    }, [courseId, lessonId, trackLesson]);

    // (fetchQuizMetrics - ที่แก้ไขให้ส่ง Token แล้ว)
    const fetchQuizMetrics = useCallback(async (id) => {
        try {
            const token = localStorage.getItem("token");
            const quizResponse = await fetch(`${API_BASE_URL}/api/lessons/${id}/quizzes/take`);
            if (!quizResponse.ok) throw new Error("Failed to fetch quiz data");
            const quizzes = await quizResponse.json();
            const totalQuestions = quizzes.length;
            const resultResponse = await fetch(`${API_BASE_URL}/api/lessons/${id}/results/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!resultResponse.ok) {
                if (resultResponse.status === 401 || resultResponse.status === 404) {
                    console.warn(`(Status ${resultResponse.status}) No quiz results found. Assuming 0 attempts.`);
                    const newQuizMetrics = {
                    totalQuestions,
                    lastAttempt: null,
                    attemptsMade: 0,
                    isPassed: false,
                    history: [],
                };
                    setQuizMetrics(newQuizMetrics);
                    return newQuizMetrics;
                }
                throw new Error("Failed to fetch quiz results (Server Error)");
            }
            const results = await resultResponse.json(); 
            const attemptsMade = results.length;
            const lastAttempt = attemptsMade > 0 ? results[0] : null; 
            const isPassed = results.some(r => r.passed); 
            const history = results.map((r, i) => ({ 
                ...r, 
                attemptNumber: attemptsMade - i, 
            })).reverse(); 
            const newQuizMetrics = {
                totalQuestions,
                lastAttempt: lastAttempt ? { ...lastAttempt, attemptNumber: attemptsMade } : null,
                attemptsMade,
                isPassed,
                history,
            };
            setQuizMetrics(newQuizMetrics);
            return newQuizMetrics; 
        } catch (err) {
            console.error("Error fetching quiz metrics:", err);
        }
        return null; 
    }, [API_BASE_URL]);

    const fetchUserWorkshop = useCallback(async (courseId, lessonId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/lessons/${lessonId}/workshops/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch workshop data");
            const result = await response.json();
            
            if (result.success) {
                setUserWorkshop(result.data); 
                return result.data; 
            } else {
                setUserWorkshop(null);
            }
        } catch (err) {
            console.error("Error fetching user workshop:", err);
        }
        return null; 
    }, [API_BASE_URL]);

    // (fetchLesson - ที่แก้ไขให้ set 'isQuizLesson' แล้ว)
    const fetchLesson = useCallback(async (id) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/lessons/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Lesson not found");
            const result = await response.json();
            if (result.success && result.data) {
                const data = result.data;
                setLesson(data);
                setQuizState('rules'); 
                setIsWorkshopLesson(data.type === LESSON_TYPE_WORKSHOP); 
                setIsQuizLesson(data.quizzes && data.quizzes.length > 0); 
            } else {
                setLesson(null);
                setError("ไม่พบบทเรียน");
            }
        } catch (err) {
            setError(err.message);
            console.error("Error fetching lesson:", err);
            throw err; 
        }
    }, [API_BASE_URL, setIsWorkshopLesson, setIsQuizLesson]);

    const fetchCourseSections = useCallback(
        async (id) => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
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
                throw err; 
            }
        },
        [setPageTitle, API_BASE_URL]
    );

    // (useEffect หลัก - "ซ่อมแซมตัวเอง")
    useEffect(() => {
        if (!courseId || !lessonId) return;
        let isMounted = true;
        const loadLessonData = async () => {
            setLoading(true);
            setError(null);
            setUserWorkshop(null); 
            setIsVideoFinished(false);
            setIsConfirmWatched(false);
            lastAllowedTimeRef.current = 0;
            try {
                // (โหลดข้อมูลหลัก)
                await fetchCourseSections(courseId);
                await fetchLesson(lessonId);
                
                // (โหลดข้อมูลย่อย)
                const progressResult = await fetchProgress(courseId);
                const quizMetricsResult = await fetchQuizMetrics(lessonId);
                const workshopResult = await fetchUserWorkshop(courseId, lessonId); 

                // (Logic ซ่อมแซมตัวเอง)
                if (progressResult) {
                    const isMarkedCompleted = progressResult.completedLessonIds?.includes(lessonId);
                    
                    if (quizMetricsResult) {
                        const isQuizPassed = quizMetricsResult.isPassed;
                        if (isQuizPassed && !isMarkedCompleted) {
                            console.warn("Inconsistency found: Quiz is passed but not marked complete. Self-healing...");
                            await markCurrentLessonComplete(); 
                        }
                    }

                    if (workshopResult) {
                        const isWorkshopApproved = workshopResult.status === 'approved';
                        if (isWorkshopApproved && !isMarkedCompleted) {
                            console.warn("Inconsistency found: Workshop is approved but not marked complete. Self-healing...");
                            await markCurrentLessonComplete();
                        }
                    }
                }

            } catch (err) {
                console.error("Error loading critical lesson data:", err);
                if (isMounted) {
                    setError(err.message || "ไม่สามารถโหลดข้อมูลบทเรียนได้");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        loadLessonData();
        return () => { isMounted = false; };
    }, [
        courseId,
        lessonId,
        fetchCourseSections,
        fetchLesson,
        fetchQuizMetrics,
        fetchUserWorkshop,
        fetchProgress,
        markCurrentLessonComplete 
    ]);

    const handleConfirmReset = useCallback(async () => {
        console.log("--- DEBUG (handleConfirmReset): User confirmed. Resetting...");
        setShowFailResetModal(false); // 1. ปิด Modal

        try {
            // 2. (ย้าย Logic มาจาก handleActionFinished)
            const currentSection = courseSections.find(section => 
                section.lessons.some(l => l._id === lessonId)
            );
            if (!currentSection || currentSection.lessons.length === 0) return;
            
            const firstLessonOfSectionId = currentSection.lessons[0]._id;
            if (firstLessonOfSectionId === lessonId) return; // (กัน Loop)

            const token = localStorage.getItem("token");
            const resetRes = await fetch(`${API_BASE_URL}/api/progresses/reset-section`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify({ lessonId: lessonId }), 
            });

            if (!resetRes.ok) throw new Error("Failed to reset progress on server");
            
            const resetData = await resetRes.json();
            if (resetData.success && resetData.data) {
                setProgress(resetData.data);
            }
            
            // 3. (ย้ายมานี่) "เตะ" กลับไปบทแรก
            navigate(`/lessons/${courseId}/${firstLessonOfSectionId}`);

        } catch (err) {
            console.error("Failed to execute automatic reset:", err);
        }
    }, [courseSections, lessonId, courseId, navigate, API_BASE_URL, setProgress]); // ⭐️ (เพิ่ม Dependency Array)

   
useEffect(() => {
    if (!quizMetrics) return;

    if (quizMetrics.attemptsMade >= MAX_ATTEMPTS && !quizMetrics.isPassed) {
        setShowFailResetModal(true); // แค่โชว์ Modal
    }
}, [quizMetrics]);

// ใน JSX แสดง Modal
{showFailResetModal && <FailResetModal onClose={handleConfirmReset} />}


    // (useEffect รีเฟรช Progress 3 วิ - ไม่มีการแก้ไข)
    useEffect(() => {
        if (!courseId) return;
        const interval = setInterval(() => {
            fetchProgress(courseId).catch((e) => console.error('Error auto-refreshing progress:', e));
        }, 3000);
        return () => clearInterval(interval);
    }, [courseId, fetchProgress]);

    // (useEffect ตั้ง Page Title - ไม่มีการแก้ไข)
    useEffect(() => {
        if (lesson && setPageTitle) {
            setPageTitle(lesson.title);
        }
    }, [lesson, setPageTitle]);

    const toggleSection = (sectionId) => {
        const sectionKey = sectionId?.toString();
        setExpandedSections((prev) => ({
            ...prev,
            [sectionKey]: !prev[sectionKey],
        }));
    };

    // ⭐️ (เพิ่ม) ฟังก์ชันนี้จะทำงานเมื่อ User กด "OK" บน Modal
    

    // ⭐️ 2. (แก้ไข) แก้ไข handleActionFinished ⭐️
    const handleActionFinished = useCallback(async (isQuiz = false) => {
        if (isQuiz) {
            // 1. แสดง "กำลังประมวลผล..."
            setQuizState('loading'); 
            
            // (รอ Server บันทึกผล)
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms

            // 2. ดึงข้อมูล "ล่าสุด"
            console.log("--- DEBUG (handleActionFinished): กำลังดึงผลลัพธ์ล่าสุด (fetchQuizMetrics)...");
            const newQuizMetrics = await fetchQuizMetrics(lessonId); 

            // (Log เพื่อ Debug)
            if (newQuizMetrics) {
                console.log("--- DEBUG: isPassed:", newQuizMetrics.isPassed);
                console.log("--- DEBUG: attemptsMade:", newQuizMetrics.attemptsMade);
            }

            // --- 3. ⭐️ (Logic ใหม่) ตัดสินใจจากผลลัพธ์ ⭐️ ---
            if (newQuizMetrics && newQuizMetrics.isPassed) {
                // --- 3A. ถ้า "สอบผ่าน" ---
                console.log("--- DEBUG (handleActionFinished): ตรวจพบ -> สอบผ่าน (Marking complete...)");
                
                const currentProgress = await fetchProgress(courseId); 
                const isMarked = currentProgress?.completedLessonIds?.includes(lessonId); 
                if (!isMarked) {
                    await markCurrentLessonComplete();
                }
                
                // (กลับไปหน้า 'rules' ที่แสดงว่า "ผ่านแล้ว")
                setQuizState('rules'); 

            } else if (newQuizMetrics && newQuizMetrics.attemptsMade >= MAX_ATTEMPTS) {
                // --- 3B. ถ้า "สอบตกครั้งสุดท้าย" (หมดสิทธิ์) ---
                console.warn("--- DEBUG (handleActionFinished): ตรวจพบ -> สอบตกครั้งสุดท้าย (Triggering Modal...)");
                // กลับไปหน้า Rules (เพื่อแสดง "หมดสิทธิ์ทำแล้ว" ด้านหลัง)
                setQuizState('rules');
                // แสดง Modal เท่านั้น (ไม่ต้อง alert)
                setShowFailResetModal(true);
            } else {
                // --- 3C. ถ้า "สอบตก" (แต่ยังเหลือสิทธิ์) ---
                console.log("--- DEBUG (handleActionFinished): ตรวจพบ -> สอบตก (แต่ยังมีสิทธิ์)");
                setQuizState('rules');
            }
            
        } else {
            // (Workshop)
            await fetchUserWorkshop(courseId, lessonId); 
        }
    // ⭐️ (เพิ่ม Dependency Array)
    }, [
        lessonId, 
        setQuizState, 
        fetchQuizMetrics, 
        fetchProgress, 
        courseId, 
        markCurrentLessonComplete, 
        setShowFailResetModal, 
        courseSections, 
        navigate, 
        API_BASE_URL, 
        setProgress, 
        fetchUserWorkshop
    ]);
    
    
    // --- Loading & Error States ---
    if (loading) return <div>กำลังโหลดบทเรียน...</div>;
    if (error || !lesson) {
        return <div>ไม่สามารถเข้าถึงบทเรียนนี้ได้: {error}</div>;
    }

    // 💡 (Render Logic ... )
    const mappedSections = mapSectionsForSidebar(courseSections, lesson._id);
    
    // ⭐️ (ลบ) const isQuizLesson ที่ซ้ำซ้อน
    // const isQuizLesson = lesson.quizzes && lesson.quizzes.length > 0; 

    const isVideoFile = (url) => {
        if (!url) return false;
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
    };

    const quizRulesForStartScreen = {
        totalQuestions: quizMetrics.totalQuestions || (lesson.quizzes ? lesson.quizzes.length : 0),
        passingGrade: PASSING_GRADE,
        attemptsLeft: MAX_ATTEMPTS - quizMetrics.attemptsMade,
        isPassed: quizMetrics.isPassed,
        lastAttempt: quizMetrics.lastAttempt,
        canTakeQuiz: !quizMetrics.isPassed && quizMetrics.attemptsMade < MAX_ATTEMPTS,
        history: quizMetrics.history, 
    };

    const progressPercentage = Math.max(0, Math.min(100, Number(progress.percentage) || 0));
    const totalLessonsCount = Math.max(progress.totalLessons || 0, 1);
    const completedLessonCount = Math.max(0, Math.min(progress.completedLessons || 0, totalLessonsCount));
    const progressDisplay = progressPercentage; 
    const isCurrentLessonCompleted = progress.completedLessonIds?.includes(lessonId);
    const canDownloadCertificate = progressDisplay === 100;

    const handleDownloadCertificate = async () => {
        // ... (โค้ดส่วนนี้เหมือนเดิม) ...
    };


    return (
        <div className={styles.pageContainer}>
            {/* ⭐️ (เพิ่ม) แสดง Modal นี้ทับทุกอย่าง */}
            {showFailResetModal && <FailResetModal onClose={handleConfirmReset} />}

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
                            isVideoFile(lesson.videoUrl) ? (
                                <video
                                    ref={videoRef}
                                    src={lesson.videoUrl}
                                    controls
                                    className={styles.videoFrame} 
                                    onTimeUpdate={(e) => {
                                        const cur = e.target.currentTime || 0;
                                        lastAllowedTimeRef.current = Math.max(lastAllowedTimeRef.current, cur);
                                    }}
                                    onSeeking={(e) => {
                                        const v = e.target;
                                        const attempt = v.currentTime || 0;
                                        if (attempt > (lastAllowedTimeRef.current + 1)) {
                                            v.currentTime = lastAllowedTimeRef.current || 0;
                                        }
                                    }}
                                    onEnded={() => {
                                        setIsVideoFinished(true);
                                    }}
                                />
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <iframe
                                        src={lesson.videoUrl}
                                        title={lesson.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className={styles.videoFrame} 
                                    ></iframe>
                                </div>
                            )
                        ) : (
                            <div className={styles.noVideoPlaceholder}>
                                {(isQuizLesson || isWorkshopLesson) ? 'วิดีโออยู่ระหว่างการอัปโหลด' : 'วิดีโออยู่ระหว่างการอัปโหลด'}
                            </div>
                        )}
                    </div>

                    {/* 3. Content Body (พื้นที่แสดงเนื้อหา หรือ Quiz / Workshop) */}
                   <div className={styles.contentBody}>
                        {isWorkshopLesson ? ( 
                            <WorkshopComponent
                                courseId={courseId}
                                lessonId={lessonId}
                                lessonTitle={lesson.title}
                                workshopData={userWorkshop} 
                                onSubmissionSuccess={() => handleActionFinished(false)} 
                            />
                        ) : isQuizLesson ? ( // (ใช้ isQuizLesson (State))
                            
                            // (Logic 3 ทาง: rules, taking, loading)
                            quizState === 'rules' ? (
                                <QuizStartScreen 
                                    lessonTitle={lesson.title}
                                    onStart={() => setQuizState('taking')} 
                                    quizRules={quizRulesForStartScreen}
                                />
                            ) : quizState === 'taking' ? (
                                <QuizComponent 
                                    lessonId={lessonId} 
                                    lessonTitle={lesson.title}
                                    courseId={courseId}
                                    onQuizFinished={() => handleActionFinished(true)} 
                                />
                            ) : quizState === 'loading' ? (
                                <div className={styles.quizLoadingContainer}>
                                    <p>กำลังประมวลผลคำตอบ...</p>
                                </div>
                            ) : null
                        
                        ) : (
                            // (ส่วนของบทเรียนวิดีโอ/เนื้อหา)
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
                                
                                {!isCurrentLessonCompleted && (
                                    <div className={styles.markCompleteSection}>
                                        {(() => {
                                            const hasVideo = !!lesson.videoUrl;
                                            const isEmbedVideo = hasVideo && !isVideoFile(lesson.videoUrl); 
                                            const isDirectVideo = hasVideo && isVideoFile(lesson.videoUrl);  

                                            let allowMark = true; 
                                            if (isDirectVideo) {
                                                allowMark = isVideoFinished; 
                                            } else if (isEmbedVideo) {
                                                allowMark = isConfirmWatched; 
                                            }
                                            
                                            let label = "ทำเครื่องหมายว่าเรียนจบบทนี้";
                                            if (isDirectVideo && !allowMark) {
                                                label = "กรุณาดูวิดีโอให้จบก่อน";
                                            } else if (isEmbedVideo && !allowMark) {
                                                label = "กรุณายืนยันว่าดูจบแล้ว";
                                            }

                                            return (
                                                <>
                                                    {isEmbedVideo && (
                                                        <div className={styles.embedConfirmBox}>
                                                            <label className={styles.embedConfirmLabel}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isConfirmWatched} 
                                                                    onChange={(e) => setIsConfirmWatched(e.target.checked)} 
                                                                />
                                                                <span>ฉันยืนยันว่าดูวิดีโอ (Embed) จบแล้ว</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    <button
                                                        className={styles.startQuizButton}
                                                        onClick={markCurrentLessonComplete}
                                                        disabled={!allowMark}
                                                        title={!allowMark ? 'กรุณาทำเงื่อนไขให้สำเร็จก่อน' : ''}
                                                    >
                                                        {label}
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* --- Sidebar (สารบัญ) --- */}
                <div className={styles.sidebar}>
                    <div className={styles.progressHeader}>
                        <div className={styles.progressHeaderTop}>
                            <div className={styles.progressText}>ความคืบหน้า</div>
                            <div className={styles.progressPercentage}>
                                {progressDisplay}% 
                            </div>
                        </div>
                        <div className={styles.progressMeta}>
                            {completedLessonCount} / {totalLessonsCount} บทเรียน
                        </div>
                        <div className={styles.progressBarWrapper}>
                            <div
                                className={styles.progressBar}
                                style={{ width: `${progressDisplay}%` }} 
                            ></div>
                        </div>

                        {canDownloadCertificate && (
                            <div style={{ marginTop: 12 }}>
                                <button
                                    className={styles.startQuizButton}
                                    onClick={handleDownloadCertificate}
                                >
                                    ดาวน์โหลดใบประกาศนียบัตร (Certificate)
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.sidebarContent}>
                        {mappedSections.map((section, sectionIndex) => {
                            const sectionKey =
                                section.sectionId || `section-${sectionIndex}`;
                            const isExpanded = expandedSections[sectionKey] === undefined 
                                ? section.isActive 
                                : expandedSections[sectionKey];

                            return (
                                <div
                                    key={sectionKey}
                                    className={`${styles.section} ${
                                        section.isActive ? styles.activeSection : ""
                                    }`}
                                >
                                    <button
                                        type="button"
                                        className={`${styles.sectionToggle} ${
                                            section.isActive
                                                ? styles.sectionToggleActive
                                                : ""
                                        }`}
                                        onClick={() => toggleSection(sectionKey)}
                                        aria-expanded={isExpanded ? "true" : "false"}
                                        aria-controls={`section-${sectionKey}`}
                                    >
                                        <span className={styles.sectionToggleLabel}>
                                            SECTION {sectionIndex + 1} {section.title}
                                        </span>
                                        <span
                                            className={`${styles.toggleIcon} ${
                                                isExpanded ? styles.toggleIconOpen : ""
                                            }`}
                                        >
                                            ▾
                                        </span>
                                    </button>
                                    {isExpanded && (
                                        <ul
                                            id={`section-${sectionKey}`}
                                            className={styles.lessonList}
                                        >
                                            {section.lessons.map((item) => {
                                                const isCompleted = progress.completedLessonIds?.includes(item._id);
                                                return (
                                                    <li
                                                        key={item._id}
                                                        className={`${styles.lessonItem} ${
                                                            item.isActive
                                                                ? styles.activeLesson
                                                            : ""
                                                        } ${
                                                            isCompleted
                                                                ? styles.completedLesson 
                                                                : ""
                                                        }`}
                                                    >
                                                        <Link
                                                            to={`/lessons/${courseId}/${item._id}`}
                                                            className={styles.lessonLink}
                                                        >
                                                            <span className={styles.lessonIcon}>
                                                                {isCompleted ? "✅" : (item.isActive ? "▶️" : "📄")} 
                                                            </span>
                                                            {item.title}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}