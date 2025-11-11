
import { Router } from "express";
import { Section, Course, Lesson } from "../models/schema.models.js"; 


import { authenticateJWT, isEnrolled } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
// import { verifyToken } from "../middleware/verifyToken.js";
// import { isAdmin } from "../middleware/isAdmin.js"; 

const router = Router();


router.post("/", authenticateJWT, isAdmin, async (req, res) => {

  try {
    const { title, courseId } = req.body;
    if (!title || !courseId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง title และ courseId" });
    }
    const parentCourse = await Course.findById(courseId);
    if (!parentCourse) {
      return res.status(404).json({ success: false, message: "ไม่พบคอร์ส" });
    }
    const newSection = new Section({
      title,
      course: courseId,
      lessons: []
    });
    await newSection.save();
    parentCourse.sections.push(newSection._id);
    await parentCourse.save();
    res.status(201).json({
      success: true,
      message: "สร้าง Section ใหม่สำเร็จ",
      data: newSection,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.put("/:sectionId", authenticateJWT, isAdmin, async (req, res) => {
  
  try {
    const { title } = req.body;
    const { sectionId } = req.params;
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { title: title },
      { new: true }
    );
    if (!updatedSection) {
      return res.status(404).json({ success: false, message: "ไม่พบ Section" });
    }
    res.json({ success: true, message: "อัปเดต Section สำเร็จ", data: updatedSection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.delete("/:sectionId" ,authenticateJWT, isAdmin, async (req, res) => {
  
    try {
        const { sectionId } = req.params;
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ success: false, message: "ไม่พบ Section" });
        }
        await Course.findByIdAndUpdate(section.course, {
            $pull: { sections: sectionId }
        });
        await Lesson.deleteMany({ section: sectionId });
        await Section.findByIdAndDelete(sectionId);
        res.json({ success: true, message: "ลบ Section (และ Lesson ทั้งหมด) สำเร็จ" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


router.get("/", authenticateJWT,isEnrolled, async (req, res) => {
 
  try {
    const { courseId } = req.query;
    if (!courseId) {
        return res.status(400).json({ success: false, message: "กรุณาส่ง courseId" });
    }
    const sections = await Section.find({ course: courseId })
      .populate('lessons', 'title videoUrl');
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;