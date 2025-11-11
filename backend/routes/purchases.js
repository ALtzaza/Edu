// routes/purchases.js
import express from "express";
import mongoose from "mongoose";
import { Purchase, Course, User } from "../models/schema.models.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";


const router = express.Router();

// ตั้งค่า upload directory
const uploadDir = "uploads/slips";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `slip_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });


/**
 * Helpers
 */
function isOwnerOrAdmin(reqUser, resourceUserId) {
  if (!reqUser) return false;
  if (reqUser.role === "admin") return true;
  return reqUser.id === String(resourceUserId);
}

/**
 * GET /api/purchases/payment-info
 * แสดงเลขบัญชี / QR Code ที่ต้องโอน
 */
router.get("/payment-info", (req, res) => {
  res.json({
    bankAccountName: process.env.BANK_ACCOUNT_NAME,
    bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER,
    qrCodeUrl: process.env.BANK_QR_URL,
  });
});

/**
 * POST /api/purchases
 * สร้างรายการสั่งซื้อ (status: pending)
 * ต้อง login
 * body: { course: courseId, paymentMethod? }  (amount ถูกตั้งอัตโนมัติจาก course.price)
 */
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { course: courseId, paymentMethod = "manual" } = req.body;

    if (!courseId) return res.status(400).json({ message: "กรุณาระบุ course" });

    // ตรวจว่ามีคอร์ส
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "ไม่พบคอร์ส" });

    // ตรวจว่าผู้ใช้เคยซื้อคอร์สนี้ (สถานะ paid) แล้วหรือไม่
    const already = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["paid"] }
    });
    if (already) {
      return res.status(400).json({ message: "คุณได้ซื้อคอร์สนี้แล้ว" });
    }

    const purchase = await Purchase.create({
      user: userId,
      course: courseId,
      amount: course.price,
      status: "pending",
      paymentMethod,
      paymentRef: null
    });

    res.status(201).json({ message: "สร้างคำสั่งซื้อเรียบร้อย", purchase });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/**
 * GET /api/purchases/mine
 * ดึงรายการซื้อของ user ที่ login
 */
router.get("/mine", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const purchases = await Purchase.find({ user: userId })
      .populate("course", "title price thumbnail")
      .sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/**
 * POST /api/purchases/:id/upload-slip
 * แนบสลิปการชำระเงิน
 */
router.post("/:id/upload-slip", authenticateJWT, upload.single("slip"), async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    if (purchase.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์แนบสลิปนี้" });
    }

    if (!req.file) return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์สลิป" });

    purchase.slipUrl = `/uploads/slips/${req.file.filename}`;
    purchase.status = "pending"; // รอ admin ตรวจสอบ
    await purchase.save();

    res.json({
      message: "อัปโหลดสลิปเรียบร้อย รอการตรวจสอบจากแอดมิน",
      slipUrl: purchase.slipUrl,
      purchase,
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


/**
 * GET /api/purchases
 * ดึงรายการทั้งหมด (สำหรับ admin) หรือดึงโดย query
 * query: user=, course=, status=
 */
router.get("/", authenticateJWT, async (req, res) => {
  try {
    // ถ้าไม่ใช่ admin ให้ปฏิเสธ
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const filter = {};
    if (req.query.user) filter.user = req.query.user;
    if (req.query.course) filter.course = req.query.course;
    if (req.query.status) filter.status = req.query.status;

    const purchases = await Purchase.find(filter)
      .populate("user", "username email")
      .populate("course", "title price")
      .sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/**
 * GET /api/purchases/my-courses
 * ดึงคอร์สทั้งหมดที่ user เข้าร่วม (status: paid)
 * ต้อง login
 */
router.get("/my-courses", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // หา purchase ที่ status = paid
    const purchases = await Purchase.find({ user: userId, status: "paid" })
      .populate({
        path: "course",
        select: "title description thumbnail price instructor difficulty averageRating reviewCount",
        populate: { path: "category", select: "name" } // ถ้าต้องการ category
      })
      .sort({ purchasedAt: -1 });

    // ดึงเฉพาะ course object
    const courses = purchases.map(p => ({
      purchaseId: p._id,
      purchasedAt: p.purchasedAt,
      course: p.course
    }));

    res.json({
      message: "ดึงคอร์สที่เข้าร่วมสำเร็จ",
      courses
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/**
 * GET /api/purchases/:id
 * ดูรายละเอียดคำสั่งซื้อ (เจ้าของหรือ admin)
 */
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("user", "username email name")
      .populate("course", "title price description");

    if (!purchase) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    if (!isOwnerOrAdmin(req.user, purchase.user._id)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้" });
    }

    res.json({ purchase });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/**
 * POST /api/purchases/:id/pay
 * ทำเครื่องหมายว่า "จ่ายแล้ว" (simulate payment)
 * ต้อง login — เป็นเจ้าของคำสั่งซื้อ หรือ admin
 * body: { paymentRef? }
 */
// router.post("/:id/pay", authenticateJWT, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const purchase = await Purchase.findById(req.params.id).session(session);
//     if (!purchase) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
//     }

//     if (!isOwnerOrAdmin(req.user, purchase.user)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(403).json({ message: "ไม่มีสิทธิ์ทำรายการนี้" });
//     }

//     if (purchase.status === "paid") {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ message: "คำสั่งซื้อถูกชำระแล้ว" });
//     }

//     // ทำการอัปเดตสถานะเป็น paid
//     purchase.status = "paid";
//     purchase.paymentRef = req.body.paymentRef || `mock_${Date.now()}`;
//     purchase.purchasedAt = Date.now();
//     await purchase.save({ session });

//     // (optionally) อาจให้สิทธิ์เข้าถึงคอร์สที่นี่ เช่น สร้าง Progress หรือเพิ่ม relation
//     // ตัวอย่าง: สร้าง notification / progress (ข้ามในตัวอย่างนี้)

//     await session.commitTransaction();
//     session.endSession();

//     res.json({ message: "ชำระเงินสำเร็จ", purchase });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
//   }
// });

router.post("/:id/pay", authenticateJWT, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const purchase = await Purchase.findById(req.params.id).session(session);
    if (!purchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
    }

    // ถ้าเป็น manual (แนบสลิป) — ห้าม owner mark paid เอง
    if (purchase.paymentMethod === "manual" && req.user.role !== "admin") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "รายการนี้ต้องรอการอนุมัติจาก admin (manual payment)" });
    }

    // เจ้าของหรือ admin สามารถ mark paid สำหรับ non-manual (หรือ admin สามารถ approve manual)
    if (!isOwnerOrAdmin(req.user, purchase.user) && req.user.role !== "admin") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "ไม่มีสิทธิ์ทำรายการนี้" });
    }

    if (purchase.status === "paid") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "คำสั่งซื้อถูกชำระแล้ว" });
    }

    // ทำการอัปเดตสถานะเป็น paid
    purchase.status = "paid";
    purchase.paymentRef = req.body.paymentRef || `manual_${Date.now()}`;
    purchase.purchasedAt = Date.now();
    await purchase.save({ session });

    // (optionally) ให้สิทธิ์เข้าคอร์สที่นี่

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "ชำระเงินสำเร็จ", purchase });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});


/**
 * PUT /api/purchases/:id/cancel
 * ยกเลิกคำสั่งซื้อ (เจ้าของหรือ admin) — เงื่อนไข: ถ้ายังไม่ paid หรือ allow refund
 */
router.put("/:id/cancel", authenticateJWT, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    if (!isOwnerOrAdmin(req.user, purchase.user)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ทำรายการนี้" });
    }

    if (purchase.status === "paid") {
      // หากต้องการอนุญาต refund ต้องมีกระบวนการเพิ่มเติม
      // ในตัวอย่างนี้ไม่อนุญาตให้ยกเลิก order ที่จ่ายแล้วผ่าน API นี้
      return res.status(400).json({ message: "ไม่สามารถยกเลิกคำสั่งซื้อที่ชำระแล้วได้ (ขอ refund ผ่าน admin)" });
    }

    purchase.status = "cancelled";
    await purchase.save();

    res.json({ message: "ยกเลิกคำสั่งซื้อเรียบร้อย", purchase });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/**
 * POST /api/purchases/webhook
 * Mock webhook สำหรับ payment provider (public endpoint)
 * body: { purchaseId, status: "paid"|"failed", paymentRef }
 */
router.post("/webhook", async (req, res) => {
  try {
    const { purchaseId, status, paymentRef } = req.body;
    if (!purchaseId || !status) return res.status(400).json({ message: "missing fields" });

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    // ยอมรับเฉพาะสถานะที่เรารองรับ
    if (status === "paid") {
      purchase.status = "paid";
      purchase.paymentRef = paymentRef || purchase.paymentRef || `webhook_${Date.now()}`;
      purchase.purchasedAt = Date.now();
      await purchase.save();

      // TODO: สร้าง notification / อัปเดตสิทธิ์เข้าคอร์ส
      return res.json({ message: "อัปเดตสถานะเป็น paid", purchase });
    }

    if (status === "failed") {
      purchase.status = "cancelled";
      await purchase.save();
      return res.json({ message: "อัปเดตสถานะเป็น cancelled (failed)", purchase });
    }

    res.status(400).json({ message: "สถานะไม่รองรับ" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});







export default router;
