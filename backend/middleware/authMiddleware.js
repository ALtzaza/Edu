// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { Purchase, Lesson, Section } from "../models/schema.models.js";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "ไม่มี token ใน request" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token ไม่ถูกต้อง" });
    req.user = user; // user = { id, role }
    next();
  });
};

export const isEnrolled = async (req, res, next) => {
  try {
    
    const userId = req.user.id;

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