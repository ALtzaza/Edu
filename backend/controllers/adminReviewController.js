import { Review } from "../models/schema.models.js";

/**
 * GET /api/admin/reviews
 * ดูรีวิวทั้งหมด (admin)
 * Query params: course, user, rating
 */
export const getAllReviews = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.rating) filter.rating = Number(req.query.rating);

    const reviews = await Review.find(filter)
      .populate("user", "username email name")
      .populate("course", "title price")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

/**
 * GET /api/admin/reviews/:id
 * ดูรายละเอียดรีวิวรายตัว (admin เท่านั้น)
 */
export const getReviewById = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const { id } = req.params;

    const review = await Review.findById(id)
      .populate("user", "username email name")
      .populate("course", "title price");

    if (!review) return res.status(404).json({ message: "ไม่พบรีวิว" });

    res.json({ review });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};

/**
 * DELETE /api/admin/reviews/:id
 * ลบรีวิว (admin เท่านั้น)
 */
export const deleteReview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "ต้องเป็น admin เท่านั้น" });
    }

    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "ไม่พบรีวิว" });

    await Review.findByIdAndDelete(id);

    res.json({ message: "ลบรีวิวสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};
