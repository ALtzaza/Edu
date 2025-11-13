import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './QuizComponent.module.css'; 

const API_BASE_URL = 'http://localhost:3000'; 
const PASSING_GRADE = 70; 

// ⭐️⭐️⭐️ (จุดแก้ไขหลัก) ⭐️⭐️⭐️
// Helper Component สำหรับแสดงผลลัพธ์ (Modal)
const QuizResultModal = ({ result, onClose }) => { // ⬅️ 1. ลบ onRetake ออก
    const isPassed = result.passed;
    const message = isPassed ? "🥳 ยอดเยี่ยม! คุณสอบผ่านเกณฑ์แล้ว!" : "⚠️ คุณยังสอบไม่ผ่านเกณฑ์";
    const percentage = result.percentage ? result.percentage.toFixed(2) : ((result.score / result.total) * 100).toFixed(2);
    const statusClass = isPassed ? styles.passed : styles.failed;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.quizResultModal} ${statusClass}`}>
                <h3>{message}</h3>
                
                <p>คะแนนที่คุณทำได้: **{result.score} / {result.total}**</p>
                <p>เปอร์เซ็นต์: **{percentage}%** (เกณฑ์ผ่าน: {PASSING_GRADE}%)</p>
                
                {!isPassed && (
                    // ⭐️ (แก้ไข) เปลี่ยนข้อความ
                    <p className={styles.retakeNote}>
                        กด "ตกลง" เพื่อกลับไปหน้าบทเรียน และดูสิทธิ์การทำครั้งต่อไป
                    </p>
                )}

                <div className={styles.modalActions}>
                    {/* 🟢 ปุ่ม "ตกลง" (ปุ่มเดียว) */}
                    <button onClick={onClose} className={styles.closeButton}>
                        ตกลง
                    </button>
                    
                    {/* ❌ (ลบ) ลบปุ่ม "ทำควิซอีกครั้ง" ทิ้ง ❌ */}
                    {/*
                    {!isPassed && (
                        <button onClick={onRetake} className={styles.retakeButton}>
                            ทำควิซอีกครั้ง
                        </button>
                    )}
                    */}
                </div>
            </div>
        </div>
    );
};


// Component หลักของควิซ
export default function QuizComponent({ lessonId, lessonTitle, courseId, onQuizFinished }) {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [quizResult, setQuizResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        setError(null);
        setQuizResult(null); 
        try {
            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}/quizzes/take`);
            if (!response.ok) throw new Error("Failed to fetch quizzes");
            
            const fetchedQuizzes = await response.json();
            if (fetchedQuizzes.length === 0) {
                setError("ไม่พบควิซสำหรับบทเรียนนี้");
                setLoading(false);
                return;
            }

            setQuizzes(fetchedQuizzes);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
        } catch (err) {
            setError(err.message);
            console.error("Error fetching quizzes:", err);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);


    const handleAnswerSelect = (choice) => {
        const currentQuizId = quizzes[currentQuestionIndex]._id;
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuizId]: choice,
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
            alert("เซสชั่นหมดอายุ, กรุณาเข้าสู่ระบบใหม่ก่อนส่งคำตอบ");
            setError("เซสชั่นหมดอายุ, กรุณาเข้าสู่ระบบใหม่");
            setIsSubmitting(false);
            return;
        }

        const answersPayload = quizzes.map(quiz => ({
            quizId: quiz._id,
            selectedAnswer: selectedAnswers[quiz._id] || null 
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}/quizzes/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers: answersPayload }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Submission failed" }));
                throw new Error(errorData.message || "Submission failed");
            }

            const result = await response.json();
            setQuizResult(result); // แสดง Modal ผลลัพธ์
        } catch (err) {
            setError(err.message);
            console.error("Error submitting quiz:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizzes.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    // ❌ (ลบ) ลบฟังก์ชัน handleRetake ทิ้ง (ไม่ใช้แล้ว)
    // const handleRetake = () => { ... };
    
    // --- Render Logic ---
    if (loading) return <div className={styles.loading}>กำลังโหลดแบบทดสอบ...</div>;
    if (error) return <div className={styles.errorContainer}>ข้อผิดพลาด: {error}</div>;
    if (quizzes.length === 0) return <div className={styles.noContentPlaceholder}>ไม่มีแบบทดสอบสำหรับบทเรียนนี้</div>;

    const currentQuiz = quizzes[currentQuestionIndex];
    const totalQuestions = quizzes.length;
    const currentQuizId = currentQuiz._id;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const isAnswerSelected = selectedAnswers[currentQuizId];
    
    // Render Modal ถ้ามีผลลัพธ์
    if (quizResult) {
        return (
            <QuizResultModal 
                result={quizResult} 
                onClose={onQuizFinished} // ⭐️ ปุ่ม "ตกลง" ปุ่มเดียว จะเรียก onClose เสมอ
                // (onRetake ถูกลบไปแล้ว)
            />
        );
    }
    
    // Render Quiz Question
    return (
        <div className={styles.quizContainer}>
            <div className={styles.quizHeader}>
                <h3 className={styles.quizTitle}>{lessonTitle} (เก็บคะแนน)</h3>
                <p className={styles.quizSubtitle}>แบบทดสอบความเข้าใจครั้งที่ 1</p>
            </div>
            
            <div className={styles.questionSection}>
                <p className={styles.questionNumber}>ข้อที่ {currentQuestionIndex + 1} / {totalQuestions}</p>
                <p className={styles.questionText}>**{currentQuiz.question}**</p>
            </div>

            <div className={styles.choicesGrid}>
                {currentQuiz.choices.map((choice, index) => (
                    <button
                        key={index}
                        className={`${styles.choiceButton} ${selectedAnswers[currentQuizId] === choice ? styles.selected : ''}`}
                        onClick={() => handleAnswerSelect(choice)}
                    >
                        {choice}
                    </button>
                ))}
            </div>

            <div className={styles.paginationSection}>
                <div className={styles.pager}>
                    <button 
                        onClick={handleBack} 
                        disabled={currentQuestionIndex === 0 || isSubmitting}
                        className={styles.navButton}
                    >
                        &lt; Back
                    </button>
                    <div className={styles.pageNumbers}>
                        {quizzes.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.pageNumber} ${index === currentQuestionIndex ? styles.activePage : ''}`}
                                onClick={() => setCurrentQuestionIndex(index)}
                                disabled={isSubmitting}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleNext} 
                        disabled={!isAnswerSelected || isSubmitting}
                        className={styles.navButton}
                    >
                        {isLastQuestion ? 'Submit' : 'Next'} &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}