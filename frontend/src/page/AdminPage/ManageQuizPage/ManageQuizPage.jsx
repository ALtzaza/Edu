// ManageQuizPage.jsx
import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import "./ManageQuizPage.css";

// --- QuizForm ---
const QuizForm = ({ onQuizUpdated, editingQuiz, setEditingQuiz, lessons }) => {
  const [lessonId, setLessonId] = useState("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingQuiz) {
      setLessonId(editingQuiz.lesson?._id || "");
      setQuestion(editingQuiz.question || "");
      setChoices(editingQuiz.choices || ["", "", "", ""]);
      setCorrectAnswer(editingQuiz.correctAnswer || "");
    } else {
      setLessonId("");
      setQuestion("");
      setChoices(["", "", "", ""]);
      setCorrectAnswer("");
    }
  }, [editingQuiz]);

  const handleChoiceChange = (index, value) => {
    const updated = [...choices];
    updated[index] = value;
    setChoices(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lessonId || !question || !correctAnswer) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (!choices.every((c) => c.trim())) {
      setError("กรุณาใส่ตัวเลือกให้ครบทุกช่อง");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let res;
      if (editingQuiz) {
        res = await api.put(`/quizzes/${editingQuiz._id}`, {
          question,
          choices,
          correctAnswer,
        });
        onQuizUpdated(res.data, "update");
      } else {
        res = await api.post(`/quizzes/${lessonId}/quizzes`, {
          question,
          choices,
          correctAnswer,
        });
        onQuizUpdated(res.data, "add");
      }
      setEditingQuiz(null);
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <h2>{editingQuiz ? "แก้ไข Quiz" : "สร้าง Quiz ใหม่"}</h2>
      <form className="admin-form-grid" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label>เลือกบทเรียน</label>
          <select
            className="border p-2 rounded w-full"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">-- เลือก Lesson --</option>
            {Array.isArray(lessons) &&
              lessons.map((lesson) => (
                <option key={lesson._id} value={lesson._id}>
                  {lesson.section?.course?.title
                    ? `${lesson.section.course.title} › ${lesson.section?.title || ""} › ${lesson.title}`
                    : lesson.title}
                </option>
              ))}
          </select>
        </div>

        <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
          <label>คำถาม</label>
          <input
            className="admin-form-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>ตัวเลือก</label>
          {choices.map((c, i) => (
            <input
              key={i}
              className="admin-form-input"
              placeholder={`ตัวเลือกที่ ${i + 1}`}
              value={c}
              onChange={(e) => handleChoiceChange(i, e.target.value)}
              style={{ marginBottom: "6px" }}
            />
          ))}
        </div>

        <div className="admin-form-group">
          <label>คำตอบที่ถูกต้อง</label>
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="admin-form-input"
          >
            <option value="">-- เลือกคำตอบที่ถูก --</option>
            {choices.map((c, i) => (
              <option key={i} value={c}>
                {c || `ตัวเลือกที่ ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div
          className="admin-form-group"
          style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem" }}
        >
          {editingQuiz && (
            <button
              type="button"
              className="admin-submit-button"
              style={{ backgroundColor: "#666" }}
              onClick={() => setEditingQuiz(null)}
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            className="admin-submit-button"
            disabled={loading}
          >
            {loading
              ? "กำลังบันทึก..."
              : editingQuiz
              ? "อัปเดต Quiz"
              : "สร้าง Quiz"}
          </button>
        </div>

        {error && <div style={{ color: "red" }}>{error}</div>}
      </form>
    </div>
  );
};

// --- ManageQuizPage ---
const ManageQuizPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("ทั้งหมด");
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [quizRes, courseRes, lessonRes] = await Promise.all([
          api.get("/quizzes"),
          api.get("/courses"),
          api.get("/lessons"),
        ]);

        // ✅ ปลอดภัยจาก response ที่ไม่ใช่ array
        setQuizzes(Array.isArray(quizRes.data) ? quizRes.data : []);
        setCourses(Array.isArray(courseRes.data) ? courseRes.data : courseRes.data?.data || []);
        setLessons(Array.isArray(lessonRes.data) ? lessonRes.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleQuizUpdated = (quiz, mode) => {
    if (mode === "add") setQuizzes([quiz, ...quizzes]);
    else setQuizzes(quizzes.map((q) => (q._id === quiz._id ? quiz : q)));
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าจะลบ Quiz นี้หรือไม่?")) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes(quizzes.filter((q) => q._id !== id));
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  const filteredQuizzes =
    selectedCourse === "ทั้งหมด"
      ? quizzes
      : (() => {
          // build a quick map from lessonId -> courseId using lessons array
          const lessonCourseMap = {};
          (Array.isArray(lessons) ? lessons : []).forEach((l) => {
            if (!l) return;
            // try to extract course id from lesson shapes
            const section = l.section;
            if (section && section.course) {
              lessonCourseMap[String(l._id)] = String(section.course._id ?? section.course);
            } else if (l.course) {
              lessonCourseMap[String(l._id)] = String(l.course._id ?? l.course);
            }
          });

          return quizzes.filter((q) => {
            if (!q?.lesson) return false;
            // lesson on quiz may be populated object or an id string
            const lessonRef = q.lesson;
            let lessonId = null;
            if (typeof lessonRef === 'string' || typeof lessonRef === 'number') {
              lessonId = String(lessonRef);
            } else {
              lessonId = String(lessonRef._id ?? lessonRef);
            }

            // try to get course id directly from populated quiz.lesson
            let courseId = null;
            try {
              courseId = lessonRef?.section?.course?._id ?? lessonRef?.section?.course ?? lessonRef?.course?._id ?? lessonRef?.course;
            } catch (e) {
              courseId = null;
            }
            if (courseId) courseId = String(courseId);

            // fallback to map
            if (!courseId && lessonId) {
              courseId = lessonCourseMap[lessonId];
            }

            return courseId === String(selectedCourse);
          });
        })();

  if (loading) return <div>กำลังโหลด...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>จัดการแบบทดสอบ (Quiz)</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label>แสดง Quiz ของคอร์ส: </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border p-2 rounded"
          style={{marginLeft: "8px"}}
        >
          <option value="ทั้งหมด">ทั้งหมด</option>
          {Array.isArray(courses) &&
            courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
        </select>
      </div>

      { /* only pass lessons that belong to selectedCourse so the lesson dropdown shows relevant lessons */ }
      <QuizForm
        onQuizUpdated={handleQuizUpdated}
        editingQuiz={editingQuiz}
        setEditingQuiz={setEditingQuiz}
        lessons={
          selectedCourse === "ทั้งหมด"
            ? lessons
            : (Array.isArray(lessons) ? lessons.filter(l => {
                  const courseId = l?.section?.course?._id ?? l?.section?.course ?? l?.course?._id ?? l?.course;
                  // exclude workshop lessons
                  if (l?.type === 'workshop') return false;
                  return String(courseId) === String(selectedCourse);
                }) : [])
        }
      />

      <h2 style={{ marginTop: "2rem" }}>
        รายการ Quiz ทั้งหมด ({filteredQuizzes.length})
      </h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>คำถาม</th>
              <th>คำตอบถูก</th>
              <th>Lesson</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizzes.map((quiz) => (
              <tr key={quiz._id}>
                <td>{quiz.question}</td>
                <td>{quiz.correctAnswer}</td>
                <td>{quiz.lesson?.title || "N/A"}</td>
                <td className="actions-cell">
                  <button
                    className="action-button edit-button"
                    onClick={() => setEditingQuiz(quiz)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="action-button delete-button"
                    onClick={() => handleDeleteQuiz(quiz._id)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageQuizPage;