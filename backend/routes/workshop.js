  import express from "express";
  import { Workshop, User, Course, Lesson, Progress } from "../models/schema.models.js";
  import multer from "multer";
  import { authenticateJWT, isEnrolled } from "../middleware/authMiddleware.js";
  import { isAdmin } from "../middleware/roleMiddleware.js";

  const router = express.Router();

  // --- Multer Storage ---
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage });

  // ------------------
  // GET ALL WORKSHOPS (Admin)
  // ------------------
  router.get("/", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const workshops = await Workshop.find({})
        .populate("user", "username name email")
        .populate("course", "title")
        .populate("lesson", "title")
        .populate({
          path: "lesson", // 1. ดึงข้อมูล lesson
          select: "title section", // 2. เอาแค่ title และ field 'section' (ที่อยู่ใน lesson)
          populate: {
            path: "section", // 3. ดึงข้อมูล section ที่อยู่ใน lesson อีกที
            select: "title" // 4. เอาแค่ title ของ section
          }
        });

      // เพิ่ม downloadUrl เต็ม
      const workshopsWithUrl = workshops.map(w => ({
        ...w.toObject(),
        downloadUrl: w.fileUrl
          ? `http://localhost:3000/uploads/${w.fileUrl}`
          : null,
        userName: w.user ? (w.user.name || w.user.email) : "Unknown"
      }));

      res.status(200).send({ workshops: workshopsWithUrl });
    } catch (error) {
      res.status(500).send({ message: "Server Error", error: error.message });
    }
  });

  // ------------------
  // Upload Workshop (Student)
  // ------------------
  router.post(
    "/:courseId/lessons/:lessonId/workshops",
    upload.single("workshopFile"),
    authenticateJWT,
    isEnrolled,
    async (req, res) => {
      try {
        const { courseId, lessonId } = req.params;
        const userId = req.user._id;

        console.log("Saving workshop for User ID:", userId, "User object:", req.user);

        if (!req.file) {
          console.error("USER ID IS MISSING. CANNOT SAVE WORKSHOP.");
          return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = req.file.filename;

        let workshop = await Workshop.findOne({
          user: userId,
          course: courseId,
          lesson: lessonId,
        });

        if (workshop) {
          if (workshop.status === "approved") {
            return res
              .status(400)
              .json({ message: "Workshop already approved. Cannot resubmit." });
          }
          workshop.fileUrl = fileUrl;
          workshop.status = "pending";
          workshop.submittedAt = Date.now();
          workshop.feedback = null;
          workshop.reviewedAt = null;
          await workshop.save();
          workshop.downloadUrl = `http://localhost:3000/uploads/${workshop.fileUrl}`;
          res.status(200).send(workshop);
        } else {
          const newWorkshop = new Workshop({
            user: userId,
            course: courseId,
            lesson: lessonId,
            fileUrl: fileUrl,
          });
          await newWorkshop.save();
          newWorkshop.downloadUrl = `http://localhost:3000/uploads/${newWorkshop.fileUrl}`;
          res.status(201).send(newWorkshop);
        }
      } catch (error) {
        res.status(500).send({ message: "Server Error", error: error.message });
      }
    }
  );

  // ------------------
  // Get Workshop (Student, by lesson)
  // ------------------
  router.get("/:courseId/lessons/:lessonId/workshops/me", authenticateJWT, isEnrolled, async (req, res) => {
    try {
      const { courseId, lessonId } = req.params;
      const userId = req.user._id;

      const workshop = await Workshop.findOne({
        user: userId,
        course: courseId,
        lesson: lessonId,
      })
        .populate("course", "title")
        .populate("lesson", "title");

      if (workshop) {
        workshop.downloadUrl = `http://localhost:3000/uploads/${workshop.fileUrl}`;
      }

      res.status(200).send({ success: true, data: workshop });
    } catch (error) {
      console.error("Error fetching user workshop:", error);
      res.status(500).send({ message: "Server Error", error: error.message });
    }
  });

  // ------------------
  // Get all workshops for a student
  // ------------------
  router.get("/me", authenticateJWT, isEnrolled, async (req, res) => {
    try {
      const userId = req.user._id;

      const workshops = await Workshop.find({ user: userId })
        .populate("course", "title")
        .populate("lesson", "title")
        .populate("user", "username name email");

      const workshopsWithUrl = workshops.map(w => ({
        ...w.toObject(),
        downloadUrl: w.fileUrl
          ? `http://localhost:3000/uploads/${w.fileUrl}`
          : null,
        userName: w.user ? (w.user.name || w.user.email) : "Unknown"
      }));

      res.status(200).send(workshopsWithUrl);
    } catch (error) {
      res.status(500).send({ message: "Server Error", error: error.message });
    }
  });

  // ------------------
  // Review Workshop (Admin)
  // ------------------
  router.put("/:workshopId/review", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const { workshopId } = req.params;
      const { feedback, status } = req.body;

      if (!feedback || !status) {
        return res
          .status(400)
          .json({ message: "feedback and status are required" });
      }
      if (!["approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ message: 'Invalid status. Must be "approved" or "rejected".' });
      }

      const workshop = await Workshop.findById(workshopId);
      if (!workshop) return res.status(404).json({ message: "Workshop not found" });

      workshop.feedback = feedback;
      workshop.status = status;
      workshop.reviewedAt = Date.now();
      await workshop.save();

      // ⭐️ Update progress if approved
      if (status === "approved") {
        const { user, course, lesson } = workshop;

        // --- 🟢 START FIX #2: ป้องกันข้อมูลกำพร้า (Orphaned Data) ---
        // ⭐️⭐️⭐️ ส่วนที่ขาดไปคือตรงนี้ ⭐️⭐️⭐️
        // ถ้า workshop นี้ไม่มี user, course, หรือ lesson (ข้อมูลเก่า/ผิดพลาด)
        // ให้ออกจากฟังก์ชันนี้ไปเลย เพื่อไม่ให้โค้ดพัง
        if (!user || !course || !lesson) {
          console.warn(`Workshop [${workshop._id}] has missing data (user, course, or lesson) and cannot update progress.`);
          
          // ตั้งค่า downloadUrl แล้วส่งกลับไป (เหมือนโค้ดปกติ)
          workshop.downloadUrl = workshop.fileUrl
            ? `http://localhost:3000/uploads/${workshop.fileUrl}`
            : null;
          return res.status(200).send(workshop); // ⭐️ ออกจากฟังก์ชันตรงนี้
        }
        // --- 🟢 END FIX #2 ---


        let progress = await Progress.findOne({ user, course });
        
        if (!progress) {
          // (โค้ดส่วนนี้ปลอดภัยแล้ว เพราะเราเช็ค course แล้ว)
          const parentCourse = await Course.findById(course).populate({
            path: 'sections',
            populate: { path: 'lessons' }
          });

          let totalLessons = 0;
          if (parentCourse && parentCourse.sections) {
            parentCourse.sections.forEach(section => {
              if (section.lessons) totalLessons += section.lessons.length;
            });
          }

          progress = new Progress({
            user,
            course,
            totalLessons: totalLessons || 1, // ป้องกันการหารด้วย 0 ตั้งแต่ตอนสร้าง
            lessonsCompleted: [lesson]
          });
          await progress.save();
        } else {
          await Progress.updateOne(
            { _id: progress._id },
            { $addToSet: { lessonsCompleted: lesson } }
          );
          progress = await Progress.findById(progress._id);
        }

        // --- 🟢 START FIX #1: ป้องกันการหารด้วยศูนย์ (จากครั้งที่แล้ว) ---
        if (progress.totalLessons && progress.totalLessons > 0) {
          progress.percentage = (progress.lessonsCompleted.length / progress.totalLessons) * 100;
        } 
        else if (progress.lessonsCompleted.length > 0) {
          progress.totalLessons = progress.lessonsCompleted.length;
          progress.percentage = 100;
        } 
        else {
          progress.percentage = 0;
        }
        // --- 🟢 END FIX #1 ---

        if (progress.percentage > 100) progress.percentage = 100;
        await progress.save();
      }

      workshop.downloadUrl = workshop.fileUrl
        ? `http://localhost:3000/uploads/${workshop.fileUrl}`
        : null;

      res.status(200).send(workshop);
    } catch (error) {
      res.status(500).send({ message: "Server Error", error: error.message });
    }
  });

  // ------------------
  // Delete Workshop (Admin)
  // ------------------
  router.delete("/:workshopId", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const { workshopId } = req.params;

      const deletedWorkshop = await Workshop.findByIdAndDelete(workshopId);
      if (!deletedWorkshop) return res.status(404).json({ message: "Workshop not found" });

      res.status(200).json({ message: "Workshop deleted successfully" });
    } catch (error) {
      res.status(500).send({ message: "Server Error", error: error.message });
    }
  });

  export default router;
