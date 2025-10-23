// ในไฟล์ routes/lessonRouter.js
import { Router } from "express";
import { Lesson, Section } from "../models/schema.models.js"; 
// ⭐️ 1. Import ตัวปลอม
import { mockAdmin } from "../middleware/mockAuth.js";
// import { verifyToken } from "../middleware/verifyToken.js";
// import { isAdmin } from "../middleware/isAdmin.js"; 

const router = Router();


router.post("/", mockAdmin, async (req, res) => {

  try {
    const { title, videoUrl, content, sectionId } = req.body;
    if (!title || !sectionId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง title และ sectionId" });
    }
    const parentSection = await Section.findById(sectionId);
    if (!parentSection) {
      return res.status(404).json({ success: false, message: "ไม่พบ Section" });
    }
    const newLesson = new Lesson({
      title,
      videoUrl,
      content,
      section: sectionId,
      course: parentSection.course
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
        res.json({ success: true, message: "อัปเดต Lesson สำเร็จ", data: updatedLesson });
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
            $pull: { lessons: lessonId }
        });
        await Lesson.findByIdAndDelete(lessonId);
        res.json({ success: true, message: "ลบ Lesson สำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


router.get("/:lessonId", async (req, res) => {

  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId)
      .populate('quiz'); 
    if (!lesson) {
        return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
    }
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;