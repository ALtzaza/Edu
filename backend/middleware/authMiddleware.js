// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "ไม่มี token ใน request" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token ไม่ถูกต้อง" });
    req.user = user; // user = { id, role }
    next();
  });
};
