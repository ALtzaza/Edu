import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { User } from "../models/schema.models.js";

const router = express.Router();

// GET: ดึงคอร์สที่ user ลงทะเบียน
router.get("/", authenticateJWT, async (req, res) => {
  try {
    // ดึง user และ populate enrolledCourses
    const user = await User.findById(req.user.id).populate("enrolledCourses");
    
    // ส่งข้อมูลกลับ
    res.json({
      message: "ดึงข้อมูลคอร์สที่ลงทะเบียนสำเร็จ",
      courses: user.enrolledCourses
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

export default router;
