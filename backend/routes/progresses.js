// ในไฟล์ routes/progressRouter.js

import { Router } from "express";
import { Progress, Lesson, Course } from "../models/schema.models.js";
// ⭐️ 1. Import "ตัวปลอม" ของ User
import { mockUser } from "../middleware/mockAuth.js";

const router = Router();

// --- API สำหรับ User (นักเรียน) ---

// 1. ⭐️ POST /api/progress/mark-complete ⭐️
// (นี่คือ API ที่ยิง "เมื่อเรียนจบบท")
router.post("/mark-complete", mockUser, async (req, res) => {
  try {
    // 1. รับ ID ของ "บทเรียน" (Lesson) ที่เพิ่งเรียนจบ
    const { lessonId } = req.body;
    const userId = req.user.id;

    // 2. ค้นหา Lesson (เพื่อเอา courseId)
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        return res.status(404).json({ success: false, message: "ไม่พบบทเรียน" });
    }
    const courseId = lesson.course;
    
    // 3. ⭐️ (สำคัญ) ค้นหา "คอร์สแม่" เพื่อเอา "จำนวนบทเรียนทั้งหมด"
    const parentCourse = await Course.findById(courseId).populate('sections');
    let totalLessons = 0;
    if (parentCourse && parentCourse.sections) {
        parentCourse.sections.forEach(section => {
            if (section.lessons) {
                totalLessons += section.lessons.length;
            }
        });
    }

    // 4. ⭐️ "Find or Create" Progress
    let progress = await Progress.findOne({ user: userId, course: courseId });
    
    if (!progress) {
      progress = new Progress({
        user: userId,
        course: courseId,
        lessonsCompleted: [],
        totalLessons: totalLessons || 1 // (ป้องกันการหารด้วย 0)
      });

      // ⭐️⭐️ (นี่คือจุดที่แก้!) ⭐️⭐️
      // บันทึก Progress ใหม่นี้ลง DB ก่อน
      await progress.save(); 
    }

    // 5. ⭐️ (สำคัญ) เพิ่ม ID บทเรียนลงใน Array (ถ้ายังไม่มี)
    await progress.updateOne({ $addToSet: { lessonsCompleted: lessonId } });

    // 6. อัปเดต Progress ที่เพิ่งดึงมา (ตอนนี้จะ Find เจอแล้ว)
    progress = await Progress.findById(progress._id); 
    
    // 7. คำนวณ % ใหม่ (ตอนนี้จะไม่พังแล้ว)
    const completedCount = progress.lessonsCompleted.length;
    const safeTotalLessons = progress.totalLessons > 0 ? progress.totalLessons : 1;
    progress.percentage = (completedCount / safeTotalLessons) * 100;
    if (progress.percentage > 100) progress.percentage = 100;

    progress.lastWatched = lessonId; // อัปเดตบทที่ดูล่าสุด
    await progress.save(); // บันทึก %
    
    res.json({ success: true, message: "อัปเดต Progress สำเร็จ", data: progress });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// 2. GET /api/progress/:courseId (ดึง Progress ของคอร์สนี้)
// (โค้ดส่วนนี้ถูกต้องอยู่แล้ว)
router.get("/:courseId", mockUser, async (req, res) => {
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