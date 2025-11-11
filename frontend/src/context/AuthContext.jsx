// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api'; // (Import ตัวกลาง API)

// 1. สร้าง "กล่อง" Context
const AuthContext = createContext(null);

// 2. (สำคัญ) สร้าง "ตัวหุ้ม" (Provider)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // (ข้อมูล User ที่ Login)
  const [token, setToken] = useState(localStorage.getItem('token')); // (Token)
  const [loading, setLoading] = useState(true); // (เพิ่ม Loading State)

  // (useEffect นี้ จะ "โหลด" Token/User เก่า ตอนเปิดเว็บครั้งแรก)
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // 1. แปะ Token ใน Header (เผื่อไว้)
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // 2. ⭐️ (สำคัญ) ยิง API (ของเพื่อน) เพื่อ "เช็ค" ว่า Token นี้ยังใช้ได้มั้ย
          // (API 'GET /profile' ใน routes/users.js)
          const res = await api.get('/users/profile'); 
          
          setUser(res.data.user); // 3. ถ้าใช้ได้ ➡️ เก็บ User
          setToken(storedToken);

        } catch (err) {
          // 4. ถ้า Token หมดอายุ ➡️ ลบทิ้ง
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); // (โหลดเสร็จแล้ว)
    };
    validateToken();
  }, []);

  // 3. (ฟังก์ชัน "Login" ที่หน้า Login จะเรียกใช้)
  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    setToken(userToken);
    setUser(userData);
  };

  // 4. (ฟังก์ชัน "Logout")
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // (ลบ User ที่เก็บไว้ด้วย)
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  // (ถ้ายังโหลด/เช็ค Token ไม่เสร็จ ให้แสดง Loading...)
  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10162F', color: 'white' }}>
        Loading Application...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. (Hook) สร้าง Hook "useAuth" (เพื่อให้ Navbar เรียกใช้ง่ายๆ)
export const useAuth = () => {
  return useContext(AuthContext);
};