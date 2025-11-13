import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import api from "../../api/api";

import "./HomePage.css"; // (Import CSS V18 ที่คุณเพิ่งส่งมา)

// ⭐️ (ใหม่) 1. Component "Our Classes" (ที่ยิง API จริง)

// ---------------------------------------------------

const FeaturedCoursesSection = () => {
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 1. ⭐️ (แก้ไข) กำหนด URL หลักของ Server
  // (นี่คือที่อยู่ที่ Server (Back-end) ของคุณรันอยู่)
  const SERVER_URL = "http://localhost:3000";

  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get("/courses?sort=rating_desc&limit=2");
        setCourses(res.data.data || []); 
      } catch (err) {
        console.error("Failed to fetch top courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCourses();
  }, []); 

  return (
    <section className="featured-courses-section">
      <h2>Our Classes</h2>

      {loading ? (
        <p style={{ color: "white" }}>Loading classes...</p>
      ) : courses.length > 0 ? (
        courses.map((course, index) => {
          
          // 2. ⭐️ (แก้ไข) สร้าง URL ที่สมบูรณ์สำหรับรูปภาพ
          // (เช่น: http://localhost:3000/uploads/thumbnails/image.jpg)
          const thumbnailUrl = course.thumbnail 
            ? `${SERVER_URL}/${course.thumbnail}` 
            : null;

          return (
            <div
              className="course-card-wrapper"
              style={{ flexDirection: index % 2 === 1 ? "row-reverse" : "row" }}
              key={course._id}
            >
              {/* (ส่วนรูปภาพ) */}
              <div className="course-image-container">
                <div
                  className="course-image-mock"
                  style={{
                    // 3. ⭐️ (แก้ไข) ใช้ thumbnailUrl ตัวแปรใหม่
                    backgroundImage: thumbnailUrl
                      ? `url(${thumbnailUrl})`
                      : "none",
                    backgroundColor: thumbnailUrl // ⬅️ แก้ไขตรงนี้ด้วย
                      ? "#1E1E1E"
                      : index % 2 === 0
                      ? "#007ACC"
                      : "#569CD6",
                  }}
                >
                  {!thumbnailUrl && (index % 2 === 0 ? "PYTHON" : "C LANG")}
                </div>
              </div>

              {/* (ส่วนเนื้อหา) */}
              <div className="course-content-container">
                <h3>{course.title}</h3>
                <p>
                  {course.description
                    ? course.description.substring(0, 100) + "..."
                    : index % 2 === 0
                    ? '"หลักสูตรที่เข้าใจง่าย..."'
                    : '"ชุมชนที่พร้อมสนับสนุน..."'}
                </p>
                <Link to={`/courses/${course._id}`} className="cta-button">
                  View Course
                </Link>
              </div>
            </div>
          );
        })
      ) : (
        <p style={{ color: "white" }}>ยังไม่มีคอร์สที่เปิดสอน</p>
      )}
    </section>
  );
};
// ---------------------------------------------------

// ⭐️ (ใหม่) 2. Component "Typing Animation" (V17)

// (นี่คือ Logic พิมพ์/ลบ แบบ Codepen ...21.28.47.jpg)

// ---------------------------------------------------

const TypingAnimation = () => {
  const [typedText, setTypedText] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  const [loopNum, setLoopNum] = useState(0);

  const [typingSpeed, setTypingSpeed] = useState(150);

  // (คำที่ต้องการพิมพ์)

  const phrases = [
    "function animate() { ... }",

    "const tidCode = 'Awesome';",

    "SELECT * FROM users;",

    "<Tid_Code />",
  ];

  useEffect(() => {
    // (ฟังก์ชันที่ 'จำ' ค่า phrases (Closure))

    const handleType = () => {
      const i = loopNum % phrases.length;

      const fullText = phrases[i];

      // (Logic พิมพ์/ลบ)

      setTypedText(
        isDeleting
          ? fullText.substring(0, typedText.length - 1)
          : fullText.substring(0, typedText.length + 1)
      );

      // (ปรับความเร็ว)

      setTypingSpeed(isDeleting ? 80 : 150);

      // (ถ้าพิมพ์จบ)

      if (!isDeleting && typedText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); // (ค้าง 2 วิ)

        // (ถ้าลบจบ)
      } else if (isDeleting && typedText === "") {
        setIsDeleting(false);

        setLoopNum(loopNum + 1);
      }
    };

    // (เรียกฟังก์ชันพิมพ์)

    const timer = setTimeout(handleType, typingSpeed);

    return () => clearTimeout(timer); // (Cleanup)
  }, [typedText, isDeleting, loopNum, phrases, typingSpeed]); // (ใส่ Dependency ให้ครบ)

  return (
    <div className="typing-box-js">
      <span className="token-const">const</span>{" "}
      <span className="token-function">typeLoop</span>{" "}
      <span className="token-punctuation">=</span>{" "}
      <span className="token-punctuation">()</span>{" "}
      <span className="token-punctuation">=</span>{" "}
      <span className="token-punctuation">{"{"}</span>
      <br />
      <span style={{ paddingLeft: "1rem" }} className="token-comment">
        /* {typedText} */
      </span>
      <span className="cursor">|</span>
      <br />
      <span className="token-punctuation">{"}"}</span>;
    </div>
  );
};

