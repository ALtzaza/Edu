import { Router } from "express";
import { Category } from "../models/schema.models.js";

import { mockAdmin } from "../middleware/mockAuth.js";


// import { verifyToken } from "../middleware/verifyToken.js";
// import { isAdmin } from "../middleware/isAdmin.js"; 

const router = Router();



router.get("/", async (req, res) => {
    try {
      const { search, sort } = req.query;
      const filter = {};
  
      if (search) {
        filter.name = new RegExp(search, "i"); 
      }
  
      let sortOption = {};
      switch (sort) {
        case "title_asc":
          sortOption.name = 1; // A-Z
          break;
        case "title_desc":
          sortOption.name = -1; // Z-A
          break;
        case "newest":
          sortOption.createdAt = -1;
          break;

        case "oldest":
          sortOption.createdAt = 1;
          break;
        default:
          sortOption.createdAt = -1; // 
      }
  
      const categories = await Category.find(filter).sort(sortOption);
  
      res.json({
        success: true,
        message: "ดึงหมวดหมู่สำเร็จ",
        data: categories,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });



// --- 2. POST /api/categories (เพิ่ม - Admin) ---
router.post("/", mockAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "กรุณาระบุชื่อหมวดหมู่" });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: "มีหมวดหมู่นี้อยู่แล้ว" });
    }

    const category = await Category.create({ name, description });
    res.status(201).json({
      success: true,
      message: "เพิ่มหมวดหมู่สำเร็จ",
      data: category
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// --- 3. PUT /api/categories/:id (อัปเดต - Admin) ---

router.put("/:id", mockAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true } //ส่งข้้อมูลใหม่กลับไป
    );

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "ไม่พบหมวดหมู่" });
    }

    res.json({
      success: true,
      message: "อัปเดตหมวดหมู่สำเร็จ",
      data: updatedCategory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// --- 4. DELETE /api/categories/:id (ลบ - Admin) ---

router.delete("/:id", mockAdmin, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "ไม่พบหมวดหมู่" });
    }
    
    
    res.json({
      success: true,
      message: `ลบหมวดหมู่ "${deleted.name}" สำเร็จ`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


export default router;