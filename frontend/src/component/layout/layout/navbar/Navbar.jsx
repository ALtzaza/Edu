// src/components/layout/Navbar.jsx (ฉบับแก้ไข V4)

import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // (Import CSS V4 ที่เราเพิ่งแก้)

const Navbar = () => {
  return (
    <nav className="navbar-container">
      
      {/* 1. ⭐️ (แก้ไข) "ฝั่งซ้าย" (หุ้ม โลโก้ + ลิงก์) ⭐️ */}
      <div className="navbar-left">
        
        {/* 2. ⭐️ (ใหม่) "กล่อง" (ล็อคความกว้างโลโก้) ⭐️ */}
        <div className="navbar-logo-container">
          <Link to="/" className="navbar-logo" key={Math.random()}>
            {/* 3. ⭐️ (ใหม่) โลโก้ 3 สี ⭐️ */}
            <span className="logo-class">Tid</span>
            <span className="logo-punctuation">_</span>
            <span className="logo-variable">Code</span>
            <span className="logo-punctuation">.</span>
            

          </Link>
          {/* (ย้าย Cursor ออกมาอยู่นอก <Link> เพื่อให้กะพริบตลอด) */}
          <span className="logo-caret"></span> 
        </div>

        {/* 4. (คงเดิม) ลิงก์กลาง (ที่แก้ "กดใช้งานยาก" แล้ว) */}
        <div className="navbar-links">
          <div className="nav-link-item">
            <Link to="/catalog">Catalog</Link>
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
        </div>
      </div>

      {/* 5. ⭐️ (แก้ไข) "ฝั่งขวา" (โปรไฟล์) ⭐️ */}
      <div className="navbar-right">
        <Link to="/profile">Your_Profile</Link>
        <div className="navbar-avatar">P</div>
      </div>

    </nav>
  );
};

export default Navbar;