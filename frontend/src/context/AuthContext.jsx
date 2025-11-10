// src/context/AuthContext.jsx (V6 - เพิ่ม 'updateUser')

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(localStorage.getItem('token')); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // (API 'GET /profile' (V2))
          const res = await api.get('/users/profile'); 
          setUser(res.data.user); 
          setToken(storedToken);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); 
    };
    validateToken();
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData)); 
    api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };
  
  // ⭐️ (ใหม่) (V6) ⭐️
  // (ฟังก์ชัน "อัปเดต" (V6) (เฉพาะ 'user' 
  //  (สำหรับ 'ProfilePage' (V2))))
  const updateUser = (newUserData) => {
    setUser(newUserData); // (อัปเดต "สมอง")
    localStorage.setItem('user', JSON.stringify(newUserData)); // (อัปเดต "LocalStorage")
  };

  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    // ⭐️ (แก้ไข) "เพิ่ม" 'updateUser' (V6) เข้าไปใน 'value' ⭐️
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};