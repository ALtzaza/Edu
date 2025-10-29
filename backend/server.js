
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import categoryRoutes from "./routes/categories.js";
import courseRoutes from "./routes/courses.js";
import sectionRouter from "./routes/section.js";
import lessonRouter from "./routes/lesson.js";
import progressRoutes from "./routes/progresses.js";
import notificationRoutes from "./routes/notificates.js";
// import testRoutes from "./routes/test.js";

import quiz from './routes/quizzes.js';
import lesson from './routes/lessons.js';
import quizresults from './routes/quizresults.js';
import certificateRoutes from './routes/certificates.js';
import workShopRoutes from './routes/workshop.js';
import userRoutes from './routes/users.js';
import reviewRoutes from './routes/reviews.js';
import purchaseRoutes from './routes/purchases.js';
import adminRoutes from "./routes/admin.js";
//import adminCourseRoutes from "./routes/adminCourse.js";
//import testRoutes from './routes/test.js';  

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

if (!MONGO_URI) {
  console.error('❌ ไม่พบ MONGO_URI ในไฟล์ .env');
  process.exit(1);
}

// 3. สร้างแอป Express
const app = express();

// 4. Middleware
app.use(cors()); // เปิดรับการเชื่อมต่อจาก Origin อื่นๆ
app.use(express.json()); // ทำให้ Express อ่าน JSON body ได้

// --- 5. API Routes (จะถูกเพิ่มที่นี่ในอนาคต) --- 
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/progresses', progressRoutes);
app.use('/api/notifications', notificationRoutes);
//  5. เพิ่มบรรทัดนี้: ทำให้โฟลเดอร์ 'uploads' เป็น Public (Static) 
// นี่คือบรรทัดที่จะทำให้คุณ "เปิดไฟล์" ที่อัปโหลดได้
// โดยจะแมป URL: /uploads/abc.zip -> ไปยังไฟล์ในโฟลเดอร์: [project]/uploads/abc.zip
app.use('/uploads', express.static('uploads'));
// เปิดให้เรียกไฟล์จาก /uploads
app.use("/uploads", express.static("uploads"));


// --- 5. API Routes (จะถูกเพิ่มที่นี่ในอนาคต) ---
app.use("/api/admin", adminRoutes);
//app.use("/api/admin/courses", adminCourseRoutes);
app.use('/api/users', userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/purchases', purchaseRoutes);


// --- 6. API Routes
// app.use('/', testRoutes);
app.use('/', quiz);
app.use('/', lesson);
app.use('/', quizresults);
app.use('/', certificateRoutes);
app.use('/', workShopRoutes);





// --- 7. เชื่อมต่อ DB และเปิดเซิร์ฟเวอร์ ---
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

