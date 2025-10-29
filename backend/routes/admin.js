// backend/routes/admin.js
import express from "express";
import { isAdmin } from "../middleware/roleMiddleware.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { getAllUsers, getUserById, updateUserRole, deleteUser } from "../controllers/adminController.js";
import { getAllPurchases, getPurchaseById, updatePurchaseStatus, cancelPurchase, registerPurchaseForUser } from "../controllers/adminPurchaseController.js";
import { getAllReviews, getReviewById, deleteReview } from "../controllers/adminReviewController.js";

const router = express.Router();

// ดึง user ทั้งหมด
router.get("/users", authenticateJWT, isAdmin, getAllUsers);

// ดึง user รายคน
router.get("/users/:id", authenticateJWT, isAdmin, getUserById);

// เปลี่ยน role user
router.put("/users/:id/role", authenticateJWT, isAdmin, updateUserRole);

// ลบ user
router.delete("/users/:id", authenticateJWT , isAdmin, deleteUser);

// --- Admin purchase route ---
router.get("/purchases", authenticateJWT, isAdmin, getAllPurchases);
router.get("/purchases/:id", authenticateJWT, isAdmin, getPurchaseById);
router.put("/purchases/:id/status", authenticateJWT, isAdmin, updatePurchaseStatus);
router.put("/purchases/:id/cancel", authenticateJWT, isAdmin, cancelPurchase);
router.post("/purchases/register", authenticateJWT, isAdmin, registerPurchaseForUser);

// --- Admin review route ---
router.get("/reviews", authenticateJWT, isAdmin, getAllReviews);
router.get("/reviews/:id", authenticateJWT, isAdmin, getReviewById);
router.delete("/reviews/:id", authenticateJWT, isAdmin, deleteReview);

export default router;
