import express from 'express';
// (อย่าลืม import Model ให้ครบ)
import { Workshop, User, Course } from '../models/schema.models.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// --- ตั้งค่า Multer Storage ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // เก็บในโฟลเดอร์ uploads
  },
  filename: function (req, file, cb) {
    // ใช้ "วันที่-ชื่อไฟล์เดิม.นามสกุล"
    cb(null, Date.now() + '-' + file.originalname); 
  }
});


const upload = multer({ storage: storage });

// --- ID จำลอง (Mock IDs) ---
// (ใช้ ID ที่คุณมีในฐานข้อมูล)
const MOCK_USER_ID = "68f8c33e74d745e38e7bdf7d"; // (ID ของนักเรียน)
const MOCK_ADMIN_ID = "660000000000000000000001"; // (ID ของ Admin/ผู้สอน)


// ---------------------------------------------------
// API:  (นักเรียน) "ส่งงาน" หรือ "ส่งงานแก้"
// ---------------------------------------------------
router.post('/api/courses/:courseId/workshops', upload.single('workshopFile'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = MOCK_USER_ID; // (ในอนาคต: req.user._id)

    if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = req.file.filename;

        // ตรวจสอบว่าเคยส่งงานนี้หรือยัง
        let workshop = await Workshop.findOne({ user: userId, course: courseId });

        if (workshop) {
            // ถ้าเคยส่งแล้ว และงาน "ผ่าน" (approved) แล้ว -> ส่งซ้ำไม่ได้
            if (workshop.status === 'approved') {
                return res.status(400).json({ message: 'Workshop already approved. Cannot resubmit.' });
            }
            
            // ถ้าเคยส่งแล้ว (แต่ยังไม่ผ่าน) -> ให้อัปเดตไฟล์ (ส่งซ้ำ)
            workshop.fileUrl = fileUrl;
            workshop.status = 'pending'; // ตั้งสถานะเป็น "รอตรวจ" ใหม่
            workshop.submittedAt = Date.now();
            workshop.feedback = null; // ล้าง feedback เก่า
            workshop.reviewedAt = null;
            await workshop.save();
            res.status(200).send(workshop); // ส่ง 200 OK (เพราะเป็นการอัปเดต)

        } else {
            // ถ้ายังไม่เคยส่ง -> สร้างใหม่
            const newWorkshop = new Workshop({
                user: userId,
                course: courseId,
                fileUrl: fileUrl
                // status: 'pending' (อัตโนมัติ)
            });
            await newWorkshop.save();
            res.status(201).send(newWorkshop); // ส่ง 201 Created (เพราะสร้างใหม่)
        }

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});

// ---------------------------------------------------
// API:  (นักเรียน) ดู Workshop ทั้งหมดของตัวเอง
// ---------------------------------------------------
router.get('/api/workshops/me', async (req, res) => {
    try {
        const userId = MOCK_USER_ID; 

        const workshops = await Workshop.find({ user: userId })
            .populate('course', 'title'); // ดึง "title" ของ Course มาแสดง

        res.status(200).send(workshops);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});


// ---------------------------------------------------
// API: (Admin) ดู Workshop ทั้งหมดใน Course
// (สามารถกรองสถานะได้ เช่น /workshops?status=pending)
// ---------------------------------------------------
router.get('/api/courses/:courseId/workshops', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { status } = req.query; // รับ status จาก query string (e.g., ?status=pending)

        // สร้างตัวกรอง (Filter)
        const filter = { course: courseId };
        if (status) {
            filter.status = status;
        }

        const workshops = await Workshop.find(filter)
            .populate('user', 'name'); // ดึง "name" ของนักเรียน

        res.status(200).send(workshops);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});

// ---------------------------------------------------
// API: (Admin) "ตรวจงาน" (ให้ Feedback และ Status)
// ---------------------------------------------------
router.put('/api/workshops/:workshopId/review', async (req, res) => {
    try {
        const { workshopId } = req.params;
        const { feedback, status } = req.body;
        // const adminId = MOCK_ADMIN_ID; // (เก็บไว้เผื่อต้องใช้)

        if (!feedback || !status) {
            return res.status(400).json({ message: 'feedback and status are required' });
        }
        if (!['approved', 'rejected'].includes(status)) {
             return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
        }

        const updatedWorkshop = await Workshop.findByIdAndUpdate(
            workshopId,
            {
                feedback: feedback,
                status: status,
                reviewedAt: Date.now()
            },
            { new: true } // {new: true} เพื่อส่งข้อมูลที่อัปเดตแล้วกลับไป
        );

        if (!updatedWorkshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }

        res.status(200).send(updatedWorkshop);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});


// ---------------------------------------------------
// API: (Admin) "ลบ" Workshop (เผื่อนักเรียนส่งสแปม)
// ---------------------------------------------------
router.delete('/api/workshops/:workshopId', async (req, res) => {
    try {
        const { workshopId } = req.params;

        const deletedWorkshop = await Workshop.findByIdAndDelete(workshopId);

        if (!deletedWorkshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }
        
        res.status(200).json({ message: 'Workshop deleted successfully' });

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});


export default router;