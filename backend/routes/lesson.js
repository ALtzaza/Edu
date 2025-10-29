// ในไฟล์ routes/lessonRouter.js
import { Router } from "express";
import { Lesson, Section } from "../models/schema.models.js";
import { mockAdmin } from "../middleware/mockAuth.js";

const router = Router();

router.post("/", mockAdmin, async (req, res) => {
  try {
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

    //  (เพิ่ม) Logic ใหม่: นับจำนวน Lesson ที่มีอยู่แล้วใน "คอร์ส" นี้
    // เราใช้ 'parentSection.course' (ID ของคอร์ส) ในการนับ
    const existingLessonCount = await Lesson.countDocuments({
      course: parentSection.course,
    });
    const nextLessonNumber = existingLessonCount + 1; // 0+1=1, 1+1=2, ...

    const newLesson = new Lesson({
      title,
      videoUrl,
      content,
      section: sectionId,
      course: parentSection.course,
      lessonNumber: nextLessonNumber, //  (เพิ่ม) ใส่เลขที่นับได้ตรงนี้
    });
    await newLesson.save();
    // (สำคัญ) ต้อง push _id เข้า Array ของ Section ด้วย
    parentSection.lessons.push(newLesson._id);
    await parentSection.save();
    res.status(201).json({
      success: true,
      message: "สร้าง Lesson ใหม่สำเร็จ",
      data: newLesson,
    });
  } catch (err) {
    //  (เพิ่ม) ดักจับ Error E11000 โดยเฉพาะ
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

router.put("/:lessonId", mockAdmin, async (req, res) => {
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

router.delete("/:lessonId", mockAdmin, async (req, res) => {
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

router.get("/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId).populate("quizzes"); // ⬅️ (แก้ไข) ต้องเติม 's' ให้ตรง Schema
    if (!lesson) {
      return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
    }
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
