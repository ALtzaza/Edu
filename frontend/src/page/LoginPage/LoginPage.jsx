// src/pages/LoginPage/LoginPage.jsx (V4 - Smart Redirect)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import api from '../../api/api'; 
import { useAuth } from '../../context/AuthContext'; 
import './LoginPage.css'; 

// ⭐️ (Form 1: Login - แก้ไข)
// (ลบ 'onLoginSuccess' ➡️ เพิ่ม 'useNavigate')
const LoginForm = () => {
  const [login, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth(); // (ดึง "สมอง")
  const navigate = useNavigate(); // ⭐️ (ย้าย 'navigate' มาไว้ที่นี่)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // (API จริง) ยิง API (routes/users.js)
      const res = await api.post('/users/login', { 
        login: login, 
        password: password 
      });
      
      // 1. (เรียก "สมอง" ให้อัปเดต Navbar)
      authLogin(res.data.user, res.data.token); 
      
      // 2. ⭐️ (แก้ไข) "เช็ค Role" ก่อน "เด้ง" ⭐️
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard'); // ⬅️ (ถ้า Admin ➡️ ไป Dashboard)
      } else {
        navigate('/'); // ⬅️ (ถ้า Student ➡️ ไป หน้าแรก)
      }

    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
    // (ไม่ต้อง finally(false) เพราะถ้าสำเร็จ จะเด้งไป)
  };

  return (
    <motion.form 
      className="auth-form login-form" 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1>Log In</h1>
      <div className="form-group">
        <label htmlFor="login">Email or Username</label>
        <input 
          type="text" id="login" className="form-input"
          value={login} onChange={(e) => setLoginField(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input 
          type="password" id="password" className="form-input"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? "Loading..." : "Log In"}
      </button>
      {error && <div className="error-message">{error}</div>}
      <Link to="/forgot-password" className="forgot-password-link">ลืมรหัสผ่าน?</Link>
    </motion.form>
  );
};

// ⭐️ (Form 2: Register - ไม่แก้ไข)
const RegisterForm = ({ onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !surname || !username || !email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/users/register', { 
        name: name,
        surname: surname, 
        username: username,
        email: email, 
        password: password,
        role: "student" 
      });
      
      alert("สมัครสมาชิกสำเร็จ! กรุณา Login");
      onRegisterSuccess(); 

    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <motion.form 
      className="auth-form register-form" 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1>Register</h1>
      <div className="form-group">
        <label htmlFor="reg-name">Name</label>
        <input type="text" id="reg-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      
      <div className="form-group">
        <label htmlFor="reg-surname">Surname</label>
        <input type="text" id="reg-surname" className="form-input" value={surname} onChange={(e) => setSurname(e.target.value)} />
      </div>
      
      <div className="form-group">
        <label htmlFor="reg-username">Username</label>
        <input type="text" id="reg-username" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="reg-email">Email</label>
        <input type="email" id="reg-email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="reg-password">Password</label>
        <input type="password" id="reg-password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? "Loading..." : "Register"}
      </button>
      {error && <div className="error-message">{error}</div>}
    </motion.form>
  );
};


// ⭐️ (Component หลัก: LoginPage - แก้ไข)
const LoginPage = () => {
  const [isLoginView, setIsLoginView] = useState(true); 
  // (เรา "ไม่" ใช้ 'navigate' ที่นี่แล้ว)
  const location = useLocation(); 

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'register') {
      setIsLoginView(false);
    }
  }, [location.search]); 

  return (
    <div className="login-page-container">
      
      <motion.div 
        className="login-form-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="auth-toggle-buttons" data-active={isLoginView ? 'login' : 'register'}>
          <button 
            className={`toggle-button ${isLoginView ? 'active' : ''}`}
            onClick={() => setIsLoginView(true)}
          >
            Log In
          </button>
          <button 
            className={`toggle-button ${!isLoginView ? 'active' : ''}`}
            onClick={() => setIsLoginView(false)}
          >
            Register
          </button>
          <motion.div className="active-backdrop" layout />
        </div>

        <AnimatePresence mode="wait">
          {isLoginView ? (
            // ⭐️ (แก้ไข) ลบ onLoginSuccess ออก
            <LoginForm key="login" />
          ) : (
            <RegisterForm 
              key="register" 
              onRegisterSuccess={() => setIsLoginView(true)} 
            />
          )}
        </AnimatePresence>
        
      </motion.div>
    </div>
  );
};

export default LoginPage;