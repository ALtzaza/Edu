import { Router } from "express";

import { 
    Course, 
    Category, 
    User, 
    Section, 
    Lesson,
    Review,
    Progress,
    Purchase,
    Certificate  
    
} from "../models/schema.models.js";
import multer from "multer";
import path from "path";
import fs from 'fs';

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = Router();
const uploadDir = 'uploads/thumbnails/';

fs.mkdirSync(uploadDir, { recursive: true });

// ⭐️ 4. (แก้ไข) ตั้งค่า 'multer'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // ⬅️ (ใช้ 'uploadDir' (V16))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `thumb_${Date.now()}${ext}`);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.get("/", async (req, res) => {
    try {
      // 1. (ถูกต้อง) รับ limit มา
      const { search, sort, minPrice, maxPrice, category, limit } = req.query;
      const filter = {};
  
      // ... (Filter logic ... ถูกต้อง)
      if (search) {
        filter.title = new RegExp(search, "i"); 
      }
      if (category) {
        filter.category = category;
      }
      const priceFilter = {};
      if (minPrice) {
        priceFilter.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        priceFilter.$lte = parseFloat(maxPrice);
      }
      if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
      }
  
      // ... (Sort logic ... ถูกต้อง)
      let sortOption = {};
      switch (sort) {
        case "title_asc":
          sortOption.title = 1;
          break;
        case "title_desc":
          sortOption.title = -1;
          break;
        case "price_asc":
          sortOption.price = 1;
          break;
        case "price_desc":
          sortOption.price = -1;
          break;
        case "rating_desc": 
          sortOption.averageRating = -1;
          break;
        case "newest":
        default:
          sortOption.createdAt = -1;
      }
  
      // ⭐️ 2. (แก้ไข) เพิ่ม .limit() ⭐️
      
      // (เราต้องสร้าง Query ขึ้นมาก่อน)
      let query = Course.find(filter)
        .populate('category', 'name')
        .populate('instructor', 'name avatar')
        .sort(sortOption);
  
      // (ถ้า Frontend ส่ง 'limit' มา)
      if (limit) {
        // (parseInt = แปลง "2" (String) เป็น 2 (Number))
        query = query.limit(parseInt(limit)); 
      }
  
      // (สั่ง Query ทำงาน)
      const courses = await query; 
  
      res.json({
        success: true,
        message: `พบ ${courses.length} คอร์ส`,
        data: courses,
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });


// GET /api/courses/:id (หน้า Course Detail) ---

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id)
            
            .populate({
                path: 'sections', // 1. ดึง Sections
                populate: {
                    path: 'lessons', // 2. ดึง Lessons ที่อยู่ในแต่ละ Section
                    select: 'title type quizzes'  // เอาแค่ "ชื่อ" Lesson มาแสดงเป็นสารบัญ
                }
            })
            .populate('category', 'name')
            .populate('instructor', 'name avatar bio'); // ดึง bio เพิ่ม

        if (!course) {
            return res.status(404).json({ success: false, message: "ไม่พบคอร์ส" });
        }
        
        // ( Review/Rating มาคำนวณเพิ่มตรงนี้)

        res.json({ success: true, data: course });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// --- 3. POST /api/courses (สร้างคอร์สใหม่ - Admin) ---
router.post("/", authenticateJWT, isAdmin, upload.single("thumbnail"), async (req, res) => {
    try {
      const { 
        category, title, description, price, difficulty 
      } = req.body; 
      
      const instructorId = req.user.id; 
  
      if (!category || !title || !price) {
        return res.status(400).json({ success: false, message: "กรุณาส่ง category, title และ price" });
      }

      let thumbnailUrl = null;
      if (req.file) {
        thumbnailUrl = req.file.path.replace(/\\/g, "/"); 
      }

      const newCourse = new Course({
        category,
        title,
        description,
        thumbnail: thumbnailUrl, 
        price,
        difficulty,
        instructor: instructorId,
        sections: [] 
      });
  
      await newCourse.save();
      res.status(201).json({ 
        success: true, 
        message: "สร้างคอร์สสำเร็จ",
        data: newCourse 
      });
      
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });


// --- 4. PUT /api/courses/:id (อัปเดตคอร์ส - Admin) ---
router.put("/:id", authenticateJWT, isAdmin, upload.single("thumbnail"), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            category, title, description, price, difficulty 
        } = req.body;

        const updateData = { 
            category, title, description, price, difficulty 
        };

        if (req.file) {
            updateData.thumbnail = req.file.path.replace(/\\/g, "/");
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            updateData, 
            { new: true, runValidators: true } 
        );

        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: "ไม่พบคอร์ส" });
        }
        res.json({ 
            success: true, 
            message: "อัปเดตคอร์สสำเร็จ", 
            data: updatedCourse 
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// --- 5. DELETE /api/courses/:id (ลบคอร์ส - Admin) ---
router.delete("/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: "ไม่พบคอร์ส" });
        }

        
        
        await Section.deleteMany({ course: id });
        
        
        await Lesson.deleteMany({ course: id });

      
        await Review.deleteMany({ course: id });
        await Progress.deleteMany({ course: id });
        await Purchase.deleteMany({ course: id });
       

        // 4. ลบคอร์ส (แม่) ทิ้ง
        await Course.findByIdAndDelete(id);

        res.json({ success: true, message: "ลบคอร์สและข้อมูลที่เกี่ยวข้องทั้งหมดสำเร็จ" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API:(Admin) ดู Certificate ทั้งหมดที่ออกให้ Course นี้
router.get("/:courseId/certificates", async (req, res) => {
  try {
    const { courseId } = req.params;

    // ค้นหา Certificate ทั้งหมดที่ "course" field ตรงกับ courseId
    const certificates = await Certificate.find({ course: courseId }).populate(
      "user",
      "name"
    ); // ดึง "name" ของ User (นักเรียน)

    res.status(200).send(certificates);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

export default router;