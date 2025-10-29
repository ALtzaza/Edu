import express from "express";
import { Quiz, QuizResult, Lesson } from "../models/schema.models.js";

const router = express.Router();

const populateQuizDetails = (query) => {
  return query.populate({
    path: "lesson", // Field ที่จะ populate ใน Quiz model
    select: "title course section", // เลือก field ที่ต้องการจาก Lesson
    populate: [
      // Populate ซ้อนกัน
      {
        path: "course", // Field ที่จะ populate ใน Lesson model
        select: "title instructor", // เลือก field ที่ต้องการจาก Course
      },
      {
        path: "section", // Field ที่จะ populate ใน Lesson model
        select: "title", // เลือก field ที่ต้องการจาก Section
      },
    ],
  });
};

// API สำหรับ "สร้าง Quiz ใหม่สำหรับบทเรียน"
router.post("/api/lessons/:lessonId/quizzes", async (req, res) => {
  try {
    const { lessonId } = req.params; // รับ ObjectId ของ Lesson // 1. ค้นหา Lesson ด้วย ObjectId

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found with that ID" });
    } // 3. รับข้อมูล Quiz จาก body

    const { question, choices, correctAnswer } = req.body;
    if (!question || !choices || !correctAnswer) {
      return res.status(400).json({
        message: "Missing required fields: question, choices, correctAnswer",
      });
    }

    //  (เพิ่ม) Logic ใหม่: นับจำนวน Quiz ที่มีอยู่แล้วใน Lesson นี้
    // (เราใช้ .countDocuments เพื่อความรวดเร็ว)
    const existingQuizCount = await Quiz.countDocuments({ lesson: lesson._id });
    const nextQuizNumber = existingQuizCount + 1; // 0+1=1, 1+1=2, ... // 4. สร้าง Quiz ใหม่

    const newQuiz = new Quiz({
      lesson: lesson._id, // ใช้ ObjectId ของ Lesson
      question,
      choices,
      correctAnswer,
      quizNumber: nextQuizNumber, // ⬅ (เพิ่ม) ใส่เลขที่นับได้
    });
    await newQuiz.save(); // 5. ‼️ (ที่แก้ไขครั้งก่อน) อัปเดต Lesson: "push" ID ของ Quiz ใหม่เข้าไปใน Array 'quizzes' ‼️

    lesson.quizzes.push(newQuiz._id);
    await lesson.save(); // 6. Populate ข้อมูลก่อนส่งกลับ

    const populatedQuiz = await populateQuizDetails(Quiz.findById(newQuiz._id));
    res.status(201).send(populatedQuiz); // ส่ง Quiz ที่สร้างเสร็จ
  } catch (error) {
    // เพิ่ม Error Handling สำหรับ ObjectId ผิด Format
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Lesson ID format" });
    }
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// API สำหรับ "ดึง Quiz ทั้งหมดของบทเรียน"
//  (แก้ไข) เปลี่ยนจาก /:lessonNum เป็น /:lessonId
router.get("/api/lessons/:lessonId/quizzes", async (req, res) => {
  try {
    //  (แก้ไข) เปลี่ยนจาก lessonNum เป็น lessonId
    const { lessonId } = req.params;
    //  (แก้ไข) เปลี่ยนจาก findOne({ lessonNumber: ... }) เป็น findById()
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return (
        res
          .status(404)
          //  (แก้ไข) อัปเดตข้อความ Error
          .json({ message: "Lesson not found with that ID" })
      );
    }
    //  (แก้ไข) เปลี่ยนจาก lesson: lesson._id เป็น lesson: lessonId
    const quizzes = await Quiz.find({ lesson: lessonId });
    res.status(200).send(quizzes);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Lesson ID format" });
    }
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

router.put("/api/quizzes/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question, choices, correctAnswer } = req.body; //  ลบ lessonNum ออก
    const updateFields = {};

    if (question) updateFields.question = question;
    if (choices) updateFields.choices = choices;
    if (correctAnswer) updateFields.correctAnswer = correctAnswer;
    //  ไม่ควรอัปเดต lessonNum หรือ quizNumber ที่นี่

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

    //  (สำคัญมาก) เมื่อลบ Quiz ต้องดึง ID ออกจาก Array 'quizzes' ใน Lesson ด้วย
    await Lesson.findByIdAndUpdate(
      deletedQuiz.lesson, //  หา Lesson จาก ID ที่อยู่ใน Quiz ที่เพิ่งลบ
      { $pull: { quizzes: deletedQuiz._id } } //  สั่ง $pull (ดึงออก)
    );

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
        .status(404) //  (แก้ไข) 4OF -> 404
        .json({ message: "Lesson not found with that number" });
    } // ใช้วิธีเดียวกัน แต่เพิ่ม .select() เข้าไป

    const quizzes = await Quiz.find({ lesson: lesson._id }).select(
      "-correctAnswer"
    ); // quizzes ที่ส่งกลับไปจะ "ไม่มี" field correctAnswer

    res.status(200).send(quizzes);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message }); //  (แก้ไข) 's res.status' -> 'res.status'
  }
});

const MOCK_USER_ID = "68fb69f249ed00d001f1d029";

// (API /submit นี้ใช้ quizId อยู่แล้ว ซึ่งถูกต้อง ไม่ต้องแก้ครับ)
router.post("/api/lessons/:lessonId/quizzes/submit", async (req, res) => {
  try {
    const { lessonId } = req.params;

    const { answers } = req.body; // e.g., [{ quizId: "60f123...", selectedAnswer: "A" }]

    const lesson = await Lesson.findById( lessonId);
    if (!lesson) {
      return res
        .status(404)
        .json({ message: "Lesson not found with that ID" });
    }
    const quizzes = await Quiz.find({ lesson: lessonId });

    let score = 0;
    quizzes.forEach((quiz) => {
      //  ใช้ quiz._id.toString() (ซึ่งถูกต้องอยู่แล้ว)
      const userAnswer = answers.find((a) => a.quizId == quiz._id.toString());
      if (userAnswer && userAnswer.selectedAnswer === quiz.correctAnswer) {
        score++;
      }
    });

    const newQuizResult = new QuizResult({
      user: MOCK_USER_ID,
      lesson: lessonId,
      score,
      total: quizzes.length,
    });
    await newQuizResult.save();
    res.status(201).send(newQuizResult);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

export default router;
