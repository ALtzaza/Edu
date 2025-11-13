import React from 'react';
import { Link } from 'react-router-dom';
// 1. Import ไฟล์ .module.css เข้ามา
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    // 2. ใช้ className จาก styles object ที่เรา import
    <nav className={styles.navbar}>

      {/* 3. กลุ่มเมนูด้านซ้าย */}
      <div className={styles.leftGroup}>
        <Link to="/catalog" className={styles.navLink}>Catalog</Link>
        <Link to="/lab" className={styles.navLink}>Tid_Lab</Link>
        <Link to="/blog" className={styles.navLink}>Blog</Link>
        <Link to="/review" className={styles.navLink}>Review</Link>
        
        <Link to="/profile" className={styles.navLink}>
          {/* ไอคอน Profile */}
          <svg className={styles.profileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Your_Profile</span>
        </Link>
      </div>

      {/* 4. โลโก้ด้านขวา */}
      <div className={styles.rightGroup}>
        <Link to="/" className={styles.logo}>
          Tid_Code.
        </Link>
      </div>

    </nav>
  );
};

export default Navbar;