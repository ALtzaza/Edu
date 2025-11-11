// src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx (V2 - แสดงลิงก์)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import api from '../../api/api'; 
import './ForgotPasswordPage.css'; 

const ForgotPasswordPage = () => {
  // --- State (กล่องเก็บข้อมูล) ---
  const [login, setLoginField] = useState(''); 
  const [message, setMessage] = useState(null); 
  const [error, setError] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  // ⭐️ 1. (เพิ่ม) State สำหรับ "เก็บลิงก์"
  const [frontendResetLink, setFrontendResetLink] = useState(null); 

  // --- (ฟังก์ชัน "ยิง API" เมื่อกดปุ่ม) ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!login) {
      setError("กรุณากรอก Email หรือ Username");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setFrontendResetLink(null); // (เคลียร์ลิงก์เก่า)

    try {
      // (API จริง) ยิง API (routes/users.js)
      const res = await api.post('/users/forgot-password', { 
        login: login, 
      });
      
      // ⭐️ 2. (แก้ไข) ⭐️
      // (Backend (API) ส่ง URL ของ Backend (Port 3000) กลับมา
      //  เราต้อง "ดึง" แค่ Token (ABC123) ออกมา)
      const backendLink = new URL(res.data.resetLink);
      const token = backendLink.searchParams.get('token');
      
      // (สร้างลิงก์สำหรับ Frontend (Port 5173))
      const frontendLink = `/reset-password?token=${token}`;
      
      // (เก็บลิงก์ไว้แสดงผล)
      setFrontendResetLink(frontendLink);
      setMessage(res.data.message); // (แสดง "สร้างลิงก์สำเร็จ")

    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // --- (JSX) ---
  return (
    <div className="forgot-password-page-container">
      
      <motion.div 
        className="forgot-password-form-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <h1>ลืมรหัสผ่าน</h1>
          <p>กรอก Email หรือ Username ของคุณ</p>
          
          <div className="form-group">
            <label htmlFor="login">Email or Username</label>
            <motion.input 
              whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(86, 156, 214, 0.5)" }}
              type="text"
              id="login"
              className="form-input"
              value={login}
              onChange={(e) => setLoginField(e.target.value)}
            />
          </div>
          
          <motion.button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? "Loading..." : "ส่งคำขอ"}
          </motion.button>

          {/* ⭐️ 3. (แก้ไข) แสดง Error / Success / Link ⭐️ */}
          <AnimatePresence>
            {error && (
              <motion.div className="error-message">
                {error}
              </motion.div>
            )}
            
            {message && (
              <motion.div className="success-message">
                {message}
              </motion.div>
            )}
            
            {/* ⭐️ (เพิ่ม) แสดงลิงก์ที่นี่ (สำหรับ Demo) ⭐️ */}
            {frontendResetLink && (
              <motion.div 
                className="success-message" 
                style={{ marginTop: '1rem', textAlign: 'left' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>ลิงก์ เปลี่ยนรหัสผ่านใหม่</p>
                {/* ⭐️ (สำคัญ) ใช้ <Link> (ของ React) ไปยัง Path ที่ถูกต้อง ⭐️ */}
                <Link 
                  to={frontendResetLink} 
                  style={{ color: 'blue', fontWeight: 'bold', wordBreak: 'break-all' }}
                >
                  คลิกที่นี่เพื่อไปหน้าตั้งรหัสผ่านใหม่
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <Link to="/login" className="back-to-login-link">
            กลับไปหน้า Login
          </Link>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;