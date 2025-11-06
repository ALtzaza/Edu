// src/components/layout/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // (Import CSS ที่เราเพิ่งสร้าง)

const Footer = () => {
  return (
    <footer className="footer-container">
      
      {/* -------------------- ส่วนบน (สีฟ้าอ่อน) -------------------- */}
      <div className="footer-top">
        
        {/* 1. โลโก้ (Mock) */}
        <div className="footer-logo">
          <div className="mock-logo-box">Tid-Code.</div>
          <p>Unlock Your Code Journey</p>
        </div>
        
        {/* 2. Contact */}
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Email: <a href="mailto:hello@tidcode.com">hello@tidcode.com</a></p>
          <p>Instagram: <a href="#">@TidCodeOfficial</a></p>
          <p>Facebook: <a href="#">TidCode</a></p>
        </div>
        
        {/* 3. Address */}
        <div className="footer-address">
          <h4>Address</h4>
          <p>
            224 Candyland Lane, Brooklyn, NY<br />
            (646) 555-4567
          </p>
          <p className="copyright">
            ข้อกำหนดและเงื่อนไข<br />
            Tid-Code® 2024 All Rights Reserved.
          </p>
        </div>
      </div>

      {/* -------------------- ส่วนล่าง (3 คอลัมน์) -------------------- */}
      <div className="footer-bottom">
        <div className="footer-column col-socials">
          <h3>Our Socials</h3>
          {/* (ใส่ลิงก์ Socials ที่นี่) */}
        </div>
        
        <div className="footer-column col-email">
          <h3>Email us</h3>
          {/* (ใส่ Mailto ที่นี่) */}
        </div>
        
        <div className="footer-column col-start">
          <h3>Start Today</h3>
          {/* (ใส่ลิงก์ไปหน้า Register/Courses) */}
        </div>
      </div>
      
    </footer>
  );
};

export default Footer;