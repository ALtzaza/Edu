import express from "express";
import { Quiz, QuizResult, Lesson } from "../models/schema.models.js";

const router = express.Router();

// API สำหรับ "สร้าง Quiz ใหม่สำหรับบทเรียน"
router.post("/api/lesson/number/:lessonNum/quizzes", async (req, res) => {
  try {
    const { lessonNum } = req.params; // รับเลข 1, 2, 3...

    const lesson = await Lesson.findOne({ lessonNumber: lessonNum });

    if (!lesson) {
      return res
        .status(404)
        .json({ message: "Lesson not found with that number" });
    }

    const { question, choices, correctAnswer } = req.body;
    if (!question || !choices || !correctAnswer) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newQuiz = new Quiz({
      lesson: lesson._id,
      lessonNum,
      question,
      choices,
      correctAnswer,
    });

    await newQuiz.save();
    res.status(201).send(newQuiz);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// API สำหรับ "ดึง Quiz ทั้งหมดของบทเรียน"
router.get("/api/lessons/:lessonNum/quizzes", async (req, res) => {
  try {
    const { lessonNum } = req.params;
    const lesson = await Lesson.findOne({ lessonNumber: lessonNum });
    if (!lesson) {
      return res
        .status(404)
        .json({ message: "Lesson not found with that number" });
    }
    const quizzes = await Quiz.find({ lesson: lesson._id });
    res.status(200).send(quizzes);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

router.put("/api/quizzes/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question, choices, correctAnswer, lessonNum } = req.body;
    const updateFields = {};

    if (question) updateFields.question = question;
    if (choices) updateFields.choices = choices;
    if (correctAnswer) updateFields.correctAnswer = correctAnswer;
    if (lessonNum) updateFields.lessonNum = lessonNum;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      updateFields,
      { new: true } // เพื่อส่งกลับข้อมูลที่อัปเดตแล้ว
    );
    if (!updatedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.status(200).send(updatedQuiz);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

router.delete("/api/quizzes/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const deletedQuiz = await Quiz.findByIdAndDelete(quizId);
    if (!deletedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

//API สำหรับการทำแบบทดสอบ (Taking the Quiz)

// สำหรับ "นักเรียน" (ซ่อนเฉลย)
router.get("/api/lessons/:lessonNum/quizzes/take", async (req, res) => {
  try {
    const { lessonNum } = req.params;
    const lesson = await Lesson.findOne({ lessonNumber: lessonNum });
    if (!lesson) {
      return res
        .status(404)
        .json({ message: "Lesson not found with that number" });
    }

    // ใช้วิธีเดียวกัน แต่เพิ่ม .select() เข้าไป
    const quizzes = await Quiz.find({ lesson: lesson._id }).select(
      "-correctAnswer"
    );

    // quizzes ที่ส่งกลับไปจะ "ไม่มี" field correctAnswer
    res.status(200).send(quizzes);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

const MOCK_USER_ID = "68f8c33e74d745e38e7bdf7d";

router.post("/api/lessons/:lessonNum/quizzes/submit", async (req, res) => {
  try {
    const { lessonNum } = req.params;

    const { answers } = req.body; // e.g., [{ quizNumber: 1, selectedAnswer: "A" }]

    const lesson = await Lesson.findOne({ lessonNumber: lessonNum });
    if (!lesson) {
      return res
        .status(404)
        .json({ message: "Lesson not found with that number" });
    }
    const quizzes = await Quiz.find({ lesson: lesson._id });

    let score = 0;
    quizzes.forEach((quiz) => {
      // ‼️ โค้ดของคุณหา key ชื่อ "quizNumber" (เลข 1, 2, 3) ‼️
      const userAnswer = answers.find((a) => a.quizNumber == quiz.quizNumber);
      if (userAnswer && userAnswer.selectedAnswer === quiz.correctAnswer) {
        score++;
      }
    });

    const newQuizResult = new QuizResult({
      user: MOCK_USER_ID,
      lesson: lesson._id,
      lessonNum: lessonNum,
      score,
      total: quizzes.length,
    });
    await newQuizResult.save();

    res.status(200).send({
      message: "Quiz submitted successfully",
      score,
      total: quizzes.length,
    });
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

export default router;
