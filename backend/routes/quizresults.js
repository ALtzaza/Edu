import express from "express";
import { Quiz, QuizResult, Lesson } from "../models/schema.models.js";
import { authenticateJWT, isEnrolled } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();


//ดูผลสอบ ของตัวเอง ในบทเรียนนั้นๆ (สำหรับนักเรียน)
//  (แก้ไข) เปลี่ยนจาก /:lessonNum เป็น /:lessonId
router.get("/:lessonId/results/me", authenticateJWT, isEnrolled, async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonId } = req.params; 

    const quizResults = await QuizResult.find({
      user: userId,
      lesson: lessonId,
    })
    .populate("lesson", "title lessonNumber")
    // 🟢 เพิ่มการจัดเรียงตามเวลาที่ส่งคำตอบจากใหม่ไปเก่า
    .sort({ submittedAt: -1 }); 
    
    res.status(200).send(quizResults);
  } catch (error) {
    // ... [Error Handling เดิม] ...
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Lesson ID format" });
    }
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});
//ดูประวัติการทำแบบทดสอบทั้งหมด ของตัวเอง (สำหรับนักเรียน)
// (Route นี้ไม่จำเป็นต้องแก้)
router.get("/me", authenticateJWT, isEnrolled, async (req, res) => {
  try {
    const userId = req.user._id;
    const quizResults = await QuizResult.find({ user: userId })
    .populate("lesson", "title lessonNumber")
    res.status(200).send(quizResults);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// ดูผลสอบ ของนักเรียนทุกคน ในบทเรียนนั้น (สำหรับครู/Admin)
//  (แก้ไข) เปลี่ยนจาก /:lessonNum เป็น /:lessonId
router.get("/:lessonId/results", authenticateJWT, isAdmin, async (req, res) => {
  try {
    //  (แก้ไข) รับ lessonId
    const { lessonId } = req.params; //  (แก้ไข) ไม่ต้องค้นหา Lesson ก่อน, ใช้ lessonId ได้เลย

    const quizResults = await QuizResult.find({ lesson: lessonId }).populate(
      "user",
      "name email"
    );
    res.status(200).send(quizResults);
  } catch (error) {
    //  (เพิ่ม) เพิ่มการดักจับ Error
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Lesson ID format" });
    }
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

//ดูผลสอบทั้งหมด ของนักเรียนคนเดียว (สำหรับครู/Admin)
// (Route นี้ไม่จำเป็นต้องแก้)
router.get("/:userId/results", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const quizResults = await QuizResult.find({ user: userId }).populate(
      "lesson",
      "title lessonNumber"
    );
    res.status(200).send(quizResults);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

export default router;
