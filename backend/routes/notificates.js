// ในไฟล์ routes/notificationRouter.js

import { Router } from "express";
import { Notification } from "../models/schema.models.js";
import { mockUser } from "../middleware/mockAuth.js";

const router = Router();

// --- API สำหรับ User (นักเรียน) ---

// 1. GET /api/notifications (ดึงการแจ้งเตือนทั้งหมดของฉัน)
// (หน้าบ้านใช้ API นี้เพื่อแสดง "กระดิ่ง" 🔔)
router.get("/", mockUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // ค้นหาการแจ้งเตือนทั้งหมดของ User นี้, เรียงจาก "ใหม่สุด" ไป "เก่าสุด"
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // (จำกัด 50 อันล่าสุด)

    // (นับอันที่ยังไม่อ่าน)
    const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        isRead: false 
    });

    res.json({ 
      success: true, 
      data: notifications, 
      unreadCount: unreadCount 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// 2. PUT /api/notifications/read-all (ติ๊กว่า "อ่านทั้งหมด" แล้ว)
router.put("/read-all", mockUser, async (req, res) => {
    try {
        const userId = req.user.id;

        // อัปเดต "ทั้งหมด" ของ User นี้ ให้ isRead: true
        await Notification.updateMany(
            { user: userId, isRead: false },
            { $set: { isRead: true } }
        );
        
        res.json({ success: true, message: "อัปเดตการแจ้งเตือนทั้งหมดเป็น 'อ่านแล้ว'" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// 3. PUT /api/notifications/:id/read (ติ๊กว่าอ่าน "อันเดียว" - เมื่อคลิก)
router.put("/:id/read", mockUser, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            // หาอันที่ ID ตรง และ User ID ตรง (ป้องกันคนอื่นมาแก้)
            { _id: id, user: userId }, 
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "ไม่พบการแจ้งเตือน" });
        }
        
        res.json({ success: true, data: notification });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// 4. POST /api/notifications (เทสสร้างการแจ้งเตือน)
// (ปกติ API นี้จะถูกเรียกโดย "ระบบ" เช่น "เมื่อเพื่อนตรวจงาน Workshop เสร็จ")
// (แต่เราจะเปิดไว้ให้ mockUser เทสยิงเองได้)
router.post("/", mockUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, message, link, type } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "กรุณาส่ง title และ message" });
        }

        const newNotification = new Notification({
            user: userId,
            title,
            message,
            link,
            type
        });

        await newNotification.save();
        res.status(201).json({ success: true, data: newNotification });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


export default router;