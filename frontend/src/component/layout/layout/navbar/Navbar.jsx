// src/components/layout/Navbar.jsx (ฉบับ V6 - สมบูรณ์)

import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';
import './Navbar.css'; 

// 1. ⭐️ (สำคัญ) Import Hook "useAuth" (จาก "สมอง")
import { useAuth } from '../../../../context/AuthContext.jsx'; 
import api from '../../../../api/api.js'; 
// (ต้อง npm install react-bootstrap-icons)
import { EnvelopeFill } from 'react-bootstrap-icons'; 
// (ต้อง npm install react-bootstrap)
import { Dropdown } from 'react-bootstrap'; 


const Navbar = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // (ยิง API 'notifications' เมื่อ Login)
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setUnreadCount(res.data.unreadCount || 0); 
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); 
      return () => clearInterval(interval); 
    } else {
      setUnreadCount(0); 
    }
  }, [user]); 

  return (
    <nav className="navbar-container">
      
      {/* (ฝั่งซ้าย - V4) */}
      <div className="navbar-left">
        <div className="navbar-logo-container">
          <Link to="/" className="navbar-logo" key={Math.random()}>
            <span className="logo-class">Tid</span>
            <span className="logo-punctuation">_</span>
            <span className="logo-variable">Code</span>
            <span className="logo-punctuation">.</span>
          </Link>
          <span className="logo-caret"></span> 
        </div>
        <div className="navbar-links">
          <div className="nav-link-item">
            <Link to="/courses">Catalog</Link>
          </div>
          <div className="nav-link-item">
            <Link to="/tid-lab">Tid_Lab</Link>
          </div>
          <div className="nav-link-item">
            <Link to="/blog">Blog</Link>
          </div>
          <div className="nav-link-item">
            <Link to="/reviews">Review</Link>
          </div>
          {user?.role === 'admin' && (
            <div className="nav-link-item">
              <Link to="/admin">Admin</Link>
            </div>
          )}
        </div>
      </div>

      {/* ⭐️ (แก้ไข) "ฝั่งขวา" (โปรไฟล์ / Login) ⭐️ */}
      <div className="navbar-right">
        
        { user ? (
          // ---------------------------------
          // ⭐️ 1. (ถ้า "Login แล้ว") (Req 5 & 6)
          // ---------------------------------
          <>
            {/* (กระดิ่ง) */}
            <div className="notification-bell-container">
              <EnvelopeFill />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount} 
                </span>
              )}
            </div>

            {/* ⭐️ (Dropdown โปรไฟล์) ⭐️ */}
            <Dropdown align="end">
              <Dropdown.Toggle 
                as="div" 
                className="navbar-avatar"
                style={{ cursor: 'pointer' }}
              >
                {user.name ? user.name[0].toUpperCase() : "P"}
              </Dropdown.Toggle>

              <Dropdown.Menu data-bs-theme="dark">
                <Dropdown.ItemText>
                  Signed in as: <br/>
                  <strong>{user.name || user.username}</strong>
                </Dropdown.ItemText>
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/Profile">
                  จัดการโปรไฟล์ (Manage Profile)
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/purchases">
                  คำสั่งซื้อของฉัน (My Purchases)
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout} style={{ color: '#F44747' }}>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </>

        ) : (
          // ---------------------------------
          // ⭐️ 2. (ถ้า "ยังไม่ Login") (Req 4)
          // ---------------------------------
          <>
            <Link to="/login" className="navbar-login-button">
              Log In
            </Link>
            {/* (ปุ่ม Sign Up (Register)) */}
            <Link 
              to="/login?view=register" 
              className="navbar-login-button" 
              style={{ backgroundColor: '#4EC9B0' }}
            >
              Sign Up
            </Link>
          </>
        )}

      </div>
    </nav>
  );
};

export default Navbar;