import React, { useEffect, useMemo, useState } from "react";
import styles from "./AdminDashboard.module.css";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:3000";

const initialCourseForm = {
  title: "",
  description: "",
  categoryId: "",
  price: "",
  thumbnail: "",
};

const initialLessonForm = {
  title: "",
  type: "content",
  videoUrl: "",
  content: "",
};

const initialQuizForm = {
  question: "",
  choicesRaw: "",
  correctAnswer: "",
};

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseDetail, setCourseDetail] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [quizForm, setQuizForm] = useState(initialQuizForm);
  const [sectionTitle, setSectionTitle] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const authedHeaders = useMemo(() => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [courseRes, categoryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/courses`),
          fetch(`${API_BASE_URL}/api/categories`),
        ]);
        if (courseRes.ok) {
          const { data } = await courseRes.json();
          setCourses(data || []);
        }
        if (categoryRes.ok) {
          const { data } = await categoryRes.json();
          setCategories(data || []);
        }
      } catch (err) {
        console.error("Initial admin data load failed:", err);
        setStatusMessage("ไม่สามารถดึงข้อมูลเริ่มต้นได้");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- Workshops for admin review (pending) ---
  const [workshops, setWorkshops] = useState([]);

  const fetchWorkshopsForCourse = async (courseIdParam, lessonIdParam) => {
    if (!courseIdParam) return;
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set("status", "pending");
      if (lessonIdParam) qs.set("lessonId", lessonIdParam);
      const res = await fetch(
        `${API_BASE_URL}/api/courses/${courseIdParam}/workshops?${qs.toString()}`,
        { headers: authedHeaders }
      );
      if (!res.ok) throw new Error("Failed to fetch workshops");
      const data = await res.json();
      setWorkshops(Array.isArray(data) ? data : data || []);
    } catch (err) {
      console.error("Failed to load workshops:", err);
      setStatusMessage("ไม่สามารถดึงงาน Workshop ได้");
    } finally {
      setLoading(false);
    }
  };

  const refreshCourses = async () => {
    const res = await fetch(`${API_BASE_URL}/api/courses`);
    if (res.ok) {
      const { data } = await res.json();
      setCourses(data || []);
    }
  };

  const fetchCourseDetail = async (courseId) => {
    if (!courseId) {
      setCourseDetail(null);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch course detail");
      const { data } = await res.json();
      setCourseDetail(data);
      const firstSection = data.sections?.[0]?._id || "";
      setSelectedSectionId(firstSection);
      const firstLesson =
        data.sections?.find((sec) => sec._id === firstSection)?.lessons?.[0]
          ?._id || "";
      setSelectedLessonId(firstLesson);
    } catch (err) {
      console.error(err);
      setStatusMessage("ไม่สามารถดึงรายละเอียดคอร์สได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseDetail(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Fetch pending workshops when selected course or lesson changes
  useEffect(() => {
    if (selectedCourseId) {
      fetchWorkshopsForCourse(selectedCourseId, selectedLessonId);
    } else {
      setWorkshops([]);
    }
  }, [selectedCourseId, selectedLessonId]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.categoryId || undefined,
        thumbnail: courseForm.thumbnail || undefined,
        price: Number(courseForm.price) || 0,
      };
      const res = await fetch(`${API_BASE_URL}/api/courses`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create course");
      setCourseForm(initialCourseForm);
      setStatusMessage("สร้างคอร์สใหม่สำเร็จ");
      await refreshCourses();
    } catch (err) {
      console.error(err);
      setStatusMessage("สร้างคอร์สไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (course) => {
    const newTitle = prompt("ชื่อคอร์สใหม่", course.title);
    if (newTitle === null) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/courses/${course._id}`, {
        method: "PUT",
        headers: authedHeaders,
        body: JSON.stringify({
          title: newTitle,
          description: course.description,
          category: course.category?._id || course.category,
          price: course.price,
          thumbnail: course.thumbnail,
          difficulty: course.difficulty,
        }),
      });
      if (!res.ok) throw new Error("Failed to update course");
      setStatusMessage("อัปเดตคอร์สสำเร็จ");
      await refreshCourses();
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("อัปเดตคอร์สไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("ต้องการลบคอร์สนี้หรือไม่?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: "DELETE",
        headers: authedHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete course");
      setStatusMessage("ลบคอร์สสำเร็จ");
      if (selectedCourseId === courseId) {
        setSelectedCourseId("");
        setCourseDetail(null);
      }
      await refreshCourses();
    } catch (err) {
      console.error(err);
      setStatusMessage("ลบคอร์สไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setStatusMessage("กรุณาเลือกคอร์สก่อนสร้าง Section");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sections`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({ title: sectionTitle, courseId: selectedCourseId }),
      });
      if (!res.ok) throw new Error("Failed to create section");
      setSectionTitle("");
      setStatusMessage("สร้าง Section สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("สร้าง Section ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (section) => {
    const newTitle = prompt("ชื่อ Section ใหม่", section.title);
    if (newTitle === null) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sections/${section._id}`, {
        method: "PUT",
        headers: authedHeaders,
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error("Failed to update section");
      setStatusMessage("อัปเดต Section สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("อัปเดต Section ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("ต้องการลบ Section นี้หรือไม่? (บทเรียนทั้งหมดจะถูกลบด้วย)"))
      return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sections/${sectionId}`, {
        method: "DELETE",
        headers: authedHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete section");
      setStatusMessage("ลบ Section สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("ลบ Section ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!selectedSectionId) {
      setStatusMessage("กรุณาเลือก Section ก่อนสร้าง Lesson");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lessons`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({
          ...lessonForm,
          sectionId: selectedSectionId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create lesson");
      setLessonForm(initialLessonForm);
      setStatusMessage("สร้าง Lesson สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("สร้าง Lesson ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLesson = async (lesson) => {
    const newTitle = prompt("ชื่อบทเรียนใหม่", lesson.title);
    if (newTitle === null) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lessons/${lesson._id}`, {
        method: "PUT",
        headers: authedHeaders,
        body: JSON.stringify({
          title: newTitle,
          videoUrl: lesson.videoUrl,
          content: lesson.content,
          type: lesson.type,
        }),
      });
      if (!res.ok) throw new Error("Failed to update lesson");
      setStatusMessage("อัปเดต Lesson สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("อัปเดต Lesson ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("ต้องการลบบทเรียนนี้หรือไม่?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
        method: "DELETE",
        headers: authedHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete lesson");
      setStatusMessage("ลบ Lesson สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("ลบ Lesson ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedLessonId) {
      setStatusMessage("กรุณาเลือกบทเรียนก่อนสร้าง Quiz");
      return;
    }
    const choices = quizForm.choicesRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (choices.length < 2) {
      setStatusMessage("กรุณากรอกตัวเลือกอย่างน้อย 2 ข้อ");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/lessons/${selectedLessonId}/quizzes`,
        {
          method: "POST",
          headers: authedHeaders,
          body: JSON.stringify({
            question: quizForm.question,
            choices,
            correctAnswer: quizForm.correctAnswer,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to create quiz");
      setQuizForm(initialQuizForm);
      setStatusMessage("สร้าง Quiz สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("สร้าง Quiz ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuiz = async (quiz) => {
    const newQuestion = prompt("คำถามใหม่", quiz.question);
    if (newQuestion === null) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/quizzes/${quiz._id}`, {
        method: "PUT",
        headers: authedHeaders,
        body: JSON.stringify({
          question: newQuestion,
          choices: quiz.choices,
          correctAnswer: quiz.correctAnswer,
        }),
      });
      if (!res.ok) throw new Error("Failed to update quiz");
      setStatusMessage("อัปเดต Quiz สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("อัปเดต Quiz ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("ต้องการลบ Quiz นี้หรือไม่?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: authedHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete quiz");
      setStatusMessage("ลบ Quiz สำเร็จ");
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("ลบ Quiz ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // --- Workshop review handlers ---
  const handleReviewWorkshop = async (workshopId, status) => {
    if (!window.confirm(`ต้องการตั้งสถานะ '${status}' สำหรับงานนี้หรือไม่?`)) return;
    try {
      setLoading(true);
      const feedback =
        status === "rejected"
          ? prompt("กรุณาระบุ feedback/เหตุผลการปฏิเสธ") || "Rejected"
          : "Approved by admin";
      const res = await fetch(`${API_BASE_URL}/api/workshops/${workshopId}/review`, {
        method: "PUT",
        headers: {
          ...authedHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback, status }),
      });
      if (!res.ok) throw new Error("Failed to update workshop status");
      setStatusMessage(`อัปเดตสถานะงานเป็น ${status} สำเร็จ`);
      // รีเฟรชข้อมูลทั้ง workshop list และรายละเอียดคอร์ส
      await fetchWorkshopsForCourse(selectedCourseId, selectedLessonId);
      await fetchCourseDetail(selectedCourseId);
    } catch (err) {
      console.error(err);
      setStatusMessage("อัปเดตสถานะงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const selectedSection = courseDetail?.sections?.find(
    (sec) => sec._id === selectedSectionId
  );
  const selectedLesson = selectedSection?.lessons?.find(
    (lesson) => lesson._id === selectedLessonId
  );

  if (!user || user.role !== "admin") {
    return (
      <div className={styles.unauthorized}>
        <h2>จำกัดสิทธิ์การเข้าถึง</h2>
        <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      {loading && <div className={styles.loading}>กำลังประมวลผล...</div>}
      {!!statusMessage && (
        <div className={styles.statusMessage}>{statusMessage}</div>
      )}

      <section className={styles.card}>
        <h2>จัดการคอร์ส</h2>
        <form className={styles.formGrid} onSubmit={handleCreateCourse}>
          <input
            type="text"
            placeholder="ชื่อคอร์ส"
            value={courseForm.title}
            onChange={(e) =>
              setCourseForm((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="คำอธิบาย"
            value={courseForm.description}
            onChange={(e) =>
              setCourseForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
          <select
            value={courseForm.categoryId}
            onChange={(e) =>
              setCourseForm((prev) => ({ ...prev, categoryId: e.target.value }))
            }
          >
            <option value="">เลือกหมวดหมู่ (ไม่บังคับ)</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="ราคา"
            value={courseForm.price}
            onChange={(e) =>
              setCourseForm((prev) => ({ ...prev, price: e.target.value }))
            }
            min="0"
          />
          <input
            type="text"
            placeholder="Thumbnail URL"
            value={courseForm.thumbnail}
            onChange={(e) =>
              setCourseForm((prev) => ({ ...prev, thumbnail: e.target.value }))
            }
          />
          <button type="submit">สร้างคอร์สใหม่</button>
        </form>

        <div className={styles.list}>
          {courses.map((course) => (
            <div
              key={course._id}
              className={`${styles.listItem} ${
                course._id === selectedCourseId ? styles.active : ""
              }`}
              onClick={() => setSelectedCourseId(course._id)}
            >
              <div>
                <strong>{course.title}</strong>
                <div className={styles.meta}>
                  หมวดหมู่: {course.category?.name || "ไม่ระบุ"} | ราคา:{" "}
                  {course.price} บาท
                </div>
              </div>
              <div className={styles.actions}>
                <button onClick={() => handleUpdateCourse(course)}>แก้ไข</button>
                <button onClick={() => handleDeleteCourse(course._id)}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {courseDetail && (
        <>
          <section className={styles.card}>
            <h2>Section ในคอร์ส {courseDetail.title}</h2>
            <form className={styles.inlineForm} onSubmit={handleCreateSection}>
              <input
                type="text"
                placeholder="ชื่อ Section ใหม่"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                required
              />
              <button type="submit">เพิ่ม Section</button>
            </form>
            <div className={styles.list}>
              {courseDetail.sections?.map((section) => (
                <div
                  key={section._id}
                  className={`${styles.listItem} ${
                    section._id === selectedSectionId ? styles.active : ""
                  }`}
                  onClick={() => {
                    setSelectedSectionId(section._id);
                    const firstLesson = section.lessons?.[0]?._id || "";
                    setSelectedLessonId(firstLesson);
                  }}
                >
                  <div>
                    <strong>{section.title}</strong>
                    <div className={styles.meta}>
                      {section.lessons?.length || 0} บทเรียน
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button onClick={() => handleUpdateSection(section)}>
                      แก้ไข
                    </button>
                    <button onClick={() => handleDeleteSection(section._id)}>
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {selectedSection && (
            <section className={styles.card}>
              <h2>บทเรียนใน Section: {selectedSection.title}</h2>
              <form className={styles.formGrid} onSubmit={handleCreateLesson}>
                <input
                  type="text"
                  placeholder="ชื่อบทเรียน"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <select
                  value={lessonForm.type}
                  onChange={(e) =>
                    setLessonForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="content">เนื้อหา (Content)</option>
                  <option value="quiz">แบบทดสอบ (Quiz)</option>
                  <option value="workshop">Workshop</option>
                </select>
                <input
                  type="text"
                  placeholder="Video URL"
                  value={lessonForm.videoUrl}
                  onChange={(e) =>
                    setLessonForm((prev) => ({
                      ...prev,
                      videoUrl: e.target.value,
                    }))
                  }
                />
                <textarea
                  placeholder="เนื้อหา (HTML)"
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={3}
                />
                <button type="submit">เพิ่มบทเรียน</button>
              </form>

              <div className={styles.list}>
                {selectedSection.lessons?.map((lesson) => (
                  <div
                    key={lesson._id}
                    className={`${styles.listItem} ${
                      lesson._id === selectedLessonId ? styles.active : ""
                    }`}
                    onClick={() => setSelectedLessonId(lesson._id)}
                  >
                    <div>
                      <strong>{lesson.title}</strong>
                      <div className={styles.meta}>
                        ประเภท: {lesson.type || "content"} | Quiz:{" "}
                        {lesson.quizzes?.length || 0}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <button onClick={() => handleUpdateLesson(lesson)}>
                        แก้ไข
                      </button>
                      <button onClick={() => handleDeleteLesson(lesson._id)}>
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {selectedLesson && (
            <section className={styles.card}>
              <h2>แบบทดสอบในบท: {selectedLesson.title}</h2>
              <form className={styles.formGrid} onSubmit={handleCreateQuiz}>
                <textarea
                  placeholder="คำถาม"
                  value={quizForm.question}
                  onChange={(e) =>
                    setQuizForm((prev) => ({ ...prev, question: e.target.value }))
                  }
                  required
                  rows={2}
                />
                <textarea
                  placeholder="ตัวเลือก (หนึ่งบรรทัดต่อหนึ่งตัวเลือก)"
                  value={quizForm.choicesRaw}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      choicesRaw: e.target.value,
                    }))
                  }
                  rows={3}
                />
                <input
                  type="text"
                  placeholder="คำตอบที่ถูกต้อง"
                  value={quizForm.correctAnswer}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      correctAnswer: e.target.value,
                    }))
                  }
                  required
                />
                <button type="submit">เพิ่ม Quiz</button>
              </form>

              <div className={styles.list}>
                {(selectedLesson.quizzes || []).map((quiz) => (
                  <div key={quiz._id} className={styles.listItem}>
                    <div>
                      <strong>{quiz.question}</strong>
                      <div className={styles.meta}>
                        ตัวเลือก: {(quiz.choices || []).join(", ")}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <button onClick={() => handleUpdateQuiz(quiz)}>
                        แก้ไข
                      </button>
                      <button onClick={() => handleDeleteQuiz(quiz._id)}>
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* --- Admin: Pending Workshops for selected course/lesson --- */}
          {selectedCourseId && (
            <section className={styles.card}>
              <h2>งาน Workshop (รอตรวจ)</h2>
              {workshops.length === 0 ? (
                <div>ไม่มีงานที่รอตรวจในขณะนี้</div>
              ) : (
                <div className={styles.list}>
                  {workshops.map((w) => (
                    <div key={w._id} className={styles.listItem}>
                      <div>
                        <strong>{w.user?.name || "ผู้ใช้"}</strong>
                        <div className={styles.meta}>
                          บทเรียน: {w.lesson?.title || w.lesson}
                          {w.fileUrl && (
                            <>
                              {' '}
                              | <a href={`http://localhost:3000/uploads/${w.fileUrl}`} target="_blank" rel="noreferrer">ดาวน์โหลดไฟล์</a>
                            </>
                          )}
                        </div>
                        <div className={styles.meta}>สถานะ: {w.status}</div>
                        {w.feedback && <div className={styles.meta}>ข้อเสนอแนะ: {w.feedback}</div>}
                      </div>
                      <div className={styles.actions}>
                        <button onClick={() => handleReviewWorkshop(w._id, 'approved')}>อนุมัติ</button>
                        <button onClick={() => handleReviewWorkshop(w._id, 'rejected')}>ปฎิเสธ</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

