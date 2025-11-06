// ในไฟล์ routes/progressRouter.js

import { Router } from "express";
import { Progress, Lesson, Course } from "../models/schema.models.js";
// ⭐️ 1. Import "ตัวปลอม" ของ User
import { mockUser } from "../middleware/mockAuth.js";
import { authenticateJWT , isEnrolled} from "../middleware/authMiddleware.js";

const router = Router();

// --- API สำหรับ User (นักเรียน) ---

// 1. ⭐️ POST /api/progress/mark-complete ⭐️
// (นี่คือ API ที่ยิง "เมื่อเรียนจบบท")
router.post("/mark-complete", authenticateJWT, isEnrolled, async (req, res) => {
    try {
      const { lessonId } = req.body;
      const userId = req.user.id;
  
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
          return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
      }
      const courseId = lesson.course;
      
      // ⭐️ 1. (แก้ไข) ⭐️
      // "ย้าย" Logic การนับ TotalLessons 
      // (จากใน 'if (!progress)') ให้ออกมาอยู่ "ข้างนอก"
      // เพื่อให้มัน "นับใหม่ทุกครั้ง" ที่ยิง API นี้
      const parentCourse = await Course.findById(courseId).populate('sections');
      let totalLessons = 0;
      if (parentCourse && parentCourse.sections) {
          parentCourse.sections.forEach(section => {
              if (section.lessons) {
                  totalLessons += section.lessons.length;
              }
          });
      }
      const safeTotalLessons = totalLessons > 0 ? totalLessons : 1; // (กันหารด้วย 0)
  
      // 4. "Find or Create" Progress
      let progress = await Progress.findOne({ user: userId, course: courseId });
      
      if (!progress) {
        progress = new Progress({
          user: userId,
          course: courseId,
          lessonsCompleted: [],
          totalLessons: safeTotalLessons // ⬅️ (ใช้เลขที่เพิ่งนับ)
        });
      } else {
        // ⭐️ 2. (แก้ไข) ⭐️
        // ถ้า Progress "มีอยู่แล้ว" ให้อัปเดต 'totalLessons' เป็นเลขใหม่
        progress.totalLessons = safeTotalLessons;
      }
  
      // 5. เพิ่ม ID บทเรียนลงใน Array
      await progress.updateOne({ $addToSet: { lessonsCompleted: lessonId } });
  
      // 6. ดึงข้อมูล Progress ล่าสุด (ตอนนี้จะ Find เจอแล้ว)
      progress = await Progress.findById(progress._id); 
      
      // 7. คำนวณ % ใหม่ (ด้วย 'totalLessons' ที่อัปเดตแล้ว)
      const completedCount = progress.lessonsCompleted.length;
      progress.percentage = (completedCount / progress.totalLessons) * 100;
      if (progress.percentage > 100) progress.percentage = 100;
  
      progress.lastWatched = lessonId;
      await progress.save(); // ⬅️ บันทึก % ใหม่ และ totalLessons ใหม่
      
      res.json({ success: true, message: "อัปเดต Progress สำเร็จ", data: progress });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });


// 2. GET /api/progress/:courseId (ดึง Progress ของคอร์สนี้)
// (โค้ดส่วนนี้ถูกต้องอยู่แล้ว)
router.get("/:courseId", authenticateJWT, isEnrolled, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const progress = await Progress.findOne({ user: userId, course: courseId })
            .populate('lessonsCompleted', 'title');

        if (!progress) {
            // (ถ้าไม่เคยเรียนเลย ก็ส่งค่า 0 กลับไป)
            return res.json({ 
                success: true, 
                data: { percentage: 0, lessonsCompleted: [] } 
            });
        }
        
        res.json({ success: true, data: progress });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;