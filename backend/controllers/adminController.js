import mongoose from "mongoose";

// backend/controllers/adminController.js
import { User, Purchase, Course } from "../models/schema.models.js";

// ดึงรายชื่อผู้ใช้ทั้งหมด
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", error });
  }
};

// ดึงข้อมูลผู้ใช้รายคน
// export const getUserById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id).select("-password");
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", error });
//   }
// }
// ดึง user ตาม id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "User ID ไม่ถูกต้อง" });

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error });
  }
};

// แก้ไขข้อมูลผู้ใช้โดย admin + รองรับ avatar
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "User ID ไม่ถูกต้อง" });

    const body = { ...req.body };

    // ถ้ามีไฟล์ avatar
    if (req.file) {
      body.avatar = `/uploads/avatars/${req.file.filename}`;

      // ลบไฟล์เก่า ถ้ามี
      const existingUser = await User.findById(id);
      if (existingUser?.avatar && existingUser.avatar.startsWith("/uploads/avatars/")) {
        const oldPath = path.join(process.cwd(), existingUser.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, body, { new: true }).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ success: true, message: "อัปเดตผู้ใช้สำเร็จ", data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};


// เปลี่ยน role ของ user (เช่น student → teacher/admin)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.body?.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "User ID ไม่ถูกต้อง" });
    }

    if (!role) return res.status(400).json({ message: "กรุณาส่ง role ด้วย" });

    const validRoles = ["student", "teacher", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Role ไม่ถูกต้อง! ต้องเป็น: ${validRoles.join(", ")}` });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true } // runValidators จะบังคับ enum ด้วย
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ message: "อัปเดต role สำเร็จ", updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};


// ลบผู้ใช้
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error });
  }
};
