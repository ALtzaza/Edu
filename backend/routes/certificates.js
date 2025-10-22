import express from 'express';
import { Certificate, User, Course } from '../models/schema.models.js';

const router = express.Router();

const MOCK_USER_ID = "68f8761e956af1a115c4db62";
const MOCK_ADMIN_ID = "68f8916f956af1a115c4db7a";



router.get('/api/certificates/me', async (req, res) => {
    try {
        // (ในอนาคต: const userId = req.user._id;)
        const userId = MOCK_USER_ID; 

        const certificates = await Certificate.find({ user: userId })
            .populate('course', 'title instructor') // ดึง "title" และ "instructor" จาก Model 'Course'
            .populate('approvedBy', 'name'); // ดึง "name" จาก Model 'User' (ที่เป็น Admin)

        res.status(200).send(certificates);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});



// API:  (Admin) ออก Certificate ให้ User

router.post('/api/certificates', async (req, res) => {
    try {
        // เวลา Admin ออก Certificate, Admin ต้องระบุว่าให้ User คนไหน (userId)
        // และสำหรับ Course ไหน (courseId)
        const { userId, courseId } = req.body;
        
        // (ในอนาคต: const adminId = req.user._id;)
        const adminId = MOCK_ADMIN_ID; // 👈 Admin ที่กำลังกดอนุมัติ

        if (!userId || !courseId) {
            return res.status(400).json({ message: 'userId and courseId are required' });
        }

        // (ทางเลือก) ตรวจสอบว่าเคยออกให้ User/Course นี้ไปหรือยัง
        const existingCert = await Certificate.findOne({ user: userId, course: courseId });
        if (existingCert) {
            return res.status(409).json({ message: 'Certificate already exists for this user/course' });
        }

        // ‼️ ในระบบจริง: ตรงนี้ควรเป็น Logic สร้าง PDF และอัปโหลด 
        // ‼️ แต่สำหรับตอนนี้ เราจะสร้าง "Mock URL" ไปก่อน
        const mockUrl = `https://example.com/certs/generated/${userId}_${courseId}.pdf`;

        const newCertificate = new Certificate({
            user: userId,
            course: courseId,
            certificateUrl: mockUrl,
            approvedBy: adminId
            // issueDate จะเป็น Date.now() อัตโนมัติ
        });

        await newCertificate.save();
        res.status(201).send(newCertificate);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});



// API:(Admin) ดู Certificate ทั้งหมดที่ออกให้ Course นี้

router.get('/api/courses/:courseId/certificates', async (req, res) => {
    try {
        const { courseId } = req.params;

        // ค้นหา Certificate ทั้งหมดที่ "course" field ตรงกับ courseId
        const certificates = await Certificate.find({ course: courseId })
            .populate('user', 'name'); // ดึง "name" ของ User (นักเรียน)

        res.status(200).send(certificates);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});



// API:(Admin) "ยกเลิก/ลบ" Certificate

router.delete('/api/certificates/:certId', async (req, res) => {
    try {
        const { certId } = req.params;

        const deletedCert = await Certificate.findByIdAndDelete(certId);

        if (!deletedCert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        res.status(200).json({ message: 'Certificate deleted successfully' });

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});

export default router;