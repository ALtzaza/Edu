// src/pages/ResetPasswordPage/ResetPasswordPage.jsx (V1)

import React, { useState, useEffect } from 'react';
// ⭐️ (สำคัญ) Import 'useNavigate' (เปลี่ยนหน้า) 
// ⭐️ และ 'useSearchParams' (อ่าน Token)
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import api from '../../api/api'; // (Import ตัวกลาง API)
import './ResetPasswordPage.css'; // (Import CSS)

const ResetPasswordPage = () => {
  // --- State (กล่องเก็บข้อมูล) ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState(null);
  
  const [message, setMessage] = useState(null); 
  const [error, setError] = useState(null); 
  const [loading, setLoading] = useState(false);

  // --- Hooks (เครื่องมือ) ---
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- (useEffect 1: อ่าน Token จาก URL) ---
  useEffect(() => {
    // 1. ⭐️ (สำคัญ) อ่าน 'token' (ABC123) 
    //    จาก URL (.../reset-password?token=ABC123)
    const resetToken = searchParams.get('token'); 
    
    if (resetToken) {
      setToken(resetToken);
    } else {
      setError("ไม่พบ Token ใน URL");
    }
  }, [searchParams]); // (ทำงานเมื่อ URL เปลี่ยน)


  // --- (ฟังก์ชัน "ยิง API" เมื่อกดปุ่ม) ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    // (เช็ค 1: รหัสผ่านตรงกัน)
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่าน 2 ช่องไม่ตรงกัน");
      return;
    }
    // (เช็ค 2: API 'validatePassword' ของเพื่อน (Frontend Check))
    if (newPassword.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // ⭐️ (API จริง) ยิง API (routes/users.js)
      // (POST /api/users/reset-password)
      const res = await api.post('/users/reset-password', { 
        token: token, 
        newPassword: newPassword
      });
      
      // (แสดงข้อความสำเร็จ)
      setMessage(res.data.message + " (กำลังเด้งกลับไปหน้า Login...)");
      
      // (รอ 3 วิ แล้วเด้งกลับไปหน้า Login)
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      // (ถ้า API Error 400 (เช่น "Token ไม่ถูกต้องหรือหมดอายุแล้ว"))
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    } 
    // (ไม่ต้อง finally(false) เพราะถ้าสำเร็จ จะเด้งไปหน้าอื่น)
  };

  // --- (JSX) ---
  return (
    <div className="reset-password-page-container">
      
      <motion.div 
        className="reset-password-form-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <form className="reset-password-form" onSubmit={handleSubmit}>
          <h1>ตั้งรหัสผ่านใหม่</h1>
          <p>กรุณาตั้งรหัสผ่านใหม่ของคุณ (อย่างน้อย 6 ตัวอักษร)</p>
          
          {/* (ช่องกรอก New Password) */}
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <motion.input 
              whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(86, 156, 214, 0.5)" }}
              type="password"
              id="new-password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          
          {/* (ช่องกรอก Confirm Password) */}
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <motion.input 
              whileFocus={{ scale: 1.02, boxShadow: "0 0 10px rgba(86, 156, 214, 0.5)" }}
              type="password"
              id="confirm-password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          {/* (ปุ่ม Submit) */}
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="submit-button"
            disabled={loading || !token} // (ปิดปุ่มตอนโหลด หรือ ถ้าไม่มี Token)
          >
            {loading ? "Loading..." : "ยืนยันรหัสผ่านใหม่"}
          </motion.button>

          {/* ⭐️ (แสดง Error หรือ Success) ⭐️ */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div 
                className="success-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;