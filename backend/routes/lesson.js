// routes/lessons.js (V16 - แก้บั๊ก Duplicate Key)

import { Router } from "express";
import { Lesson, Section, Course } from "../models/schema.models.js"; 
import { authenticateJWT, isEnrolled } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

// --- 1. ⭐️ (แก้ไข) POST / (สร้าง) (V16) ⭐️ ---
router.post("/", authenticateJWT, isAdmin, async (req, res) => {
  try {
    console.log("--- DEBUG (lessons.js V16): 'POST /' (Create) ---"); // (Debug V16)
    const { title, videoUrl, content, sectionId } = req.body;
    if (!title || !sectionId) {
      return res
        .status(400)
        .json({ success: false, message: "กรุณาส่ง title และ sectionId" });
    }
    const parentSection = await Section.findById(sectionId);
    if (!parentSection) {
      return res.status(404).json({ success: false, message: "ไม่พบ Section" });
    }

    // ⭐️ (แก้ไข Logic) ⭐️
    const lastLesson = await Lesson.findOne({
      course: parentSection.course, 
    })
      .sort({ lessonNumber: -1 }); 
    
    const nextLessonNumber = lastLesson ? lastLesson.lessonNumber + 1 : 1;
    console.log("--- DEBUG (lessons.js V16): nextLessonNumber =", nextLessonNumber); // (Debug V16)

    const newLesson = new Lesson({
      title, videoUrl, content, section: sectionId,
      course: parentSection.course,
      lessonNumber: nextLessonNumber, 
    });
    
    await newLesson.save();
    parentSection.lessons.push(newLesson._id);
    await parentSection.save();
    
    res.status(201).json({
      success: true,
      message: "สร้าง Lesson ใหม่สำเร็จ",
      data: newLesson,
    });

  } catch (err) {
    if (err.code === 11000) {
      console.error("--- DEBUG (lessons.js V16): E11000 Error ---", err.keyValue); // (Debug V16)
      return res.status(409).json({
        success: false,
        message: "Duplicate key error. อาจจะเกิดจาก lessonNumber ซ้ำ",
        errorDetail: err.message,
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- 2. PUT /:lessonId (แก้ไข) (V1.2) ---
router.put("/:lessonId", authenticateJWT, isAdmin, async (req, res) => {
  console.log("--- DEBUG (lessons.js V16): 'PUT /:id' (Update) ---"); // (Debug V16)
  try {
    const { lessonId } = req.params;
    const { title, videoUrl, content } = req.body;
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { title, videoUrl, content },
      { new: true }
    );
    if (!updatedLesson) {
      return res.status(404).json({ success: false, message: "ไม่พบ Lesson" });
    }
    res.json({
      success: true,
      message: "อัปเดต Lesson สำเร็จ",
      data: updatedLesson,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- 3. DELETE /:lessonId (ลบ) (V1.2) ---
router.delete("/:lessonId", authenticateJWT, isAdmin, async (req, res) => {
  console.log("--- DEBUG (lessons.js V16): 'DELETE /:id' (Delete) ---"); // (Debug V16)
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "ไม่พบ Lesson" });
    }
    await Section.findByIdAndUpdate(lesson.section, {
      $pull: { lessons: lessonId },
    });
    await Lesson.findByIdAndDelete(lessonId);
    res.json({ success: true, message: "ลบ Lesson สำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- 4. GET /:lessonId (ดู) (V1.2) ---
router.get("/:lessonId", authenticateJWT, isEnrolled, async (req, res) => {
  console.log("--- DEBUG (lessons.js V16): 'GET /:id' (View) ---"); // (Debug V16)
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId).populate("quizzes"); 
    if (!lesson) {
      return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
    }
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;