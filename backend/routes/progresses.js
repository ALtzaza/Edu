import { Router } from "express";
import { Progress, Lesson, Course ,Quiz, QuizResult } from "../models/schema.models.js";
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
      // ใช้วิธีนับที่ "เร็วและแม่นยำ" ที่สุด
      const totalLessons = await Lesson.countDocuments({ course: courseId });
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
        // อัปเดต 'totalLessons' เป็นเลขใหม่เสมอ
        progress.totalLessons = safeTotalLessons;
      }
  
      // 5. เพิ่ม ID บทเรียนลงใน Array
      console.log("--- DEBUG: Adding lessonId to lessonsCompleted");
      // ⭐️ (แก้ไข) เราต้องอัปเดต progress object ในหน่วยความจำด้วย
      progress.lessonsCompleted.addToSet(lessonId);
  
      // 6. คำนวณ % ใหม่ (ด้วย 'totalLessons' ที่อัปเดตแล้ว)
      const completedCount = progress.lessonsCompleted.length;
      progress.percentage = (completedCount / progress.totalLessons) * 100;
      if (progress.percentage > 100) progress.percentage = 100;
  
      progress.lastWatched = lessonId;
      await progress.save(); // ⬅️ บันทึก % ใหม่, totalLessons ใหม่, และ lessonsCompleted ใหม่
      
      console.log("--- DEBUG: Progress saved successfully");
      
      // 7. ⭐️ (แก้ไข) ส่ง progress ที่อัปเดตแล้วกลับไป
      // (เพื่อให้ Front-end มีข้อมูลที่ถูกต้องทันที)
      res.json({ success: true, message: "อัปเดต Progress สำเร็จ", data: progress });
  
    } catch (err) {
      console.error("--- ERROR in mark-complete:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });


// 2. GET /api/progress/:courseId (ดึง Progress ของคอร์สนี้)
// ⭐️⭐️⭐️ (จุดแก้ไขหลัก) ⭐️⭐️⭐️
router.get("/:courseId", authenticateJWT, isEnrolled, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // 1. ⭐️ (เพิ่ม) นี่คือ "ความจริง" ว่าคอร์สมีกี่บทเรียน
        // (เรานับใหม่ทุกครั้งที่ User โหลดหน้า)
        const actualTotalLessons = await Lesson.countDocuments({ course: courseId });
        const safeTotalLessons = actualTotalLessons > 0 ? actualTotalLessons : 1; // กันหารด้วย 0

        // 2. ดึง Progress ที่ "บันทึกไว้" (ข้อมูลเก่า)
        let progress = await Progress.findOne({ user: userId, course: courseId })
            .populate('lessonsCompleted', 'title');

        if (!progress) {
            // (ถ้าไม่เคยเรียนเลย ก็ส่งค่า 0 กลับไป)
            // ⭐️ (แก้ไข) แต่ส่ง "total" ที่ถูกต้องไปด้วย
            return res.json({ 
                success: true, 
                data: { 
                    percentage: 0, 
                    lessonsCompleted: [],
                    totalLessons: safeTotalLessons // ⬅️ ส่งค่าที่ถูกต้อง (เช่น 9)
                } 
            });
        }
        
        // 3. ⭐️ (เพิ่ม) "ซิงค์ข้อมูล" (Sync)
        // ถ้าจำนวนบทเรียนที่บันทึกไว้ (เช่น 4) ไม่ตรงกับที่นับได้จริง (เช่น 9)
        if (progress.totalLessons !== actualTotalLessons) {
            console.log(`--- DEBUG: Syncing progress. DB was ${progress.totalLessons}, but actual is ${actualTotalLessons}`);
            
            // อัปเดตค่าให้ถูกต้อง
            progress.totalLessons = safeTotalLessons;
            
            // คำนวณ % ใหม่
            const completedCount = progress.lessonsCompleted.length;
            progress.percentage = (completedCount / safeTotalLessons) * 100;
            if (progress.percentage > 100) progress.percentage = 100;
            
            // บันทึกค่าที่แก้ไขแล้ว (ไม่ต้องรอ)
            await progress.save();
        }
        
        // 4. ส่งข้อมูลที่ "ซิงค์แล้ว" และ "ถูกต้อง" กลับไป
        res.json({ success: true, data: progress });

    } catch (err) {
        console.error("--- ERROR in GET /:courseId progress:", err); // ⭐️ (แก้ Log)
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/reset-section", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId } = req.body; // ID ของ "ควิซที่สอบตก"

        if (!lessonId) {
            return res.status(400).json({ success: false, message: "ไม่พบ lessonId" });
        }

        // 1. ค้นหาบทเรียน (ควิซ) นี้
        const quizLesson = await Lesson.findById(lessonId);
        if (!quizLesson) {
            return res.status(404).json({ success: false, message: "ไม่พบบทเรียนควิซ" });
        }
        
        const courseId = quizLesson.course;
        const sectionId = quizLesson.section;

        // 2. ค้นหา "บทเรียนทั้งหมด" ที่อยู่ใน Section เดียวกัน
        const sectionLessons = await Lesson.find({ section: sectionId });
        const lessonIdsToReset = sectionLessons.map(l => l._id);

        // 3. ค้นหา Progress ของผู้ใช้
        const progress = await Progress.findOne({ user: userId, course: courseId });
        if (!progress) {
            return res.status(404).json({ success: false, message: "ไม่พบ Progress ของผู้ใช้" });
        }

        // 4. ⭐️ (งานที่ 1) Reset Progress (ลบติ๊กถูก ✅)
        await Progress.updateOne(
            { _id: progress._id },
            { $pull: { lessonsCompleted: { $in: lessonIdsToReset } } }
        );

        // 5. ⭐️⭐️⭐️ (งานที่ 2: ที่เพิ่มเข้ามา) ⭐️⭐️⭐️
        // Reset Quiz Attempts (ลบประวัติการสอบตก)
        await QuizResult.deleteMany({
            user: userId,
            lesson: lessonId // ⬅️ ลบเฉพาะประวัติของ "ควิซนี้"
        });
        console.log(`--- DEBUG: Quiz attempts reset for User ${userId}, Lesson ${lessonId}`);

        // 6. ดึง Progress ที่อัปเดตแล้ว
        const updatedProgress = await Progress.findById(progress._id);
        
        // 7. คำนวณ % ใหม่ และบันทึก
        const completedCount = updatedProgress.lessonsCompleted.length;
        updatedProgress.percentage = (completedCount / updatedProgress.totalLessons) * 100;
        await updatedProgress.save();
        
        console.log(`--- DEBUG: Progress Reset for User ${userId}, Section ${sectionId}`);
        
        // 8. ส่ง Progress ใหม่กลับไปให้ Front-end
        res.json({ success: true, message: "รีเซ็ต Section สำเร็จ", data: updatedProgress });

    } catch (err) {
        console.error("--- ERROR in reset-section:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});
export default router;