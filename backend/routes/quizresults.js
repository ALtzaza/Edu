import express from 'express';
import {Quiz, QuizResult, Lesson } from '../models/schema.models.js';

const router = express.Router();

const MOCK_USER_ID = "68f8c33e74d745e38e7bdf7d"
//ดูผลสอบ ของตัวเอง ในบทเรียนนั้นๆ (สำหรับนักเรียน)
router.get('/api/lessons/:lessonNum/results/me', async (req, res) => {
    try {
        // 2.  ใช้ ID จำลองไปก่อน จนกว่าระบบ Login จะเสร็จ
        const userId = MOCK_USER_ID; // แก้จาก req.user._id เป็น ID จำลอง
        const { lessonNum } = req.params;

        // 3.  ค้นหา Lesson B' _id ก่อน 
        const lesson = await Lesson.findOne({ lessonNumber: lessonNum });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // 4.  ใช้ "lesson._id" ในการค้นหา (ไม่ใช่ lessonNum) 
        const quizResults = await QuizResult.find({ 
            user: userId, 
            lesson: lesson._id 
        });
        
        res.status(200).send(quizResults);

    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});

//ดูประวัติการทำแบบทดสอบทั้งหมด ของตัวเอง (สำหรับนักเรียน)
router.get('/api/quizresults/me', async (req, res) => {
    try {
        // 2.  ใช้ ID จำลองไปก่อน จนกว่าระบบ Login จะเสร็จ
        const userId = MOCK_USER_ID; // แก้จาก req.user._id เป็น ID จำลอง
        const quizResults = await QuizResult.find({ user: userId });
        res.status(200).send(quizResults);
    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});


// ดูผลสอบ ของนักเรียนทุกคน ในบทเรียนนั้น (สำหรับครู/Admin)
router.get('/api/lessons/:lessonNum/results' , async (req, res) => {
    try {
        const { lessonNum } = req.params;

        const lesson = await Lesson.findOne({ lessonNumber: lessonNum });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const quizResults = await QuizResult.find({ lesson: lesson._id }).populate('user', 'name email');
        res.status(200).send(quizResults);
    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});

//ดูผลสอบทั้งหมด ของนักเรียนคนเดียว (สำหรับครู/Admin)
router.get('/api/users/:userId/results', async (req, res) => {
    try {
        const { userId } = req.params;
        const quizResults = await QuizResult.find({ user: userId }).populate('lesson', 'title lessonNumber');
        res.status(200).send(quizResults);
    } catch (error) {
        res.status(500).send({ message: 'Server Error', error: error.message });
    }
});

export default router;