// ---------------------------------------------------

// ⭐️ 3. Component "HomePage" (ตัวหลัก)

const HomePage = () => {
  return (
    <div className="homepage-container">
      {/* -------------------- 1. Hero Section (V18) -------------------- */}

      <section className="hero-section">
        {/* 1. (ด้านซ้าย - V9 - คงเดิม) */}

        <div className="hero-content">
          {/* (Stack Glitch V9) */}

          <div className="hero-glitch-wrapper">
            <div className="stack stack-mission" style={{ "--stacks": 3 }}>
              <span style={{ "--index": 0 }}>Our Mission</span>

              <span style={{ "--index": 1 }}>Our Mission</span>

              <span style={{ "--index": 2 }}>Our Mission</span>
            </div>

            <div className="stack stack-journey" style={{ "--stacks": 3 }}>
              <span style={{ "--index": 0 }}>Start Your Journey</span>

              <span style={{ "--index": 1 }}>Start Your Journey</span>

              <span style={{ "--index": 2 }}>Start Your Journey</span>
            </div>
          </div>

          <p>
            "เราเชื่อว่าทุกคนสามารถเป็นผู้สร้าง ได้ด้วยการเรียนรู้ที่ใช้
            และชุมชนที่สนับสนุน" — Tid-Code
          </p>

          <Link to="/courses" className="cta-button">
            Start Learning
          </Link>
        </div>

        {/* 2. ⭐️ (แก้ไข) "ด้านขวา" (V18 - Codepen Mock) ⭐️ */}

        <div className="hero-codepen-mock">
          {/* (กล่อง HTML) */}

          <div className="code-box">
            <div className="code-box-header">
              <span className="dot red"></span>

              <span className="dot yellow"></span>

              <span className="dot green"></span>
            </div>

            <div className="code-content">
              {/* (ใช้ <pre> เพื่อรักษาการจัดช่องไฟ) */}

              <pre>
                <span className="token-tag">{"<div"}</span>{" "}
                <span className="token-attr">{"class="}</span>
                <span className="token-string">{'"Tid_Code"'}</span>
                <span className="token-tag">{">"}</span>
                <br />
                {"  "}
                <span className="token-tag">{"<h1>"}</span>
                Start Your Journey
                <span className="token-tag">{"</h1>"}</span>
                <br />
                <span className="token-tag">{"</div>"}</span>
              </pre>
            </div>
          </div>

          {/* (กล่อง SCSS) */}

          <div className="code-box">
            <div className="code-box-header">{/* (Mock Title) */}</div>

            <div className="code-content">
              <pre>
                <span className="token-selector">{".rect"}</span>{" "}
                <span className="token-punctuation">{"{"}</span>
                <br />
                {"  "}
                <span className="token-keyword">{"background"}</span>:{" "}
                <span className="token-function">{"linear-gradient"}</span>
                (...);
                <br />
                {"  "}
                <span className="token-const">{"$gray"}</span>:{" "}
                <span className="token-string">{"#74B088"}</span>;
                <br />
                <span className="token-punctuation">{"}"}</span>
              </pre>
            </div>
          </div>

          {/* (กล่อง JS - ที่มี Animation) */}

          <div className="code-box">
            <div className="code-box-header">{/* (Mock Title) */}</div>

            <div className="code-content">
              {/* (เรียก Component Typing V17) */}

              <TypingAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 2. About Section (V11) -------------------- */}

      <section className="about-section">
        {/* (รูปซ้าย) */}

        <div className="about-graphic">(Mock Graphic 2)</div>

        {/* (ข้อความขวา) */}

        <div className="about-content">
          <h2>Who we are</h2>

          <p>"ที่ "Tid-Code", เราหลงใหลในการสร้างชุมชน..."</p>

          <Link to="/about" className="cta-button">
            About us
          </Link>
        </div>
      </section>

      {/* -------------------- 3. Featured Courses (V15) -------------------- */}

      <FeaturedCoursesSection />

      {/* -------------------- 4. Final CTA (V11) -------------------- */}

      <section className="cta-section">
        <h2>
          Code is Future.
          <br />
          You are the Builder.
        </h2>

        <Link
          to="/courses"
          className="cta-button"
          style={{ backgroundColor: "white", color: "#10162F" }}
        >
          Explore All Courses
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
