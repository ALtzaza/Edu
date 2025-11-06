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
    
    

    const userId = req.user.id;
    console.log(`--- DEBUG: userId = ${userId} ---`);
    //  หาคอสไอดีจากทุกที่
    let courseId = null;

    if (req.params.courseId) {
      // 1. หาจาก URL (เช่น GET /api/progress/:courseId)
      courseId = req.params.courseId;
    } 
    else if (req.query.courseId) {
     
      courseId = req.query.courseId;
    } 
    else if (req.params.lessonId) {
      
      const lesson = await Lesson.findById(req.params.lessonId);
      if (lesson) courseId = lesson.course;
    } 
    else if (req.body.lessonId) {
      
      const lesson = await Lesson.findById(req.body.lessonId);
      if (lesson) courseId = lesson.course;
    }

    
    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: "ไม่สามารถระบุคอร์สสำหรับตรวจสอบสิทธิ์ได้" 
      });
    }

    const purchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: "paid" // 
    });

   
    if (!purchase) {
     
      return res.status(403).json({ 
        success: false, 
        message: "คุณยังไม่ได้ลงทะเบียนคอร์สนี้ หรือการชำระเงินยังไม่สมบูรณ์" 
      });
    }

   
    next();

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};