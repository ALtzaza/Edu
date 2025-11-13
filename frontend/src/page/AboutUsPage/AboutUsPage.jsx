// src/pages/AboutUsPage/AboutUsPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUsPage.css'; // ⭐️ 1. Import CSS ธรรมดา

// ⭐️⭐️⭐️ (จุดที่ 1) ใส่ข้อมูลสมาชิกทีมของคุณ 3 คนตรงนี้ ⭐️⭐️⭐️
const teamData = [
  {
    image: './images/stdempimg.jpg', // ⭐️ ใส่ Path รูป
    name: 'พบพร จิตโสภา', // ⭐️ ใส่ชื่อ
    role: 'Lead Developer / Founder', // ⭐️ ใส่ตำแหน่ง
    bio: 'ผู้เชี่ยวชาญด้าน Back-end และสถาปัตยกรรมระบบ ผู้ก่อตั้ง Tid-Code...',
    social: {
      github: '#', // ⭐️ ใส่ Link GitHub
      linkedin: '#', // ⭐️ ใส่ Link LinkedIn
    },
  },
  {
    image: '../images/ishi.jpg', // ⭐️ ใส่ Path รูป
    name: 'อชิรยุ นวลสกุลวัฒน์', // ⭐️ ใส่ชื่อ
    role: 'Frontend Developer / UI-UX', // ⭐️ ใส่ตำแหน่ง
    bio: 'ศิลปินผู้อยู่เบื้องหลังความสวยงาม ใช้งานง่าย ของ Tid-Code ทั้งหมด...',
    social: {
      github: '#',
      linkedin: '#',
    },
  },
  {
    image: './images/IMG_9198.jpg', // ⭐️ ใส่ Path รูป
    name: 'สมาชิกคนที่ 3', // ⭐️ ใส่ชื่อ
    role: 'Fullstack developer', // ⭐️ ใส่ตำแหน่ง
    bio: 'ผู้ถ่ายทอดความรู้ที่ซับซ้อนให้กลายเป็นคอร์สที่เข้าใจง่าย และสร้างชุมชน...',
    social: {
      github: '#',
      linkedin: '#',
    },
  },
];

export default function AboutUsPage() {
  return (
    // ⭐️ 2. เปลี่ยนเป็น className="..." ทั้งหมด
    <div className="about-page-container">
      {/* --- 1. Hero Section --- */}
      <section className="about-hero-section">
        <h1 className="about-hero-title">
          We're <span className="about-gradient-text">Tid-Code</span>
        </h1>
        <p className="about-hero-subtitle">
          เราไม่ใช่แค่โรงเรียนสอนเขียนโค้ด
          เราคือชุมชนของผู้สร้างที่หลงใหลในการแบ่งปันความรู้
        </p>
      </section>

      {/* --- 2. Our Story Section --- */}
      <section className="about-story-section">
        <h2>Our Story</h2>
        <div className="about-story-content">
          <p>
            Tid-Code
            ถือกำเนิดขึ้นจากคำถามง่ายๆ:
            "ทำไมการเรียนรู้เทคโนโลยีต้องซับซ้อนและโดดเดี่ยว?"
            เราเชื่อว่าทุกคนมีความสามารถในการ "สร้าง"
            ขอเพียงแค่มีเครื่องมือที่ถูกต้อง
            และ "ชุมชน" ที่พร้อมสนับสนุน
          </p>
          <p>
            ภารกิจของเราคือการทลายกำแพงการเรียนรู้
            เราสร้างคอร์สที่ไม่เพียงแค่ "สอน" แต่ยัง "สร้างแรงบันดาลใจ"
            ด้วยโปรเจกต์ที่ใช้งานได้จริง
            และสภาพแวดล้อมที่ส่งเสริมการทำงานร่วมกัน
            เราอยู่ที่นี่เพื่อช่วยให้คุณเปลี่ยนจาก "ผู้เรียน" ไปเป็น "ผู้สร้าง"
          </p>
        </div>
      </section>

      {/* --- 3. Team Section --- */}
      <section className="about-team-section">
        <h2>Meet the Team</h2>
        <p className="about-team-subtitle">
          พลังขับเคลื่อนที่อยู่เบื้องหลังทุกคอร์สและทุกบรรทัดของโค้ด
        </p>
        
        <div className="about-team-grid">
          {teamData.map((member, index) => (
            <div className="about-team-card" key={index}>
              <div className="about-card-image-container">
                <img
                  src={member.image}
                  alt={member.name}
                  className="about-card-image"
                />
              </div>
              <h3 className="about-card-name">{member.name}</h3>
              <p className="about-card-role">{member.role}</p>
              <p className="about-card-bio">{member.bio}</p>
              <div className="about-card-socials">
                {member.social.github && (
                  <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                )}
                {member.social.linkedin && (
                  <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. CTA Section --- */}
      <section className="about-cta-section">
        <h2>Join Our Community</h2>
        <p>
          ไม่ว่าคุณจะเพิ่งเริ่มต้น หรือต้องการยกระดับทักษะ
          ที่นี่มีที่สำหรับคุณเสมอ
        </p>
        <Link to="/courses" className="about-cta-button">
          Explore All Courses
        </Link>
      </section>
    </div>
  );
}