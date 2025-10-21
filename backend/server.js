// 1. โหลด .env ก่อนเสมอ
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import testRoutes from './routes/test.js';  

// 2. ตรวจสอบว่ามี MONGO_URI และ PORT
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

// app.use('/', testRoutes);















// --- 6. เชื่อมต่อ DB และเปิดเซิร์ฟเวอร์ ---
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

