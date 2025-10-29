// ตรวจสอบสิทธิ์ admin ก่อนเข้าถึง route
export const isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง (เฉพาะ admin เท่านั้น)" });
    }
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบตรวจสอบสิทธิ์" });
  }
};
