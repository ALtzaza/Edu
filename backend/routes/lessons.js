// routes/lessons.js
import express from 'express';
import { Lesson } from '../models/schema.models.js';

const router = express.Router();

// API สำหรับ "สร้างบทเรียน"
router.post('/api/lessons', async (req, res) => {
  try {
    const { title, courseId } = req.body; // สมมติว่าส่ง title กับ courseId มา

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newLesson = new Lesson({
      title,
      course: courseId // (จะเป็น null ก็ได้ ถ้ายังไม่มี Course)
    });

    await newLesson.save();
    res.status(201).send(newLesson); // ส่ง Lesson ที่สร้างเสร็จกลับไป

  } catch (error) {
    res.status(500).send({ message: 'Server Error', error: error.message });
  }
});

export default router;