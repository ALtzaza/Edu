import express from "express";
// (แก้ไข) import 'Lesson' เพิ่มเข้ามา
import { Workshop, User, Course, Lesson } from "../models/schema.models.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// --- ตั้งค่า Multer Storage ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// --- ID จำลอง (Mock IDs) ---
const MOCK_USER_ID = "68fb69f249ed00d001f1d029";
const MOCK_ADMIN_ID = "660000000000000000000001";

// --------------------------------------------------- 
// API: (นักเรียน) "ส่งงาน" หรือ "ส่งงานแก้"
// (แก้ไข) เปลี่ยน Route ให้รับ lessonId ด้วย
// ---------------------------------------------------
router.post(
  "/api/courses/:courseId/lessons/:lessonId/workshops",
  upload.single("workshopFile"),
  async (req, res) => {
    try {
      // (แก้ไข) ดึง lessonId จาก params
      const { courseId, lessonId } = req.params;
      const userId = MOCK_USER_ID;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = req.file.filename; // (แก้ไข) ตรวจสอบโดยใช้ 3 field (user, course, lesson)

      let workshop = await Workshop.findOne({
        user: userId,
        course: courseId,
        lesson: lessonId,
      });

      if (workshop) {
        // (ตรรกะนี้ยังเหมือนเดิม)
        if (workshop.status === "approved") {
          return res
            .status(400)
            .json({ message: "Workshop already approved. Cannot resubmit." });
        }
        workshop.fileUrl = fileUrl;
        workshop.status = "pending";
        workshop.submittedAt = Date.now();
        workshop.feedback = null;
        workshop.reviewedAt = null;
        await workshop.save();
        res.status(200).send(workshop);
      } else {
        // (แก้ไข) เพิ่ม lesson: lessonId ตอนสร้างใหม่
        const newWorkshop = new Workshop({
          user: userId,
          course: courseId,
          lesson: lessonId, //  เพิ่ม field นี้
          fileUrl: fileUrl,
        });
        await newWorkshop.save();
        res.status(201).send(newWorkshop);
      }
    } catch (error) {
      res.status(500).send({ message: "Server Error", error: error.message });
    }
  }
);

// ---------------------------------------------------
// API: (นักเรียน) ดู Workshop เฉพาะบทเรียนปัจจุบัน
// ---------------------------------------------------
router.get("/api/courses/:courseId/lessons/:lessonId/workshops/me", async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const userId = MOCK_USER_ID;

        // ค้นหา Workshop เฉพาะ User, Course, และ Lesson นี้
        const workshop = await Workshop.findOne({
            user: userId,
            course: courseId,
            lesson: lessonId,
        })
        .populate("course", "title")
        .populate("lesson", "title");

        // ส่งผลลัพธ์กลับไป (จะเป็น object หรือ null)
        res.status(200).send({ success: true, data: workshop });
    } catch (error) {
        console.error("Error fetching user workshop:", error);
        res.status(500).send({ message: "Server Error", error: error.message });
    }
});

// ---------------------------------------------------
// API:  (นักเรียน) ดู Workshop ทั้งหมดของตัวเอง
// ---------------------------------------------------
router.get("/api/workshops/me", async (req, res) => {
  try {
    const userId = MOCK_USER_ID;

    const workshops = await Workshop.find({ user: userId })
      .populate("course", "title")
      .populate("lesson", "title"); //  (แก้ไข) populate ชื่อบทเรียนมาด้วย

    res.status(200).send(workshops);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// ---------------------------------------------------
// API: (Admin) ดู Workshop ทั้งหมดใน Course
// (กรองตาม status หรือ lessonId ได้)
// ---------------------------------------------------
router.get("/api/courses/:courseId/workshops", async (req, res) => {
  try {
    const { courseId } = req.params; // (แก้ไข) รับ lessonId เพิ่มมาเผื่อกรอง
    const { status, lessonId } = req.query; // (แก้ไข) สร้างตัวกรอง (Filter)

    const filter = { course: courseId };
    if (status) {
      filter.status = status;
    }
    //  (เพิ่ม) ถ้ามี query ?lessonId=... ก็ให้กรองเฉพาะบทเรียนนั้น
    if (lessonId) {
      filter.lesson = lessonId;
    }

    const workshops = await Workshop.find(filter)
      .populate("user", "name")
      .populate("lesson", "title"); //  (แก้ไข) populate ชื่อบทเรียนมาด้วย

    res.status(200).send(workshops);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// ---------------------------------------------------
// API: (Admin) "ตรวจงาน" (ให้ Feedback และ Status)
// (ไม่ต้องแก้ไข)
// ---------------------------------------------------
router.put("/api/workshops/:workshopId/review", async (req, res) => {
  // ... (โค้ดส่วนนี้เหมือนเดิม 100% เพราะทำงานโดยใช้ workshopId)
  try {
    const { workshopId } = req.params;
    const { feedback, status } = req.body;

    if (!feedback || !status) {
      return res
        .status(400)
        .json({ message: "feedback and status are required" });
    }
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Invalid status. Must be "approved" or "rejected".' });
    }

    const updatedWorkshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        feedback: feedback,
        status: status,
        reviewedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedWorkshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    res.status(200).send(updatedWorkshop);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// ---------------------------------------------------
// API: (Admin) "ลบ" Workshop
// (ไม่ต้องแก้ไข)
// ---------------------------------------------------
router.delete("/api/workshops/:workshopId", async (req, res) => {
  // ... (โค้ดส่วนนี้เหมือนเดิม 100% เพราะทำงานโดยใช้ workshopId)
  try {
    const { workshopId } = req.params;

    const deletedWorkshop = await Workshop.findByIdAndDelete(workshopId);

    if (!deletedWorkshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

export default router;
