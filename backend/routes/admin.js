// routes/admin.js (V3 - เพิ่ม "Manage Users")

import { Router } from "express";
import { User, Course, Purchase } from "../models/schema.models.js"; 
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

// --- 1. (API "วิเคราะห์" (V2) - (คงเดิม)) ---
router.get("/stats", authenticateJWT, isAdmin, async (req, res) => {
  try {
    // ... (โค้ด 'GET /stats' (V2) ... ถูกต้องแล้ว)
    const [
      totalUsers,
      totalCourses,
      pendingOrders,
      salesData
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Purchase.countDocuments({ status: "pending" }),
      Purchase.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, totalSales: { $sum: "$amount" } } }
      ])
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
    res.json({
      success: true,
      stats: { totalUsers, totalCourses, totalSales, pendingOrders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- 2. ⭐️ (ใหม่) GET /api/admin/users (V3) (ดึง "User ทั้งหมด") ⭐️ ---
router.get("/users", authenticateJWT, isAdmin, async (req, res) => {
  try {
    // (ดึง User ทั้งหมด (ยกเว้น 'password') 
    //  และ "เรียง" (Sort) ตาม 'role' (admin ขึ้นก่อน))
    const users = await User.find()
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ role: 1, createdAt: -1 });
      
    res.json({ success: true, data: users });
    
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- 3. ⭐️ (ใหม่) DELETE /api/admin/users/:id (V3) (Admin "ลบ" User) ⭐️ ---
// (API 'DELETE /delete' (V2) ใน 'users.js' (V2) 
//  มัน "ลบตัวเอง" ➡️ แต่ API นี้ (V3) "ลบคนอื่น")
router.delete("/users/:id", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { id: userIdToDelete } = req.params;
    const adminId = req.user.id;

    // (ป้องกัน "Admin ลบ Admin" (V3))
    if (userIdToDelete === adminId) {
      return res.status(403).json({ success: false, message: "ไม่สามารถลบตัวเองได้" });
    }

    // (ลบ "จริง" (V3))
    // const deletedUser = await User.findByIdAndDelete(userIdToDelete);
    
    // (หรือ "Deactivate" (V2))
    const deactivatedUser = await User.findByIdAndUpdate(
      userIdToDelete,
      { role: "deactivated" }, 
      { new: true }
    );

    if (!deactivatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }
    res.json({ 
      success: true, 
      message: `ปิดใช้งาน (Deactivate) ผู้ใช้ ${deactivatedUser.username} สำเร็จ`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;