import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useOutletContext,
} from "react-router-dom";
import QuizComponent from "../components/QuizComponent";
import WorkshopComponent from "../components/WorkshopComponent"; // 🟢 1. IMPORT COMPONENT ใหม่
import { useAuth } from "../context/AuthContext";

import styles from "./CourseLessonPage.module.css";

// 🟢 กำหนดประเภทบทเรียน Workshop
const LESSON_TYPE_WORKSHOP = "workshop";
// 🟢 กำหนดเกณฑ์และจำนวนครั้งสูงสุด (ปรับแก้ได้ที่นี่)
const MAX_ATTEMPTS = 3;
const PASSING_GRADE = 70;

// 💡 Helper Function เพื่อจัดโครงสร้างสารบัญให้ใช้งานง่าย
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

// 🟢 Component ใหม่สำหรับแสดงกฎ (Rules/Start Screen) และประวัติการทำควิซ
const QuizStartScreen = ({ lessonTitle, onStart, quizRules }) => {
  const {
    totalQuestions,
    passingGrade,
    attemptsLeft,
    isPassed,
    lastAttempt,
    canTakeQuiz,
    history,
  } = quizRules;

  const passingScore = Math.ceil(totalQuestions * (passingGrade / 100)); // 💡 ส่วนแสดงผลลัพธ์ล่าสุด

  const LastAttemptResult = () => {
    if (!lastAttempt) return null;
    const score = lastAttempt.score || 0;
    const scorePercentage = (score / totalQuestions) * 100;
    const isLastPassed = lastAttempt.passed || scorePercentage >= passingGrade;

    return (
      <div
        className={`${styles.resultContainer} ${
          isLastPassed ? styles.resultSuccess : styles.resultFail
        }`}
      >
                       {" "}
        <h4>ผลการทำครั้งล่าสุด (ครั้งที่ {lastAttempt.attemptNumber})</h4>     
                 {" "}
        <p>
                              คะแนน: **{score}/{totalQuestions}** (**
          {scorePercentage.toFixed(2)}%**)                {" "}
        </p>
                       {" "}
        <p>สถานะ: **{isLastPassed ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}**</p>           {" "}
      </div>
    );
  };

  return (
    <div className={styles.quizStartContainer}>
                 {" "}
      <div className={styles.quizHeader}>
                       {" "}
        <h3 className={styles.quizTitle}>{lessonTitle} (แบบทดสอบเก็บคะแนน)</h3> 
                     {" "}
        {isPassed && (
          <h2 className={styles.passedMessage}>✅ คุณผ่านแบบทดสอบนี้แล้ว!</h2>
        )}
                       {" "}
        <p className={styles.quizSubtitle}>แบบทดสอบความเข้าใจครั้งที่ 1</p>     
             {" "}
      </div>
                  <LastAttemptResult />                       {" "}
      <div className={styles.quizDetails}>
                        <p>แบบทดสอบมีจำนวน **{totalQuestions} ข้อ**</p>         
             {" "}
        <p>
          กรุณาตรวจสอบความถูกต้องก่อนกดส่งคำตอบ เพราะคุณสามารถส่งคำตอบได้เพียง 1
          ครั้ง/การพยายาม
        </p>
                   {" "}
      </div>
                 {" "}
      {history && history.length > 0 && (
        <div className={styles.quizHistorySection}>
                             {" "}
          <h4>📋 ประวัติการทำแบบทดสอบ ({history.length} ครั้ง)</h4>             
               {" "}
          <ul className={styles.historyList}>
                                   {" "}
            {history.map((attempt, index) => (
              <li
                key={attempt._id}
                className={
                  attempt.passed ? styles.historyPassed : styles.historyFailed
                }
              >
                                               {" "}
                <span>
                                                      ครั้งที่{" "}
                  {attempt.attemptNumber}:                                    
                  **{attempt.score}/{attempt.total}** (
                  {attempt.percentage.toFixed(2)}%)                            
                     {" "}
                </span>
                                               {" "}
                <span>
                                                      สถานะ: **
                  {attempt.passed ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}**                
                                 {" "}
                </span>
                                                                           {" "}
              </li>
            ))}
                               {" "}
          </ul>
                         {" "}
        </div>
      )}
                 {" "}
      <div className={styles.quizMetrics}>
                       {" "}
        <div className={styles.quizAlert}>
                             {" "}
          <p>⚠️ การทำแบบทดสอบนี้มีผลต่อการออกใบรับรอง (Certificate)</p>         
                                       {" "}
          {!isPassed && (
            <p className={styles.alertNote}>
              หากทำไม่ผ่านในจำนวนครั้งที่กำหนดจะไม่ได้ใบรับรอง*
            </p>
          )}
                             {" "}
          <p>
                                    เกณฑ์คะแนนที่ผ่าน: **{passingGrade}%**
            (ต้องได้ **{passingScore} ข้อ** ขึ้นไป)                    {" "}
          </p>
                             {" "}
          <p>จำนวนครั้งที่เหลือ: **{Math.max(0, attemptsLeft)} ครั้ง**</p>     
                                           {" "}
          {canTakeQuiz ? (
            <button onClick={onStart} className={styles.startQuizButton}>
                                          เริ่มทำ/ทำควิซต่อ                    
                 {" "}
            </button>
          ) : (
            <button disabled className={styles.disabledButton}>
                                         {" "}
              {isPassed ? "คุณผ่านแล้ว" : "หมดสิทธิ์ทำแล้ว"}                   
                 {" "}
            </button>
          )}
                                                 {" "}
          {attemptsLeft <= 0 && !isPassed && (
            <p className={styles.alertNoteRed}>
              **คุณทำครบตามจำนวนครั้งที่กำหนดแล้ว และยังไม่ผ่านเกณฑ์**
            </p>
          )}
                         {" "}
        </div>
                   {" "}
      </div>
             {" "}
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
  }); // 🟢 State สำหรับเก็บข้อมูลจริงของควิซและผลลัพธ์ (รวมถึง History)
  const [quizMetrics, setQuizMetrics] = useState({
    totalQuestions: 0,
    lastAttempt: null,
    attemptsMade: 0,
    isPassed: false,
    history: [],
  });

  // 🟢 State ใหม่สำหรับ Workshop
  const [userWorkshop, setUserWorkshop] = useState(null);
  const [isWorkshopLesson, setIsWorkshopLesson] = useState(false);
  // video enforcement refs/state
  const videoRef = useRef(null);
  const lastAllowedTimeRef = useRef(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [isConfirmWatched, setIsConfirmWatched] = useState(false); // for iframe embeds

  // 🟢 สถานะใหม่: จัดการว่าจะแสดง Rules หรือ Quiz จริง
  const [quizState, setQuizState] = useState("rules"); // 'rules' | 'taking'
  const [expandedSections, setExpandedSections] = useState({});

  const trackLesson = useCallback(
    async (courseIdParam, lessonIdParam) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `${API_BASE_URL}/api/progresses/mark-complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              courseId: courseIdParam,
              lessonId: lessonIdParam,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to mark lesson as complete");
        }

        // 🟢 (Improved) อัปเดต Progress state ทันทีหลังจากสำเร็จ
        const result = await response.json();
        if (result.success && result.data) {
          setProgress((prev) => ({
            ...prev,
            percentage: result.data.percentage,
            completedLessons: result.data.lessonsCompleted?.length || 0,
            completedLessonIds:
              result.data.lessonsCompleted?.map((l) =>
                typeof l === "string" ? l : l?._id
              ) || [],
          }));
        }
      } catch (err) {
        console.error("Error tracking lesson progress:", err);
      }
    },
    [API_BASE_URL]
  );

  const fetchProgress = useCallback(
    async (courseIdParam) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/progresses/${courseIdParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch progress");

        const result = await response.json();
        if (result.success && result.data) {
          const {
            percentage = 0,
            totalLessons = 0,
            lessonsCompleted = [],
          } = result.data;

          // 🟢 (Improved) ดีบัก totalLessons ให้แน่ใจ
          console.log(
            "--- DEBUG fetchProgress: totalLessons from backend =",
            totalLessons,
            "lessonsCompleted.length =",
            lessonsCompleted.length
          );

          const completedLessons = Array.isArray(lessonsCompleted)
            ? lessonsCompleted.length
            : 0;
          const safeTotalLessons = Math.max(
            totalLessons || 0,
            completedLessons,
            1
          );
          const clampedPercentage = Math.max(
            0,
            Math.min(100, Number(percentage) || 0)
          );

          setProgress({
            percentage: clampedPercentage,
            totalLessons: safeTotalLessons,
            completedLessons,
            completedLessonIds: Array.isArray(lessonsCompleted)
              ? lessonsCompleted
                  .map((l) => (typeof l === "string" ? l : l?._id))
                  .filter(Boolean)
              : [],
          });
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    },
    [API_BASE_URL]
  );

  const markCurrentLessonComplete = useCallback(async () => {
    try {
      await trackLesson(courseId, lessonId);
      await fetchProgress(courseId);
    } catch (e) {
      // already logged inside helpers
    }
  }, [courseId, lessonId, trackLesson, fetchProgress]);

  // 🟢 ฟังก์ชันใหม่: ดึงข้อมูลเมตริกของควิซ (จำนวนข้อ, ผลลัพธ์)
  const fetchQuizMetrics = useCallback(
    async (id) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found for quiz metrics fetch");
          return;
        }

        const quizResponse = await fetch(
          `${API_BASE_URL}/api/lessons/${id}/quizzes/take`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!quizResponse.ok) throw new Error("Failed to fetch quiz data");
        const quizzes = await quizResponse.json();
        const totalQuestions = quizzes.length;

        const resultResponse = await fetch(
          `${API_BASE_URL}/api/quizresults/${id}/results/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!resultResponse.ok) throw new Error("Failed to fetch quiz results");
        const results = await resultResponse.json(); // ผลลัพธ์ถูกจัดเรียงจากใหม่ไปเก่าใน Backend แล้ว
        const attemptsMade = results.length;
        const lastAttempt = attemptsMade > 0 ? results[0] : null; // ตรวจสอบว่าเคยผ่านแล้วหรือไม่
        const isPassed = results.some((r) => r.passed); // เตรียม History โดยกำหนดเลขครั้งจากเก่าไปใหม่ (หรือใหม่ไปเก่าตามที่ Backend จัดเรียง)
        const history = results
          .map((r, i) => ({
            ...r, // กำหนดเลขครั้งจาก 1 ถึง N (เก่าไปใหม่)
            attemptNumber: attemptsMade - i,
          }))
          .reverse();

        setQuizMetrics({
          totalQuestions,
          lastAttempt: lastAttempt
            ? { ...lastAttempt, attemptNumber: attemptsMade }
            : null,
          attemptsMade,
          isPassed,
          history,
        });
      } catch (err) {
        console.error("Error fetching quiz metrics:", err);
        setError("ไม่สามารถดึงข้อมูลควิซ/ผลลัพธ์ได้");
      }
    },
    [API_BASE_URL]
  );

  // 🟢 ฟังก์ชันใหม่: ดึงข้อมูล Workshop ของผู้ใช้
  const fetchUserWorkshop = useCallback(
    async (courseId, lessonId) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/workshops/${courseId}/lessons/${lessonId}/workshops/me`, //courese
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // ⭐️ [FIX 1] เพิ่มการจัดการ 404 และ return null
        if (response.status === 404) {
            setUserWorkshop(null); 
            return null;
        }
        
        if (!response.ok) throw new Error("Failed to fetch workshop data");
        const result = await response.json();

        if (result.success && result.data) {
          setUserWorkshop(result.data);
          return result.data; // Workshop object หรือ null
        } else {
          setUserWorkshop(null);
            return null; // ไม่มีข้อมูล workshop
        }
      } catch (err) {
        console.error("Error fetching user workshop:", err);
        setUserWorkshop(null);
        return null;
        // ไม่ต้อง setError รุนแรง เพราะมันอาจจะแค่ยังไม่เคยส่ง
      }3
    },
    [API_BASE_URL]
  ); // 💡 แก้ไข fetchLesson ให้กำหนด isWorkshopLesson

  const fetchLesson = useCallback(
    async (id) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/lessons/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Lesson not found");
        const result = await response.json();
        if (result.success && result.data) {
          setLesson(result.data);
          setQuizState("rules");
          // 🟢 กำหนดสถานะว่าเป็นบทเรียน Workshop หรือไม่
          setIsWorkshopLesson(result.data.type === LESSON_TYPE_WORKSHOP);
          return result.data;
        } else {
          setLesson(null);
          setError("ไม่พบบทเรียน");
          return null;
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching lesson:", err);
        return null;
      }
    },
    [API_BASE_URL]
  );

  const fetchCourseSections = useCallback(
    async (id) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      }
    },
    [setPageTitle, API_BASE_URL]
  );

  // 💡 แก้ไข useEffect ให้เรียก fetchUserWorkshop และ Progress ด้วย
  useEffect(() => {
    if (!courseId || !lessonId) return;

    let isMounted = true;

   const loadLessonData = async () => {
    setLoading(true);
    setError(null);
    setUserWorkshop(null); // Reset workshop state on lesson change

    try {
      // 1. โหลดข้อมูลบทเรียนและ Section ก่อนเสมอ
      const [fetchedLesson, _] = await Promise.all([
          fetchLesson(lessonId),
          fetchCourseSections(courseId)
      ]);

      // 2. ถ้าไม่พบบทเรียน ให้ออกเลย
      if (!fetchedLesson) {
          if (isMounted) setLoading(false);
          return; 
      }
      
      // 3. ⭐️ เช็คประเภท!
      const promisesToRun = [];
      let workshopFetchPromise = null;

      // 3.1 ถ้าเป็นบทเรียน Quiz ค่อยไปดึงข้อมูล Quiz
      const isQuizLesson = fetchedLesson.quizzes && fetchedLesson.quizzes.length > 0;
      if (isQuizLesson) {
          promisesToRun.push(fetchQuizMetrics(lessonId));
      }

      // 3.2 ถ้าเป็นบทเรียน Workshop ค่อยไปดึงข้อมูล Workshop
      if (fetchedLesson.type === LESSON_TYPE_WORKSHOP) {
        workshopFetchPromise = fetchUserWorkshop(courseId, lessonId);
         promisesToRun.push(workshopFetchPromise);
      }

      // 4. รัน API ที่จำเป็นเท่านั้น
      if (promisesToRun.length > 0) {
          await Promise.all(promisesToRun);
      }

      // ⭐️⭐️⭐️ [ADD 3 - จุดแก้บั๊กหลัก] ⭐️⭐️⭐️
      // หลังจาก API ทั้งหมดรันเสร็จ ให้เรามาเช็กผลลัพธ์ของ Workshop
      if (workshopFetchPromise) {
          // ดึงผลลัพธ์ (data) ที่ return ออกมาจาก promise
          const workshopResult = await workshopFetchPromise; 
          
          // ถ้าผลลัพธ์มีอยู่จริง และ status เป็น 'approved'
          if (workshopResult && workshopResult.status === 'approved') {
              // ⭐️ สั่งให้ Mark Complete ที่นี่! ⭐️
              await markCurrentLessonComplete(); 
          }
      }

      // 5. รีเฟรช Progress
      if (isMounted) {
        await fetchProgress(courseId);
      }
    } catch (err) {
      console.error("Error loading lesson data:", err);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

    loadLessonData();

    return () => {
      isMounted = false;
    };
  }, [
    courseId,
    lessonId,
    fetchCourseSections,
    fetchLesson,
    fetchQuizMetrics,
    fetchUserWorkshop,
    trackLesson,
    fetchProgress,
  ]);

  // 🟢 (Improved) รีเฟรช Progress ทุก 3 วินาที (เพื่อให้เห็นการเปลี่ยนแปลงจากผู้ใช้คนอื่น)
  useEffect(() => {
    if (!courseId) return;

    const interval = setInterval(() => {
      fetchProgress(courseId).catch((e) =>
        console.error("Error auto-refreshing progress:", e)
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [courseId, fetchProgress]);

  // 🟢 (Improved) ตั้ง Page Title เมื่อ lesson โหลดสำเร็จ
  useEffect(() => {
    if (lesson && setPageTitle) {
      setPageTitle(lesson.title);
    }
  }, [lesson, setPageTitle]);

  useEffect(() => {
    if (!courseSections || courseSections.length === 0) return;

    const totalLessonCount = courseSections.reduce((acc, section) => {
      const lessons = section.lessons || [];
      return acc + lessons.length;
    }, 0);

    if (totalLessonCount === 0) return;

    console.log(
      "--- DEBUG: Recalculating totalLessons from courseSections =",
      totalLessonCount
    );

    setProgress((prev) => {
      // 🟢 (Improved) ถ้า totalLessons เปลี่ยน ให้อัปเดต และรีคำนวณ percentage
      if (prev.totalLessons === totalLessonCount) {
        return prev;
      }

      // 🟢 (Improved) ถ้า totalLessons เปลี่ยน ให้ปรับปรุง percentage โดยใช้ completedLessons เดิม
      const newPercentage =
        totalLessonCount > 0
          ? Math.round((prev.completedLessons / totalLessonCount) * 100)
          : 0;

      return {
        ...prev,
        totalLessons: totalLessonCount,
        percentage: Math.min(100, Math.max(0, newPercentage)),
        completedLessons: Math.min(prev.completedLessons, totalLessonCount),
      };
    });
  }, [courseSections]);

  const toggleSection = (sectionId) => {
    const sectionKey = sectionId?.toString();
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // 🟢 ฟังก์ชันใหม่: รองรับการเสร็จสิ้นทั้ง Quiz และ Workshop
  // 🟢 ฟังก์ชันใหม่: รองรับการเสร็จสิ้นทั้ง Quiz และ Workshop
  // 🟢 ฟังก์ชันใหม่: รองรับการเสร็จสิ้นทั้ง Quiz และ Workshop
  const handleActionFinished = async (isQuiz = false, newResultData = null) => {
    // 1. ถ้าเป็น Quiz
    if (isQuiz) {
      // 💡 [FIX-V3] เราได้รับข้อมูลใหม่ (newResultData) มาจาก QuizComponent แล้ว
      if (newResultData && newResultData.passed !== undefined) {
        // เรามีข้อมูลที่ถูกต้องแล้ว ไม่ต้อง fetch!
        // 1. อัปเดต State ของ quizMetrics *ด้วยตนเอง* ทันที
        // โดยใช้ข้อมูลจาก newResultData ที่เพิ่งได้รับมา
        setQuizMetrics((prevMetrics) => {
          // คำนวณเลขครั้งใหม่
          const newAttemptNumber = prevMetrics.attemptsMade + 1;

          // สร้าง History entry ใหม่
          const newHistoryEntry = {
            ...newResultData,
            attemptNumber: newAttemptNumber,
          };

          // สร้างประวัติใหม่ (เรียงจากใหม่ไปเก่า)
          const updatedHistory = [newHistoryEntry, ...prevMetrics.history];

          return {
            ...prevMetrics,
            totalQuestions: newResultData.total || prevMetrics.totalQuestions,
            attemptsMade: newAttemptNumber,
            lastAttempt: newHistoryEntry, // สถานะ "ผ่าน" คือ เคยผ่านมาก่อน || หรือ เพิ่งผ่านครั้งนี้
            isPassed: prevMetrics.isPassed || newResultData.passed,
            // อัปเดตประวัติ (และจัดเรียงเลขครั้งใหม่ให้ถูกต้อง)
            history: updatedHistory
              .map((r, i) => ({ ...r, attemptNumber: newAttemptNumber - i }))
              .reverse(),
          };
        }); // 2. เปลี่ยนหน้ากลับไปที่ 'rules' // React จะรวบ (Batch) 2 คำสั่งนี้ (setQuizMetrics และ setQuizState) // ทำให้การ Re-render ครั้งถัดไปมี (isPassed: true) และ (quizState: 'rules') พร้อมกัน

        setQuizState("rules"); // 3. ถ้าการสอบครั้งนี้ "ผ่าน" ให้ Mark Complete // (ไม่ต้องใช้ setTimeout แล้ว เพราะเรามีข้อมูลที่ถูกต้องทันที)

        if (newResultData.passed) {
          await markCurrentLessonComplete();
        }
      } else {
        // Fallback (กรณีที่ newResultData ไม่ถูกส่งมาอย่างไม่ทราบสาเหตุ)
        // เราจะใช้โค้ด V2 (ซึ่งอาจจะกระพริบ แต่ก็ดีกว่าพัง)
        console.error(
          "Fallback: handleActionFinished did not receive newResultData. Fetching manually."
        );
        // (โค้ด V2 เดิมของคุณ)
        await fetchQuizMetrics(lessonId);
        setQuizState("rules");
        setTimeout(async () => {
          const token = localStorage.getItem("token");
          if (!token) return;
          const resultResponse = await fetch(
            `${API_BASE_URL}/api/quizresults/${lessonId}/results/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!resultResponse.ok) return;
          const results = await resultResponse.json();
          if (results.some((r) => r.passed)) {
            await markCurrentLessonComplete();
          }
        }, 300);
      }
    } else {
      // 2. ถ้าเป็น Workshop (ส่วนนี้ถูกต้องอยู่แล้ว)
      await fetchUserWorkshop(courseId, lessonId);
      setTimeout(async () => {
        // ... (Logic เดิมของ Workshop)
      }, 300);
    }
  };
  // --- Loading & Error States ---
  if (loading) return <div>กำลังโหลดบทเรียน...</div>;
  if (error || !lesson) {
    return <div>ไม่สามารถเข้าถึงบทเรียนนี้ได้: {error}</div>;
  } // 💡 เตรียม Data สำหรับ Sidebar
  const mappedSections = mapSectionsForSidebar(courseSections, lesson._id);
  const isQuizLesson = lesson.quizzes && lesson.quizzes.length > 0;

  const isVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  };

  // 🟢 เตรียม Quiz Rules/Metrics สำหรับส่งให้ QuizStartScreen
  const quizRulesForStartScreen = {
    totalQuestions:
      quizMetrics.totalQuestions ||
      (lesson.quizzes ? lesson.quizzes.length : 0),
    passingGrade: PASSING_GRADE,
    attemptsLeft: MAX_ATTEMPTS - quizMetrics.attemptsMade,
    isPassed: quizMetrics.isPassed,
    lastAttempt: quizMetrics.lastAttempt,
    canTakeQuiz:
      !quizMetrics.isPassed && quizMetrics.attemptsMade < MAX_ATTEMPTS,
    history: quizMetrics.history,
  };
  const progressPercentage = Math.max(
    0,
    Math.min(100, Number(progress.percentage) || 0)
  );
  const totalLessonsCount = Math.max(progress.totalLessons || 0, 1);
  const completedLessonCount = Math.max(
    0,
    Math.min(progress.completedLessons || 0, totalLessonsCount)
  );

  // 🟢 (Improved) คำนวณ percentage จาก completed/total เพื่อให้แน่ใจ
  const calculatedPercentage =
    totalLessonsCount > 0
      ? Math.round((completedLessonCount / totalLessonsCount) * 100)
      : 0;

  // 🟢 (Improved) ใช้ค่าที่มากกว่าระหว่าง backend percentage กับ calculated percentage
  const progressDisplay = Math.max(progressPercentage, calculatedPercentage);

  const isCurrentLessonCompleted =
    progress.completedLessonIds?.includes(lessonId);

  const canDownloadCertificate = progressDisplay === 100;

  const handleDownloadCertificate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const body = { courseId }; // ✅ userId จะมาจาก JWT token แล้ว
      console.log(
        "--- handleDownloadCertificate: Requesting certificate for course:",
        courseId
      );

      const res = await fetch(`${API_BASE_URL}/api/certificates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Always send token
        },
        body: JSON.stringify(body),
      });

      console.log("--- Certificate POST response status:", res.status);

      if (!res.ok) {
        // ถ้ามีอยู่แล้ว (409) → ไปค้นหาใบเดิมของคอร์สนี้และดาวน์โหลดให้เลย
        if (res.status === 409) {
          console.log(
            "--- Certificate already exists, searching for existing certificate..."
          );
          // 1) ลองค้นหาจาก /me ก่อน
          try {
            const listRes = await fetch(`${API_BASE_URL}/api/certificates/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (listRes.ok) {
              const certs = await listRes.json();
              console.log("--- Found certificates from /me:", certs.length);
              const existingFromMe = (Array.isArray(certs) ? certs : []).find(
                (c) => {
                  const cid =
                    typeof c.course === "string" ? c.course : c.course?._id;
                  return cid === courseId;
                }
              );
              if (existingFromMe?._id) {
                console.log(
                  "--- Opening existing certificate:",
                  existingFromMe._id
                );
                window.open(
                  `${API_BASE_URL}/api/certificates/${existingFromMe._id}/download`,
                  "_blank"
                );
                return;
              }
            }
          } catch (err) {
            console.error("--- Error fetching from /me:", err);
          }

          // 2) ถ้า /me ไม่เจอ อาจเพราะ backend ใช้ MOCK_USER_ID → ใช้วิธีค้นจากคอร์สแล้วกรอง userId
          try {
            const byCourseRes = await fetch(
              `${API_BASE_URL}/api/courses/${courseId}/certificates`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (byCourseRes.ok) {
              const list = await byCourseRes.json();
              console.log("--- Found certificates from course:", list.length);
              const existingByCourse = (Array.isArray(list) ? list : []).find(
                (c) => {
                  // user อาจถูก populate เป็น object
                  const uid = typeof c.user === "string" ? c.user : c.user?._id;
                  const currentUserId = user?._id || user?.id;
                  return uid && currentUserId && uid === currentUserId;
                }
              );
              if (existingByCourse?._id) {
                console.log(
                  "--- Opening existing certificate from course:",
                  existingByCourse._id
                );
                window.open(
                  `${API_BASE_URL}/api/certificates/${existingByCourse._id}/download`,
                  "_blank"
                );
                return;
              }
            }
          } catch (err) {
            console.error("--- Error fetching from course:", err);
          }

          throw new Error("Certificate already exists but cannot be found");
        }

        // Handle other errors
        let errorMessage = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          errorMessage = data.message || data.error || errorMessage;
          console.error("--- Error response data:", data);
        } catch (parseErr) {
          console.error("--- Could not parse error response:", parseErr);
        }
        throw new Error(`Failed to create certificate: ${errorMessage}`);
      }
      const cert = await res.json();
      console.log("--- Certificate created successfully:", cert?._id);
      const certId = cert?._id;
      if (certId) {
        console.log("--- Opening certificate download for:", certId);
        window.open(
          `${API_BASE_URL}/api/certificates/${certId}/download`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("Create/Download certificate error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
      alert(`ไม่สามารถออก/ดาวน์โหลดใบประกาศได้: ${err.message}`);
    }
  };

  return (
    <div className={styles.pageContainer}>
                 {" "}
      <div className={styles.contentWrapper}>
                        {/* --- Main Content (วิดีโอ & เนื้อหา) --- */}         
             {" "}
        <div className={styles.mainLessonContent}>
                              {/* 1. Header (แสดงเสมอ) */}                   {" "}
          <header className={styles.lessonHeader}>
                                   {" "}
            <h2 className={styles.lessonTitle}>{lesson.title}</h2>             
                     {" "}
            <Link to={`/courses/${courseId}`} className={styles.backToCourse}>
                                          &larr; กลับไปยังหน้าคอร์ส:{" "}
              {courseTitle}                       {" "}
            </Link>
                               {" "}
          </header>
                             {" "}
          {/* 2. Video Player (แสดงเสมอ เพราะคุณต้องการให้วิดีโออยู่ด้านบน) */} 
                           {" "}
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
                    // update last allowed (never decrease)
                    lastAllowedTimeRef.current = Math.max(
                      lastAllowedTimeRef.current,
                      cur
                    );
                  }}
                  onSeeking={(e) => {
                    const v = e.target;
                    const attempt = v.currentTime || 0;
                    // if user tries to seek ahead beyond allowed time, revert
                    if (attempt > lastAllowedTimeRef.current + 1) {
                      // snap back
                      v.currentTime = lastAllowedTimeRef.current || 0;
                    }
                  }}
                  onEnded={() => {
                    setIsVideoFinished(true);
                  }}
                />
              ) : (
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={styles.videoFrame}
                ></iframe>
              )
            ) : (
              <div className={styles.noVideoPlaceholder}>
                วิดีโออยู่ระหว่างการอัปโหลด
              </div>
            )}
                               {" "}
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={isConfirmWatched}
                onChange={(e) => setIsConfirmWatched(e.target.checked)}
              />
              <span>
                ฉันยืนยันว่าดูวิดีโอจบแล้ว (ถ้าเป็นวิดีโอจาก YouTube/Embed
                ให้กดยืนยันเอง)
              </span>
            </label>
          </div>
                             {" "}
          {/* 3. Content Body (พื้นที่แสดงเนื้อหา หรือ Quiz / Workshop) */}     
                       {" "}
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
              quizState === "rules" ? (
                <QuizStartScreen
                  lessonTitle={lesson.title}
                  onStart={() => setQuizState("taking")}
                  quizRules={quizRulesForStartScreen}
                />
              ) : (
                // 🟢 ถ้า quizState เป็น 'taking' จะแสดงคำถามควิซ
                <QuizComponent
                  lessonId={lessonId}
                  lessonTitle={lesson.title}
                  courseId={courseId}
                  onQuizFinished={(quizResult) =>
                    handleActionFinished(true, quizResult)
                  } // 💡 แก้ไข handler (ส่ง true = Quiz)
                />
              )
            ) : (
              // 🟡 Logic สำหรับ Video/Content Lesson (แสดง Content Text)
              <>
                                               {" "}
                {lesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : (
                  <div className={styles.noContentPlaceholder}>
                                                           {" "}
                    <p>
                                                                 
                      บทเรียนนี้ไม่มีเนื้อหาข้อความประกอบ
                      สามารถรับชมเนื้อหาได้จากวิดีโอด้านบน                      
                                       {" "}
                    </p>
                                                       {" "}
                  </div>
                )}
                {!isCurrentLessonCompleted && (
                  <div style={{ marginTop: 16 }}>
                    {(() => {
                      const hasVideo = !!lesson.videoUrl;
                      const directVideo =
                        hasVideo && isVideoFile(lesson.videoUrl);
                      const allowMark = hasVideo
                        ? directVideo
                          ? isVideoFinished
                          : isConfirmWatched
                        : true;
                      let label = "ทำเครื่องหมายว่าเรียนจบบทนี้";
                      if (hasVideo) {
                        if (directVideo) {
                          label = isVideoFinished
                            ? "ทำเครื่องหมายว่าเรียนจบบทนี้"
                            : "ดูวิดีโอให้จบก่อน";
                        } else {
                          label = "ไปยังบทเรียนถัดไป";
                        }
                      }

                      return (
                        <button
                          className={styles.startQuizButton}
                          onClick={markCurrentLessonComplete}
                          disabled={!allowMark}
                          title={
                            !allowMark
                              ? hasVideo && isVideoFile(lesson.videoUrl)
                                ? "กรุณาดูวิดีโอให้จบก่อน"
                                : "กรุณายืนยันว่าดูวิดีโอแล้ว"
                              : ""
                          }
                        >
                          {label}
                        </button>
                      );
                    })()}
                  </div>
                )}
                                           {" "}
              </>
            )}
                               {" "}
          </div>
                             {" "}
          {/* 4. Navigation (ปุ่มถัดไป/ก่อนหน้า) - แสดงเฉพาะเมื่อไม่ใช่ควิซ */} 
                           {" "}
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
                         {" "}
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
                style={{ width: `${progressPercentage}%` }}
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
              const sectionKey = section.sectionId || `section-${sectionIndex}`;
              const isExpanded = expandedSections[sectionKey];

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
                      section.isActive ? styles.sectionToggleActive : ""
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
                      {section.lessons.map((item) => (
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
                  )}
                </div>
              );
            })}
          </div>

          {/* ส่วนของห้องพูดคุย (Mock) */}
          {/* <div className={styles.discussionSection}>
                        <h4>💬 ห้องพูดคุย สอบถาม แลกเปลี่ยนความคิดเห็น</h4>
                        <p>และผู้สอนจะใช้เวลาทุกท่านเข้ามาตอบข้อซักถามในอาการะชมรม</p>
                        <button className={styles.discussButton}>ไปที่ห้องพูดคุย</button>
                    </div> */}
        </div>
                   {" "}
      </div>
             {" "}
    </div>
  );
}
