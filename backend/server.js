// 1. โหลด .env ก่อนเสมอ
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// 2. ตรวจสอบว่ามี MONGO_URI และ PORT
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000; // ใช้ค่าจาก .env หรือ 5000 ถ้าไม่มี

if (!MONGO_URI) {
  console.error('❌ ไม่พบ MONGO_URI ในไฟล์ .env');
  process.exit(1);
}

// 3. สร้างแอป Express
const app = express();

// 4. Middleware: สำคัญมาก!
// นี่คือตัวที่ทำให้ Express อ่าน JSON จาก body ของ Postman ได้
app.use(cors());
app.use(express.json());

// 5. สร้าง Model (เหมือนเดิม)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});
const User = mongoose.model('User', userSchema);

// --- 6. สร้าง API Endpoints สำหรับ Postman ---

// Endpoint 1: (POST) สร้าง User ใหม่
app.post('/api/users', async (req, res) => {
    console.log('!!! ได้รับ Request ที่ /api/users แล้ว !!!'); 
  try {
    // ดึงข้อมูลจาก Body ที่ Postman ส่งมา
    const { username, email } = req.body;

    // เช็กว่าข้อมูลครบไหม
    if (!username || !email) {
      return res.status(400).json({ message: 'กรุณาส่ง username และ email' });
    }

    const newUser = new User({ username, email });
    const savedUser = await newUser.save();

    console.log('🎉 สร้าง User ใหม่สำเร็จ:', savedUser);
    res.status(201).json(savedUser); // ส่งข้อมูลที่สร้างเสร็จกลับไป
  
  } catch (error) {
    // จัดการกรณี Email ซ้ำ
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email นี้ถูกใช้งานแล้ว' });
    }
    console.error('❌ เกิดข้อผิดพลาดที่ /api/users (POST):', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Endpoint 2: (GET) ดึง User ทั้งหมด
app.get('/api/users', async (req, res) => {
    
  try {
    const users = await User.find(); // ดึงมาทั้งหมด
    console.log('🔍 ดึงข้อมูล User ทั้งหมด');
    res.status(200).json(users);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดที่ /api/users (GET):', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


// --- 7. เชื่อมต่อ DB และเปิดเซิร์ฟเวอร์ ---
console.log('กำลังเชื่อมต่อกับ MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
    
    // เมื่อเชื่อมต่อ DB สำเร็จ ค่อยเปิดเซิร์ฟเวอร์
    app.listen(PORT, () => {
      console.log(`🚀 เซิร์ฟเวอร์กำลังรอรับคำสั่งที่ http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
    process.exit(1);
  });