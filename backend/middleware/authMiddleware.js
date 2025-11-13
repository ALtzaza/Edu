// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { Purchase, Lesson, Section } from "../models/schema.models.js";

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ⭐️ 2. (แก้ไข) เพิ่มการตรวจสอบ Header (ป้องกัน Error 500)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "ไม่มี token ใน request หรือ format ผิด" });
    }

    const token = authHeader.split(" ")[1];

    // ⭐️ 3. (แก้ไข) ใช้ "await" (แบบไม่มี Callback)
    // (มันจะ "รอ" จนกว่าจะถอดรหัสเสร็จ)
    const payload = await jwt.verify(token, process.env.JWT_SECRET);
    console.log("--- DEBUG PAYLOAD (req.user):", payload);
    
    // ⭐️ 4. (แก้ไข) สร้าง req.user (payload = { id, role })
    req.user = payload; 
    
    // ⭐️ 5. (แก้ไข) "เสร็จแล้ว" ค่อยปล่อยไปหา isEnrolled
    next();

  } catch (err) {
    // ⭐️ 6. (แก้ไข) ถ้า Token หมดอายุ หรือ ปลอม (verify พัง)
    return res.status(403).json({ success: false, message: "Token ไม่ถูกต้องหรือหมดอายุ", error: err.message });
  }
};

export const isEnrolled = async (req, res, next) => {
  try {
    // ⭐️ (Debug Log 1) ⭐️
    console.log("--- DEBUG: isEnrolled รันแล้ว ---");
    console.log("--- DEBUG: req.params =", req.params);
    console.log("--- DEBUG: req.query =", req.query);
    console.log("--- DEBUG: req.body =", req.body);
    

    const userId = req.user.id;
    console.log(`--- DEBUG: userId = ${userId} ---`);
    //  หาคอสไอดีจากทุกที่
    let courseId = null;

    if (req.params.courseId) {
      // 1. หาจาก URL (เช่น GET /api/progress/:courseId)
      console.log("--- DEBUG: Found courseId in req.params");
      courseId = req.params.courseId;
    } 
    else if (req.query.courseId) {
     
      console.log("--- DEBUG: Found courseId in req.query");
      courseId = req.query.courseId;
    } 
    else if (req.body && req.body.courseId) {
      // ⭐️ (แก้) เพิ่มการตรวจสอบ body.courseId (Frontend อาจส่งมาผ่าน body)
      console.log("--- DEBUG: Found courseId in req.body");
      courseId = req.body.courseId;
    }
    else if (req.params.lessonId) {
      console.log("--- DEBUG: Found lessonId in req.params, looking up course");
      
      const lesson = await Lesson.findById(req.params.lessonId);
      if (lesson) {
        console.log("--- DEBUG: Lesson found, courseId =", lesson.course);
        courseId = lesson.course;
      } else {
        console.log("--- DEBUG: Lesson NOT found for ID:", req.params.lessonId);
      }
    } 
    else if (req.body && req.body.lessonId) {
      console.log("--- DEBUG: Found lessonId in req.body, looking up course");
      
      const lesson = await Lesson.findById(req.body.lessonId);
      if (lesson) {
        console.log("--- DEBUG: Lesson found, courseId =", lesson.course);
        courseId = lesson.course;
      } else {
        console.log("--- DEBUG: Lesson NOT found for ID:", req.body.lessonId);
      }
    }

    
    if (!courseId) {
      console.error("--- ERROR: Could not determine courseId");
      return res.status(400).json({ 
        success: false, 
        message: "ไม่สามารถระบุคอร์สสำหรับตรวจสอบสิทธิ์ได้" 
      });
    }

    console.log("--- DEBUG: Checking purchase for user:", userId, "course:", courseId);
    const purchase = await Purchase.findOne({
      user: userId,
      course: courseId.toString(),
      status: "paid" // 
    });

    console.log("--- DEBUG: Purchase found:", purchase ? "YES" : "NO");
   
    if (!purchase) {
      console.error("--- ERROR: User not enrolled in course");
     
      return res.status(403).json({ 
        success: false, 
        message: "คุณยังไม่ได้ลงทะเบียนคอร์สนี้ หรือการชำระเงินยังไม่สมบูรณ์" 
      });
    }

    console.log("--- DEBUG: isEnrolled passed, calling next()");
    next();

  } catch (err) {
    console.error("--- ERROR in isEnrolled middleware:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCourseEnrollmentStatus = async (req, res) => {
  try {
      const { id: courseId } = req.params; // นี่คือ courseId
      const { id: userId } = req.user;     // นี่คือ userId (จาก JWT)

      // ค้นหาใน Purchase/Enrollment
      const purchase = await Purchase.findOne({
          user: userId,
          course: courseId,
          status: 'paid' // หรือ 'approved' (แล้วแต่คุณตั้งชื่อ)
      });

      if (purchase) {
          return res.json({ isEnrolled: true });
      } else {
          return res.json({ isEnrolled: false });
      }
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
};

