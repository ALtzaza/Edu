import { Router } from "express";

import { 
    Course, 
    Category, 
    User, 
    Section, 
    Lesson,  
    
    
} from "../models/schema.models.js";


import { mockAdmin } from "../middleware/mockAuth.js";

const router = Router();

// --- 1. GET /api/courses (หน้าร้านค้า - All Courses) ---

router.get("/", async (req, res) => {
  try {
    const { search, sort, minPrice, maxPrice, category } = req.query;
    const filter = {};

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
      case "newest":
      default:
        sortOption.createdAt = -1;
    }

    const courses = await Course.find(filter)
      .populate('category', 'name')
      .populate('instructor', 'name avatar')
      .sort(sortOption);

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
                    select: 'title'  // เอาแค่ "ชื่อ" Lesson มาแสดงเป็นสารบัญ
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
router.post("/", mockAdmin, async (req, res) => {
    try {
      
      const { 
        category, 
        title, 
        description, 
        thumbnail, 
        price, 
        difficulty 
      } = req.body;
  
      
      const instructorId = req.user.id; 
  
      
      if (!category || !title || !price) {
        return res.status(400).json({ success: false, message: "กรุณาส่ง category, title และ price" });
      }

      // 3. สร้างคอร์ส
      const newCourse = new Course({
        category,
        title,
        description,
        thumbnail,
        price,
        difficulty,
        instructor: instructorId, // ⬅ใส่ ID ของ Admin (Mock)
        sections: [] // ⬅ตอนสร้างครั้งแรก สารบัญยังว่าง
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
router.put("/:id", mockAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // รับข้อมูลทั้งหมดที่ Admin อาจจะแก้
        const { 
            category, 
            title, 
            description, 
            thumbnail, 
            price, 
            difficulty 
        } = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { category, title, description, thumbnail, price, difficulty },
            { new: true, runValidators: true } // {new: true} = ส่งข้อมูลใหม่กลับไป
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
router.delete("/:id", mockAdmin, async (req, res) => {
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


export default router;