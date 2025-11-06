// /routes/review.js
import express from "express";
import { Review, Course } from "../models/schema.models.js";
import { authenticateJWT, isEnrolled } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/** Helper: อัปเดตค่าเฉลี่ยและจำนวนรีวิวของคอร์ส */
async function updateCourseRating(courseId) {
  const reviews = await Review.find({ course: courseId });
  const totalReviews = reviews.length;
  const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

  await Course.findByIdAndUpdate(courseId, {
    averageRating: parseFloat(averageRating.toFixed(2)),
    reviewCount: totalReviews
  });
}

/** =========================
 * เพิ่มรีวิว (ต้อง login)
 * POST /api/reviews
========================= */
router.post("/", authenticateJWT,isEnrolled, async (req, res) => {
  try {
    const { course, rating, comment } = req.body;

    if (!course || !rating)
      return res.status(400).json({ message: "กรุณาระบุ course และ rating" });

    // ตรวจว่าผู้ใช้เคยรีวิวคอร์สนี้หรือยัง
    const existed = await Review.findOne({ user: req.user.id, course });
    if (existed) {
      return res.status(400).json({ message: "คุณได้รีวิวคอร์สนี้ไปแล้ว" });
    }

    const review = new Review({
      user: req.user.id,
      course,
      rating,
      comment,
    });

    await review.save();
    await updateCourseRating(course); // อัปเดตค่าเฉลี่ยและจำนวนรีวิว

    res.status(201).json({ message: "เพิ่มรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/** =========================
 * ดึงรีวิวทั้งหมดของคอร์ส + ค่าเฉลี่ย rating
 * GET /api/reviews/:courseId
========================= */
router.get("/:courseId", async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRatings / reviews.length).toFixed(2) : 0;

    res.json({
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/** =========================
 * แก้ไขรีวิว (เจ้าของเท่านั้น)
 * PUT /api/reviews/:id
========================= */
router.put("/:id", authenticateJWT,isAdmin ,async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "ไม่พบรีวิว" });

    if (review.user.toString() !== req.user.id)
      return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขรีวิวนี้" });

    review.rating = req.body.rating ?? review.rating;
    review.comment = req.body.comment ?? review.comment;
    review.updatedAt = Date.now();

    await review.save();
    await updateCourseRating(review.course); // อัปเดตค่าเฉลี่ยหลังแก้ไข

    res.json({ message: "อัปเดตรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

/** =========================
 * ลบรีวิว (เจ้าของหรือ admin)
 * DELETE /api/reviews/:id
========================= */
router.delete("/:id", authenticateJWT,isAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "ไม่พบรีวิว" });

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบรีวิวนี้" });
    }

    await review.deleteOne();
    await updateCourseRating(review.course); // อัปเดตค่าเฉลี่ยหลังลบ

    res.json({ message: "ลบรีวิวสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
});

export default router;
