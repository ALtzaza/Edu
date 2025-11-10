<<<<<<< HEAD
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

=======
// src/components/Navbar.jsx
import {
  Navbar as BSNavbar,
  Nav,
  Dropdown,
  Image,
  Container,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const avatar =
    user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <BSNavbar style={{ background: "#10162F" }} variant="dark" expand="lg">
      <Container>
        <BSNavbar.Brand
          style={{ cursor: "pointer", fontWeight: 700 }}
          onClick={() => navigate("/dashboard")}
        >
          🎓 MyApp
        </BSNavbar.Brand>

        <BSNavbar.Brand
          style={{ cursor: "pointer", fontWeight: 700 }}
          onClick={() => navigate("/courses")}
        >
          Courses
        </BSNavbar.Brand>

        <Nav className="ms-auto d-flex align-items-center">
          <Dropdown align="end">
            <Dropdown.Toggle
              as="div"
              style={{
                cursor: "pointer",
                color: "white",
              }}
              className="dropdown-toggle"
            >
              <Image
                src={avatar}
                roundedCircle
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  border: "2px solid #fff",
                }}
              />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => navigate("/dashboard")}>
                Dashboard
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/profile")}>
                Profile
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/purchases")}>
                Purchases
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={handleLogout}
                style={{ color: "#d9534f" }}
              >
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </BSNavbar>
  );
}
>>>>>>> nopparat
