// src/pages/Admin/ManageContentPage.jsx (V3 - Debug)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/api'; 
import './ManageContentPage.css'; 
import '../ManageCoursesPage/ManageCoursesPage.css'; 

import Accordion from 'react-bootstrap/Accordion';
import { ThemeProvider } from 'react-bootstrap';
import { PencilSquare, TrashFill, PlusCircleFill, ArrowLeft, EyeFill } from 'react-bootstrap-icons';

// ⭐️ (Form "แก้ไข/สร้าง" (V3 - Debug))
const ContentForm = ({ courseId, sectionId, lessonToEdit, onUpdateSuccess }) => {
  const [formType, setFormType] = useState('lesson');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [lessonType, setLessonType] = useState('content'); // 🟢 ใหม่: quiz, workshop, content
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lessonToEdit) {
      setFormType('lesson');
      setTitle(lessonToEdit.title);
      setVideoUrl(lessonToEdit.videoUrl || '');
      setContent(lessonToEdit.content || '');
      setLessonType(lessonToEdit.type || 'content'); // 🟢 ดึง type ปัจจุบัน
      console.log("--- DEBUG (ContentForm): โหมด 'แก้ไข' Lesson", lessonToEdit._id);
    } 
    else if (sectionId) {
      setFormType('lesson');
      setTitle('');
      setVideoUrl('');
      setContent('');
      setLessonType('content'); // 🟢 ตั้งค่าเริ่มต้น
      console.log("--- DEBUG (ContentForm): โหมด 'สร้าง' Lesson (ใน Section:", sectionId, ")");
    } 
    else {
      setFormType('section');
      setTitle('');
      console.log("--- DEBUG (ContentForm): โหมด 'สร้าง' Section");
    }
  }, [sectionId, lessonToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let res;
      if (formType === 'section') {
        console.log("--- DEBUG (ContentForm): 1. ยิง API 'POST /sections' (สร้าง Section)...");
        res = await api.post('/sections', { title, courseId });
      } 
      else if (formType === 'lesson') {
        if (lessonToEdit) {
          console.log("--- DEBUG (ContentForm): 1. ยิง API 'PUT /lessons/:id' (แก้ไข Lesson)...");
          res = await api.put(`/lessons/${lessonToEdit._id}`, { title, videoUrl, content, type: lessonType }); // 🟢 เพิ่ม type
        } else {
          console.log("--- DEBUG (ContentForm): 1. ยิง API 'POST /lessons' (สร้าง Lesson)...");
          res = await api.post('/lessons', { title, videoUrl, content, sectionId, type: lessonType }); // 🟢 เพิ่ม type
        }
      }
      
      console.log("--- DEBUG (ContentForm): 2. (สำเร็จ) Response:", res.data.message);
      onUpdateSuccess(); 

    } catch (err) {
      console.error("--- DEBUG (ContentForm): 2. (พัง) Error:", err.response?.status, err.response?.data?.message);
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <h2>
        {formType === 'section' ? "สร้าง บท (Section) ใหม่" : 
         lessonToEdit ? `แก้ไข บทเรียน: ${lessonToEdit.title}` : 
         "สร้าง บทเรียน (Lesson) ใหม่"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="content-title">Title</label>
          <input type="text" id="content-title" className="admin-form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        
        {formType === 'lesson' && (
          <>
            {/* 🟢 ใหม่: เลือก Lesson Type */}
            <div className="admin-form-group">
              <label htmlFor="lesson-type">ประเภทบทเรียน (Lesson Type)</label>
              <select 
                id="lesson-type" 
                className="admin-form-input" 
                value={lessonType} 
                onChange={(e) => setLessonType(e.target.value)}
              >
                <option value="content">📝 Content (วิดีโอ + เนื้อหา)</option>
                <option value="quiz">❓ Quiz (แบบทดสอบ)</option>
                <option value="workshop">🛠️ Workshop (การปฏิบัติการ)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="content-videoUrl">Video URL (YouTube)</label>
              <input type="text" id="content-videoUrl" className="admin-form-input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label htmlFor="content-content">Content (Description)</label>
              <textarea id="content-content" className="admin-form-textarea" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
          </>
        )}
        
        <button type="submit" className="admin-submit-button" disabled={loading}>
          {loading ? "Loading..." : "บันทึก (Save)"}
        </button>
        {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      </form>
    </div>
  );
};


// ⭐️ (Component หลัก (V3 - Debug))
const ManageContentPage = () => {
  const { courseId } = useParams(); 
  const navigate = useNavigate();

  const [course, setCourse] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingView, setEditingView] = useState({
    type: 'add_section', 
    sectionId: null,     
    lesson: null         
  });
  
  const fetchCourseContent = useCallback(async () => {
    try {
      console.log("--- DEBUG (ManageContent): 1. (fetch) กำลังยิง API: GET /courses/:id", courseId);
      setLoading(true);
      setError(null);
      const courseRes = await api.get(`/courses/${courseId}`);
      console.log("--- DEBUG (ManageContent): 2. (fetch) ได้ข้อมูล Course:", courseRes.data.data.title);
      setCourse(courseRes.data.data);
    } catch (err) {
      console.error("--- DEBUG (ManageContent): 2. (fetch) Error:", err.response?.status, err.response?.data?.message);
      setError("ไม่พบคอร์ส หรือเกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [courseId]); 

  useEffect(() => {
    fetchCourseContent();
  }, [courseId, fetchCourseContent]); 
  
  
  const handleDelete = async (type, id) => {
    const confirmDelete = window.confirm(`คุณแน่ใจนะ ว่าจะลบ ${type} นี้?`);
    if (!confirmDelete) return;

    try {
      console.log(`--- DEBUG (ManageContent): (delete) กำลังยิง API: DELETE /${type}s/${id}`);
      if (type === 'lesson') {
        await api.delete(`/lessons/${id}`); 
      } else if (type === 'section') {
        await api.delete(`/sections/${id}`); 
      }
      alert("ลบสำเร็จ!");
      fetchCourseContent(); 
    } catch (err) {
      console.error(`--- DEBUG (ManageContent): (delete) Error:`, err.response?.status, err.response?.data?.message);
      alert("Error: " + err.response?.data?.message);
    }
  };

  if (loading && !course) return <div>Loading Course Content...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!course) return <div>ไม่พบคอร์ส</div>;

  return (
    <div className="content-page-container">
      
      {/* -------------------- 1. (Syllabus - สารบัญ (ซ้าย)) -------------------- */}
      <aside className="syllabus-container">
        <h1>Manage Content</h1>
        <p className="course-title">คอร์ส: {course.title}</p>
        
        <button 
          className="add-section-btn"
          onClick={() => setEditingView({ type: 'add_section', sectionId: null, lesson: null })}
        >
          <PlusCircleFill /> สร้างบท (Section) ใหม่
        </button>

        <ThemeProvider data-bs-theme="dark">
          <Accordion 
            defaultActiveKey={(course.sections && course.sections.length > 0) ? course.sections[0]._id : '0'} 
            alwaysOpen 
            className="syllabus-accordion"
          >
            {(course.sections || []).map((section) => (
              <Accordion.Item eventKey={section._id} key={section._id}>
                
                {/* ⭐️ (แก้ไข) 1. "หุ้ม" (Wrap) Header ⭐️ */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                
                  {/* (Header ของ "บท") */}
                  <Accordion.Header 
                    as="div" 
                    style={{ flex: 1 }} 
                  >
                    {section.title}
                  </Accordion.Header>

                  {/* ⭐️ (แก้ไข) 2. "ย้าย" (Move) ปุ่ม "ลบ" ⭐️ */}
                  <button 
                    className="icon-btn" 
                    style={{ 
                      marginLeft: 'auto', 
                      color: '#F44747',
                      padding: '1rem' 
                    }}
                    onClick={() => handleDelete('section', section._id)}
                  >
                    <TrashFill />
                  </button>
                </div>

                {/* (Body (ไส้ใน) ของ "บท") */}
                <Accordion.Body>
                  {/* (Loop "บทเรียนย่อย") */}
                  {(section.lessons || []).map(lesson => (
                    <div 
                      className={`syllabus-lesson ${editingView.lesson?._id === lesson._id ? 'active' : ''}`}
                      key={lesson._id}
                      onClick={() => setEditingView({ type: 'edit_lesson', sectionId: section._id, lesson: lesson })}
                    >
                      <span>{lesson.title}</span>
                      <div className="lesson-actions">
                        <Link to={`/lessons/${courseId}/${lesson._id}`} target="_blank">
                          <button className="icon-btn"><EyeFill /></button>
                        </Link>
                        <button 
                          className="icon-btn" 
                          style={{ color: '#F44747' }}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleDelete('lesson', lesson._id);
                          }}
                        >
                          <TrashFill />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* (ปุ่ม "สร้าง Lesson") */}
                  <button 
                    className="add-section-btn" 
                    style={{ backgroundColor: '#2a3661', marginTop: '1rem', fontSize: '0.9rem' }}
                    onClick={() => setEditingView({ type: 'add_lesson', sectionId: section._id, lesson: null })}
                  >
                    + เพิ่มบทเรียน (Lesson)
                  </button>
                  
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </ThemeProvider>

      </aside>
      
      {/* -------------------- 2. (Editor - ตัวแก้ไข (ขวา)) -------------------- */}
      <main className="editor-container">
        
        {(!editingView.sectionId && !editingView.lesson && editingView.type !== 'add_section') && (
          <div className="editor-placeholder">
            <ArrowLeft className="icon" />
            <span>
              เลือกบทเรียน (Lesson) เพื่อแก้ไข
              <br/>
              หรือ "สร้างบท (Section) ใหม่"
            </span>
          </div>
        )}
        
        {/* (แสดง Form "สร้าง/แก้ไข") */}
        <ContentForm 
          key={editingView.lesson?._id || editingView.sectionId || 'add_section'} 
          courseId={courseId}
          sectionId={editingView.sectionId}
          lessonToEdit={editingView.lesson}
          onUpdateSuccess={() => {
            fetchCourseContent(); 
            setEditingView({ type: 'placeholder', sectionId: null, lesson: null }); 
          }}
        />
        
      </main>
    </div>
  );
};

export default ManageContentPage;