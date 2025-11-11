
import axios from 'axios';

// 1. สร้าง "instance" ของ axios
const api = axios.create({
  // ⭐️ (สำคัญ) ใส่ URL ของ Backend ที่คุณรันอยู่
  baseURL: 'http://localhost:3000/api', 
});

// 2. ⭐️ (สำคัญ) ตั้งค่า "Interceptor" (ตัวดักจับ)
// นี่คือ "ยาม" ที่จะแนบ Token ไปกับ "ทุก" Request
api.interceptors.request.use(
  (config) => {
    // 3. ดึง Token (ที่ได้ตอน Login) จาก localStorage
    const token = localStorage.getItem('token'); 
    
    if (token) {
      // 4. ถ้ามี Token ให้แปะใน Header 'Authorization'
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;