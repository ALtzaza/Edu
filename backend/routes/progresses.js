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
      
      console.log("--- DEBUG mark-complete: lessonId =", lessonId, "userId =", userId);
  
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
          console.error("--- ERROR: Lesson not found for lessonId:", lessonId);
          return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
      }
      
      const courseId = lesson.course;
      if (!courseId) {
          console.error("--- ERROR: Lesson has no course field:", lesson);
          return res.status(400).json({ success: false, message: "บทเรียนไม่เชื่อมต่อกับคอร์สใดๆ" });
      }
      
      console.log("--- DEBUG: courseId from lesson =", courseId);
      
      // ⭐️ 1. (แก้ไข) ⭐️
      // "ย้าย" Logic การนับ TotalLessons 
      // (จากใน 'if (!progress)') ให้ออกมาอยู่ "ข้างนอก"
      // เพื่อให้มัน "นับใหม่ทุกครั้ง" ที่ยิง API นี้
      const parentCourse = await Course.findById(courseId).populate({
          path: 'sections',
          populate: {
              path: 'lessons'
          }
      });
      
      if (!parentCourse) {
          console.error("--- ERROR: Parent course not found for courseId:", courseId);
          return res.status(404).json({ success: false, message: "ไม่พบคอร์ส" });
      }
      
      let totalLessons = 0;
      if (parentCourse && parentCourse.sections) {
          parentCourse.sections.forEach(section => {
              if (section.lessons) {
                  totalLessons += section.lessons.length;
              }
          });
      }
      const safeTotalLessons = totalLessons > 0 ? totalLessons : 1; // (กันหารด้วย 0)
      
      console.log("--- DEBUG: totalLessons =", safeTotalLessons);
  
      // 4. "Find or Create" Progress
      let progress = await Progress.findOne({ user: userId, course: courseId });
      
      if (!progress) {
        console.log("--- DEBUG: Creating new progress record");
        progress = new Progress({
          user: userId,
          course: courseId,
          lessonsCompleted: [],
          totalLessons: safeTotalLessons // ⬅️ (ใช้เลขที่เพิ่งนับ)
        });
        await progress.save(); // ⬅️ บันทึกครั้งแรก
      } else {
        console.log("--- DEBUG: Found existing progress, updating totalLessons");
        // ⭐️ 2. (แก้ไข) ⭐️
        // ถ้า Progress "มีอยู่แล้ว" ให้อัปเดต 'totalLessons' เป็นเลขใหม่
        progress.totalLessons = safeTotalLessons;
      }
  
      // 5. เพิ่ม ID บทเรียนลงใน Array
      console.log("--- DEBUG: Adding lessonId to lessonsCompleted");
      await progress.updateOne({ $addToSet: { lessonsCompleted: lessonId } });
  
      // 6. ดึงข้อมูล Progress ล่าสุด (ตอนนี้จะ Find เจอแล้ว)
      progress = await Progress.findById(progress._id); 
      
      // 7. คำนวณ % ใหม่ (ด้วย 'totalLessons' ที่อัปเดตแล้ว)
      const completedCount = progress.lessonsCompleted.length;
      const safeTotalForCalc = Math.max(progress.totalLessons, completedCount); // ✅ ป้องกัน > 100%
      progress.percentage = (completedCount / safeTotalForCalc) * 100;
      progress.percentage = Math.min(100, Math.max(0, progress.percentage)); // ✅ Clamp 0-100
  
      progress.lastWatched = lessonId;
      await progress.save(); // ⬅️ บันทึก % ใหม่ และ totalLessons ใหม่
      
      console.log("--- DEBUG: Progress updated - completed:", completedCount, "total:", progress.totalLessons, "percentage:", progress.percentage);
      
      console.log("--- DEBUG: Progress saved successfully");
      res.json({ success: true, message: "อัปเดต Progress สำเร็จ", data: progress });
  
    } catch (err) {
      console.error("--- ERROR in mark-complete:", err);
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
                data: { 
                    percentage: 0, 
                    lessonsCompleted: [],
                    totalLessons: 0,
                } 
            });
        }
        
        // ✅ Ensure percentage is within 0-100 range
        const safePercentage = Math.min(100, Math.max(0, progress.percentage || 0));
        
        console.log("--- DEBUG GET progress: userId =", userId, "course =", courseId, "percentage =", safePercentage, "completed =", progress.lessonsCompleted.length, "total =", progress.totalLessons);
        
        res.json({ 
            success: true, 
            data: {
                ...progress.toObject(),
                percentage: safePercentage,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;