import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/schema.models.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import crypto from "crypto";

const router = express.Router();

/* =======================
   FORGOT PASSWORD
======================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { login } = req.body; // email หรือ username

    if (!login) return res.status(400).json({ message: "กรุณากรอก email หรือ username" });

    const user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });

    if (!user) return res.status(400).json({ message: "ไม่พบบัญชีผู้ใช้" });

    // สร้าง token ชั่วคราว
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpire = Date.now() + 15 * 60 * 1000; // หมดอายุ 15 นาที

    // บันทึก token ลง user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    // สำหรับโปรเจกต์ demo → ส่ง response token กลับ (ปกติส่งทาง email)
    res.json({
      message: "สร้างลิงก์รีเซ็ตรหัสผ่านเรียบร้อย",
      resetLink: `http://localhost:3000/reset-password?token=${resetToken}`
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/* =======================
   RESET PASSWORD
======================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ message: "กรุณากรอก token และรหัสผ่านใหม่" });

    // ตรวจสอบ password ด้วย validatePassword
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() } // ยังไม่หมดอายุ
    });

    if (!user) return res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" });

    // hash password ใหม่
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ! สามารถ login ได้เลย" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


/* =======================
   HELPER FUNCTION
======================= */
function validatePassword(password) {
  const minLength = 6;
  const hasNumber = /\d/;
  const hasUpper = /[A-Z]/;
  const hasLower = /[a-z]/;
//   const hasSpecial = /[!@#$%^&*]/;

  if (password.length < minLength)
    return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  if (!hasNumber.test(password))
    return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
  if (!hasUpper.test(password))
    return "รหัสผ่านต้องมีตัวอักษรตัวพิมพ์ใหญ่ 1 ตัว";
  if (!hasLower.test(password))
    return "รหัสผ่านต้องมีตัวอักษรตัวพิมพ์เล็ก 1 ตัว";
//   if (!hasSpecial.test(password))
//     return "รหัสผ่านต้องมีอักขระพิเศษ (!@#$%^&*) อย่างน้อย 1 ตัว";

  return null; // ผ่านทั้งหมด
}


// =======================
// REGISTER
// =======================
router.post("/register", async (req, res) => {
  try {
    const { name, surname, username, email, password, role } = req.body;

    // ตรวจสอบข้อมูล
    if (!name || !email || !password || !username)
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

    // ตรวจสอบรหัสผ่าน
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    // ตรวจสอบ email และ username ซ้ำ
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email)
        return res.status(400).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
      if (existingUser.username === username)
        return res.status(400).json({ message: "username นี้ถูกใช้แล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      username,
      email,
      password: hashedPassword,
      role: role || "student",
    });

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: {
        id: newUser._id,
        name: newUser.name,
        surname: newUser.surname,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


// =======================
// LOGIN
// =======================
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body; // login = email หรือ username

    if (!login || !password)
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

    // หา user ด้วย email หรือ username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });

    if (!user)
      return res.status(400).json({ message: "ไม่พบบัญชีผู้ใช้" });

    // ตรวจสอบว่า account ยัง active
    if (user.role === "deactivated") // หรือ user.isActive === false
      return res.status(403).json({ message: "บัญชีถูกปิดใช้งาน ไม่สามารถเข้าสู่ระบบได้" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

// =======================
// GET CURRENT USER PROFILE
// =======================
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!user) return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });

    res.json({
      message: "ดึงข้อมูลผู้ใช้สำเร็จ",
      user
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


// =======================
// UPDATE USER PROFILE
// =======================
router.put("/update", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id; // มาจาก JWT
    const { name, surname, username, email, password, avatar } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (surname) updateData.surname = surname;

    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername)
        return res.status(400).json({ message: "username นี้ถูกใช้แล้ว" });
      updateData.username = username;
    }

    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail)
        return res.status(400).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
      updateData.email = email;
    }

    if (password) {
      const passwordError = validatePassword(password);
      if (passwordError) return res.status(400).json({ message: passwordError });

      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // ✅ เพิ่ม avatar
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({
      message: "อัปเดตข้อมูลสำเร็จ",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        surname: updatedUser.surname,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar, // ส่งกลับด้วย
      },
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


/* =======================
   LOGOUT
======================= */
router.post("/logout", (req, res) => {
  // สำหรับ Client-side logout เพียงแค่ให้ client ลบ token
  // server ไม่ต้องทำอะไร
  res.json({ message: "ออกจากระบบสำเร็จ!" });
});

// =======================
// DELETE USER ACCOUNT
// =======================
router.delete("/delete", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // ลบ user จริง ๆ
    // const deletedUser = await User.findByIdAndDelete(userId);

    // หรือถ้าอยาก deactivate แทน
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { role: "deactivated" }, // หรือเพิ่ม field isActive: false
      { new: true }
    );

    if (!deletedUser) return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });

    res.json({
      message: "บัญชีถูกลบ/ปิดใช้งานเรียบร้อย",
      user: {
        id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


export default router;
