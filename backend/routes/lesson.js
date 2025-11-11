// ในไฟล์ routes/lessonRouter.js
import { Router } from "express";
import { Lesson, Section, Course } from "../models/schema.models.js";
import { mockAdmin } from "../middleware/mockAuth.js";
import mongoose from "mongoose";

import { authenticateJWT, isEnrolled } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { title, videoUrl, content, sectionId, type } = req.body; // 🟢 รับ type เข้ามา
    if (!title || !sectionId) {
      return res
        .status(400)
        .json({ success: false, message: "กรุณาส่ง title และ sectionId" });
    }
    const parentSection = await Section.findById(sectionId);
    if (!parentSection) {
      return res.status(404).json({ success: false, message: "ไม่พบ Section" });
    } //  (เพิ่ม) Logic ใหม่: นับจำนวน Lesson ที่มีอยู่แล้วใน "คอร์ส" นี้ // เราใช้ 'parentSection.course' (ID ของคอร์ส) ในการนับ

    const existingLessonCount = await Lesson.countDocuments({
      section: sectionId,
    });
    const nextLessonNumber = existingLessonCount + 1; // 0+1=1, 1+1=2, ...
    const nextOrder = nextLessonNumber;

    const newLesson = new Lesson({
      title,
      videoUrl,
      content,
      section: sectionId,
      course: parentSection.course,
      lessonNumber: nextLessonNumber, //  (เพิ่ม) ใส่เลขที่นับได้ตรงนี้
      order: nextOrder,
      type: type || "content", // 🟢 ตั้งค่า type, default เป็น content
    });
    await newLesson.save(); // (สำคัญ) ต้อง push _id เข้า Array ของ Section ด้วย
    parentSection.lessons.push(newLesson._id);
    await parentSection.save();
    res.status(201).json({
      success: true,
      message: "สร้าง Lesson ใหม่สำเร็จ",
      data: newLesson,
    });
  } catch (err) {
    //  (เพิ่ม) ดักจับ Error E11000 โดยเฉพาะ
    if (err.code === 11000) {
      // ส่ง Error นี้กลับไปแทน ถ้ามีปัญหาเรื่อง unique index
      return res.status(409).json({
        success: false,
        message: "Duplicate key error. อาจจะเกิดจาก lessonNumber ซ้ำ",
        errorDetail: err.message,
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:lessonId", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, videoUrl, content, type } = req.body; // 🟢 รับ type เข้ามา
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { title, videoUrl, content, type }, // 🟢 อัปเดต type
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

router.delete("/:lessonId", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "ไม่พบ Lesson" });
    }
    await Section.findByIdAndUpdate(lesson.section, {
      $pull: { lessons: lessonId },
    });
    //  (แนะนำ) ควรลบ Quiz และ QuizResult ที่เกี่ยวข้องด้วย
    // await Quiz.deleteMany({ lesson: lessonId });
    // await QuizResult.deleteMany({ lesson: lessonId });

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
