import { Purchase, Course } from "../models/schema.models.js";

/**
 * GET /api/admin/purchases
 * ดูรายการซื้อทั้งหมด (Admin)
 * Query params:
 *   - user=<userId>
 *   - course=<courseId>
 *   - status=pending|paid|cancelled|refunded
 */
export const getAllPurchases = async (req, res) => {
  try {
    // ตรวจ admin อีกชั้น
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const filter = {};
    if (req.query.user) filter.user = req.query.user;
    if (req.query.course) filter.course = req.query.course;
    if (req.query.status) filter.status = req.query.status;

    const purchases = await Purchase.find(filter)
      .populate("user", "username email name")
      .populate("course", "title price")
      .sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

/**
 * GET /api/admin/purchases/:id
 * ดูรายละเอียด purchase รายตัว (Admin)
 */
export const getPurchaseById = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate("user", "username email name")
      .populate("course", "title price description instructor");

    if (!purchase) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    res.json({ purchase });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

/**
 * PUT /api/admin/purchases/:id/status
 * อัปเดตสถานะ purchase (Admin)
 * body: { status: "pending" | "paid" | "cancelled" | "refunded" }
 */
export const updatePurchaseStatus = async (req, res) => {
  try {
    // ✅ ตรวจ role
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const { id } = req.params;
    const { status } = req.body;

    // ✅ ตรวจค่า status
    const validStatuses = ["pending", "paid", "cancelled", "refunded"];
    if (!status || !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: `Status ไม่ถูกต้อง! ต้องเป็น: ${validStatuses.join(", ")}` });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
    }

    // ✅ ตรวจ slip ก่อนอนุมัติ paid
    if (status === "paid" && !purchase.slipImage) {
      return res.status(400).json({
        message: "รายการนี้ไม่มีสลิป กรุณาตรวจสอบก่อนอนุมัติ",
      });
    }

    // ✅ อัปเดตสถานะ
    purchase.status = status;
    if (status === "paid") purchase.purchasedAt = Date.now();

    await purchase.save();

    res.json({ message: "อัปเดตสถานะสำเร็จ", purchase });
  } catch (error) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};


/**
 * PUT /api/admin/purchases/:id/cancel
 * ยกเลิกหรือ refund purchase (Admin)
 */
export const cancelPurchase = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const { id } = req.params;

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    let newStatus = "";
    if (purchase.status === "paid") {
      newStatus = "refunded";
    } else if (purchase.status === "pending") {
      newStatus = "cancelled";
    } else {
      return res.status(400).json({ message: `ไม่สามารถยกเลิกคำสั่งซื้อที่มีสถานะ ${purchase.status} ได้` });
    }

    purchase.status = newStatus;
    await purchase.save();

    res.json({ message: `อัปเดตสถานะเป็น ${newStatus}`, purchase });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

/**
 * POST /api/admin/purchases/register
 * ลงทะเบียนคอร์สให้ user (โดย admin)
 */
export const registerPurchaseForUser = async (req, res) => {
  try {
    const { userId, courseId, amount, status = "paid" } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    if (!userId || !courseId) {
      return res.status(400).json({ message: "กรุณาส่ง userId และ courseId" });
    }

    const course = await Course.findById(courseId); // ✅ ต้อง import Course
    if (!course) return res.status(404).json({ message: "ไม่พบคอร์ส" });

    const already = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["paid"] }
    });
    if (already) {
      return res.status(400).json({ message: "ผู้ใช้คนนี้ได้ลงทะเบียนคอร์สแล้ว" });
    }

    const purchase = await Purchase.create({
      user: userId,
      course: courseId,
      amount: amount ?? course.price,
      status,
      paymentMethod: "admin_granted",
      purchasedAt: Date.now()
    });

    res.status(201).json({ message: "ลงทะเบียนคอร์สเรียบร้อย", purchase });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};