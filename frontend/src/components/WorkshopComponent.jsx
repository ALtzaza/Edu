// src/components/WorkshopComponent.jsx

import React, { useState, useCallback } from 'react';
import styles from './WorkshopComponent.module.css'; 

const API_BASE_URL = "http://localhost:3000"; 

const WorkshopComponent = ({ courseId, lessonId, lessonTitle, workshopData, onSubmissionSuccess }) => {
    // workshopData คือสถานะปัจจุบันของ Workshop (null หรือ object)
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    // สถานะ
    const isSubmitted = !!workshopData;
    const isApproved = workshopData?.status === 'approved';
    const isRejected = workshopData?.status === 'rejected';
    const isPending = workshopData?.status === 'pending';
    const canResubmit = !isApproved; // อนุญาตให้ส่งใหม่ได้ถ้ายังไม่ Approved

    // 💡 Helper เพื่อจัดรูปแบบวันที่
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("กรุณาเลือกไฟล์เพื่อส่งงาน");
            return;
        }

        setUploading(true);
        setError(null);
        setMessage('กำลังอัปโหลด...');

        const formData = new FormData();
        formData.append("workshopFile", file);

       try {
            // 1. ดึง Token จาก localStorage (หรือที่ที่คุณเก็บไว้)
            // (สำคัญ!) หากคุณใช้ key อื่นที่ไม่ใช่ 'token' ให้เปลี่ยนตรงนี้
            const token = localStorage.getItem('token'); 

            // 2. สร้าง Headers object
            const headers = new Headers();
            if (token) {
                headers.append('Authorization', `Bearer ${token}`);
            }
            // API สำหรับส่งงาน: POST /api/courses/:courseId/lessons/:lessonId/workshops
const response = await fetch(`${API_BASE_URL}/api/workshops/${courseId}/lessons/${lessonId}/workshops`, {
                method: "POST",
                headers: headers,
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "การส่งงานล้มเหลว");
            }

            // เรียก Callback เพื่ออัปเดตสถานะใน CourseLessonPage
            onSubmissionSuccess(); 
            
            setMessage(
                isSubmitted 
                    ? "✅ ส่งงานแก้สำเร็จ! รอการตรวจจากผู้สอน"
                    : "✅ ส่งงานสำเร็จ! รอการตรวจจากผู้สอน"
            );
            setFile(null); // ล้างไฟล์ที่เลือก
        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.message || "เกิดข้อผิดพลาดในการส่งงาน");
            setMessage('');
        } finally {
            setUploading(false);
        }
    };

    // 🎨 ส่วนแสดงผล (Render Logic)
    return (
        <div className={styles.workshopContainer}>
            <h3 className={styles.workshopTitle}>ส่งงาน: {lessonTitle}</h3>
            <p className={styles.workshopDescription}>
                กรุณาทำตามโจทย์ในบทเรียน และส่งไฟล์ที่นี่เพื่อรับการตรวจและรับใบรับรอง
            </p>

            {/* 1. แสดงสถานะปัจจุบัน */}
            <div className={styles.statusBox}>
                {isApproved && (
                    <div className={`${styles.statusCard} ${styles.statusApproved}`}>
                        <span className={styles.statusIcon}>🏆</span>
                        <div className={styles.statusContent}>
                           <h4>ผ่านการอนุมัติ (Approved)</h4>
                           <p>คุณส่งงานและได้รับการอนุมัติเรียบร้อยแล้ว</p>
                        </div>
                    </div>
                )}
                {isPending && (
                    <div className={`${styles.statusCard} ${styles.statusPending}`}>
                        <span className={styles.statusIcon}>⏳</span>
                        <div className={styles.statusContent}>
                           <h4>รอการตรวจ (Pending)</h4>
                           <p>ไฟล์ของคุณถูกส่งเมื่อ: **{formatDate(workshopData.submittedAt)}**</p>
                           <p>โปรดรอผู้สอนตรวจงาน</p>
                        </div>
                    </div>
                )}
                {isRejected && (
                    <div className={`${styles.statusCard} ${styles.statusRejected}`}>
                        <span className={styles.statusIcon}>❌</span>
                        <div className={styles.statusContent}>
                           <h4>ไม่ผ่าน (Rejected) - ต้องส่งแก้</h4>
                           <p>ส่งงานครั้งล่าสุดเมื่อ: **{formatDate(workshopData.submittedAt)}**</p>
                           {workshopData.feedback && (
                               <blockquote className={styles.feedback}>
                                   **Feedback จากผู้สอน:** {workshopData.feedback}
                               </blockquote>
                           )}
                        </div>
                    </div>
                )}
                {!isSubmitted && (
                    <div className={`${styles.statusCard} ${styles.statusNotSubmitted}`}>
                        <span className={styles.statusIcon}>💡</span>
                        <div className={styles.statusContent}>
                           <h4>ยังไม่ได้ส่งงาน</h4>
                           <p>กรุณาเลือกไฟล์และกดส่งงาน</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 2. ฟอร์มส่งงาน (แสดงเมื่อยังไม่ Approved) */}
            {canResubmit && (
                <form className={styles.submissionForm} onSubmit={handleSubmit}>
                    <div className={styles.fileInputGroup}>
                        <label htmlFor="workshopFile" className={styles.fileLabel}>
                            {isSubmitted ? "อัปโหลดไฟล์งานแก้" : "อัปโหลดไฟล์งาน"}
                        </label>
                        <input
                            type="file"
                            id="workshopFile"
                            onChange={handleFileChange}
                            required
                            disabled={uploading}
                            className={styles.fileInput}
                        />
                    </div>

                    {file && (
                        <p className={styles.selectedFile}>
                            📂 **{file.name}**
                            <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </p>
                    )}


                    {error && <p className={`${styles.message} ${styles.errorMessage}`}>🛑 {error}</p>}
                    {message && <p className={`${styles.message} ${styles.infoMessage}`}>📢 {message}</p>}

                    <button 
                        type="submit" 
                        disabled={uploading || !file} 
                        className={styles.submitButton}
                    >
                        {uploading ? "กำลังส่ง..." : isSubmitted ? "ส่งงานแก้อีกครั้ง" : "ส่งงาน"}
                    </button>
                    {isSubmitted && <p className={styles.noteResubmit}>*การส่งครั้งใหม่จะแทนที่การส่งครั้งล่าสุดและรีเซ็ตสถานะเป็นรอการตรวจ</p>}
                </form>
            )}

            {!canResubmit && isApproved && (
                <div className={styles.noResubmitMessage}>
                        <span className={styles.statusIcon}>🎉</span>
                    <p>🥳 **คุณผ่าน Workshop นี้แล้ว!** ไม่จำเป็นต้องส่งซ้ำอีก</p>
                </div>
            )}
        </div>
    );
};

export default WorkshopComponent;