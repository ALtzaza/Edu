// routes/lessons.js (V16 - แก้บั๊ก Duplicate Key)

import { Router } from "express";
import mongoose from "mongoose";
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

    const existingLessonCount = await Lesson.countDocuments({
      section: sectionId,
    });
    const nextLessonNumber = existingLessonCount + 1; // 0+1=1, 1+1=2, ...
    const nextOrder = nextLessonNumber;

    const newLesson = new Lesson({
      title, videoUrl, content, section: sectionId,
      course: parentSection.course,
      lessonNumber: nextLessonNumber, //  (เพิ่ม) ใส่เลขที่นับได้ตรงนี้
      order: nextOrder,
      type: type || "content", // 🟢 ตั้งค่า type, default เป็น content
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


router.get("/:lessonId",authenticateJWT,isEnrolled, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    
    console.log("--- DEBUG GET lesson: lessonId =", lessonId, "userId =", userId);
    
    // 💡 (เพิ่ม) ตรวจสอบว่า lessonId เป็น ObjectId ที่ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        console.error("--- ERROR: Invalid lesson ID format:", lessonId);
        return res.status(400).json({ success: false, message: "Lesson ID ไม่ถูกต้อง" });
    }

    // 💡 เราต้องการแค่ lesson object, ไม่จำเป็นต้อง populate quizzes ถ้ามันเป็น workshop
    const lesson = await Lesson.findById(lessonId); 
    
    console.log("--- DEBUG: Lesson found:", lesson ? "YES" : "NO");
    
    if (!lesson) {
      console.error("--- ERROR: Lesson not found for ID:", lessonId);
      return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
    }

    // 🟢 (เพิ่ม) ถ้าบทเรียนเป็น Quiz, ให้ Populate quizzes
    if (lesson.type === 'quiz') {
        console.log("--- DEBUG: Lesson is quiz type, populating quizzes");
        await lesson.populate('quizzes');
    }

    // 🟢 (เพิ่ม) ถ้าบทเรียนเป็น Quiz, ให้ Populate quizzes
    if (lesson.type === "quiz") {
      console.log("--- DEBUG: Lesson is quiz type (duplicate check), populating quizzes");
      await lesson.populate("quizzes");
    }

    console.log("--- DEBUG: Returning lesson successfully");
    res.json({ success: true, data: lesson });
  } catch (err) {
    console.error("--- ERROR in GET lesson:", err); // เพิ่ม log ที่นี่
    res
      .status(500)
      .json({
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงบทเรียน",
        error: err.message,
      });
    
  }

});export default router;
