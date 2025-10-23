// ในไฟล์ middleware/mockAuth.js

// Middleware นี้จะ "จำลอง" ว่าเป็น Admin ที่ Login แล้ว
export const mockAdmin = (req, res, next) => {
  
    // 1. สร้าง "req.user" ปลอมๆ ขึ้นมา
    // (ปกติ object นี้จะถูกสร้างโดย verifyToken ที่เพื่อนคุณทำ)
    req.user = {
      // ⭐️ (สำคัญ) ใช้อันนี้เป็น Admin ObjectId ปลอมๆ สำหรับเทส
      // (นี่คือ 24-char hex string ปลอม)
      id: "660000000000000000000001", 
      name: "Mock Admin (Tester)",
      role: "admin"
    };
  
    // 2. สั่งให้ "ผ่าน" (next()) ไปยัง logic ถัดไป
    next();
  };

  export const mockUser = (req, res, next) => {
    req.user = {
      id: "670000000000000000000002", // ⬅️ 1. ใส่ ID ของ "User" ที่คุณสร้างใน DB
      name: "Mock User (Student)",
      role: "user"
    };
    next();
  };