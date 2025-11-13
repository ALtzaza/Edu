// server.js (ฉบับ V29 - แก้บั๊ก 404/E11000/Hang)

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';



// ⭐️ 1. (แก้ไข) Import ให้ถูกต้อง
import categoryRoutes from "./routes/categories.js";
import courseRoutes from "./routes/courses.js";
import sectionRouter from "./routes/section.js"; 
// ⭐️ (สำคัญ!) "ใช้" 'lesson.js' (V16) (ตัวแก้บั๊ก E11000)
import lessonRouter from "./routes/lesson.js"; // ⬅️ (เอกพจน์)
import progressRoutes from "./routes/progresses.js";
import notificationRoutes from "./routes/notificates.js";

// (Import V1 ที่เหลือ)
import quiz from './routes/quizzes.js';
// ⭐️ (ลบ 'import lesson' (V1) ที่ "ซ้ำ" ทิ้ง)
import quizresults from './routes/quizresults.js';
import certificateRoutes from './routes/certificates.js';
import workShopRoutes from './routes/workshop.js';
import userRoutes from './routes/users.js';
import reviewRoutes from './routes/reviews.js';
import purchaseRoutes from './routes/purchases.js';
import adminRoutes from "./routes/admin.js";

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;
if (!MONGO_URI) { /* ... (Error) ... */ }

const app = express();

// ⭐️ 2. (CORS V21)
const corsOptions = {
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"] 
};
// (Logger V27)
app.use((req, res, next) => {
  console.log(`--- LOGGER: ได้รับ ${req.method} Request มาที่: ${req.originalUrl} ---`);
  next();
});
app.use(cors(corsOptions)); 

// 3. Middlewares
app.use(express.json()); 
app.use('/uploads', express.static('uploads')); 

// --- 4. ⭐️ (แก้ไข) API Routes (จัดกลุ่มใหม่) --- 
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRouter); 
// ⭐️ (สำคัญ!) "ชี้" (Route) /api/lessons (พหูพจน์) ➡️ ไปที่ 'lessonRouter' (V16)
app.use('/api/lessons', lessonRouter); // ⬅️ (แก้ Path เป็น พหูพจน์)
app.use('/api/progresses', progressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/users', userRoutes); 
app.use("/api/reviews", reviewRoutes);
app.use('/api/purchases', purchaseRoutes);
// Mount quiz-related routes at their correct base paths
app.use('/api/quizzes', quiz);
app.use('/api/lessons', quiz); // ⭐️ Enable lesson-scoped quiz endpoints like /api/lessons/:lessonId/quizzes/take
app.use('/api/quizresults', quizresults);
app.use('/api/certificates', certificateRoutes); 
app.use('/api/workshops', workShopRoutes);    // 🟢 Changed: was '/api/workshops'
// ⭐️ (ลบ 'app.use('/', lesson)' (V1) ที่ "ชน" กัน ทิ้ง)

// --- 5. เชื่อมต่อ DB และเปิดเซิร์ฟเวอร์ ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
    app.listen(PORT, () => {
      console.log(`🚀 เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
    process.exit(1);
  });