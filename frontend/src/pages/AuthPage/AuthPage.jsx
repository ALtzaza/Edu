import { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AuthPage.css";

export default function AuthPage() {
  const [page, setPage] = useState("login"); // login | register | forgot | reset
  const navigate = useNavigate();

  // ====== state สำหรับแต่ละหน้า ======
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
  });
  const [forgotLogin, setForgotLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(""); // ✅ token จาก forgot
  const [loading, setLoading] = useState(false);

  // ====== LOGIN ======
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("เข้าสู่ระบบสำเร็จ ✅");
      navigate("/dashboard");
    } catch {
      alert("Server Error ❌");
    }
  };

  // ====== REGISTER ======
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      alert("สมัครสมาชิกสำเร็จ ✅ กรุณา Login");
      setPage("login");
    } catch {
      alert("Server Error ❌");
    }
  };

  // ====== FORGOT PASSWORD ======
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: forgotLogin }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      if (data.resetLink) {
        const url = new URL(data.resetLink);
        const token = url.searchParams.get("token");
        setResetToken(token); // ✅ เก็บ token
        setPage("reset"); // ✅ เปลี่ยนไปหน้า reset
      } else {
        alert("ไม่ได้รับ token รีเซ็ตรหัสผ่านจากเซิร์ฟเวอร์");
      }
    } catch {
      alert("Server Error ❌");
    } finally {
      setLoading(false);
    }
  };

  // ====== RESET PASSWORD ======
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("❌ รหัสผ่านไม่ตรงกัน");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }), // ✅ ใช้ resetToken
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ รีเซ็ตรหัสผ่านสำเร็จ! กลับไปหน้าเข้าสู่ระบบได้เลย");
        setPage("login");
        navigate("/");
      } else alert("❌ " + (data.message || "เกิดข้อผิดพลาด"));
    } catch {
      alert("⚠️ Server error");
    } finally {
      setLoading(false);
    }
  };

  // ====== UI ======
  return (
    <Container
      fluid
      className="auth-container d-flex justify-content-center align-items-center"
    >
      <div className="auth-card">
        {(page === "login" || page === "register") && (
          <Row className="mb-4 text-center justify-content-center">
            <Col
              xs="auto"
              onClick={() => setPage("login")}
              className={`auth-tab ${page === "login" ? "active" : ""}`}
            >
              เข้าสู่ระบบ
            </Col>
            <Col
              xs="auto"
              onClick={() => setPage("register")}
              className={`auth-tab ${page === "register" ? "active" : ""}`}
            >
              ลงทะเบียน
            </Col>
          </Row>
        )}

        {/* ✅ LOGIN */}
        {page === "login" && (
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>อีเมล หรือ ชื่อผู้ใช้ *</Form.Label>
              <Form.Control
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="กรอกอีเมลหรือชื่อผู้ใช้"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>รหัสผ่าน *</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </Form.Group>

            <Button type="submit" className="auth-btn">
              เข้าสู่ระบบ
            </Button>

            <p className="auth-link" onClick={() => setPage("forgot")}>
              ลืมรหัสผ่าน ?
            </p>
          </Form>
        )}

        {/* ✅ REGISTER */}
        {page === "register" && (
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <Form.Label>ชื่อ *</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="กรอกชื่อ"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>นามสกุล *</Form.Label>
              <Form.Control
                name="surname"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                placeholder="กรอกนามสกุล"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>ชื่อผู้ใช้ *</Form.Label>
              <Form.Control
                name="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="กรอกชื่อผู้ใช้"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>อีเมล *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="กรอกอีเมล"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>รหัสผ่าน *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </Form.Group>

            <Button type="submit" className="auth-btn">
              ลงทะเบียน
            </Button>
          </Form>
        )}

        {/* ✅ FORGOT PASSWORD */}
        {page === "forgot" && (
          <form onSubmit={handleForgot}>
            <h3 className="text-center mb-3">รีเซ็ตรหัสผ่าน</h3>
            <label>ชื่อผู้ใช้หรืออีเมล</label>
            <input
              type="text"
              value={forgotLogin}
              onChange={(e) => setForgotLogin(e.target.value)}
              required
              className="form-control mb-3"
              placeholder="กรอก username หรือ email"
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "กำลังส่ง..." : "ขอรีเซ็ตรหัสผ่าน"}
            </button>
            <p className="auth-link" onClick={() => setPage("login")}>
              กลับไปหน้าเข้าสู่ระบบ
            </p>
          </form>
        )}

        {/* ✅ RESET PASSWORD */}
        {page === "reset" && (
          <form onSubmit={handleReset}>
            <h3 className="text-center mb-3">ตั้งรหัสผ่านใหม่</h3>
            <input
              type="password"
              className="form-control mb-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่"
              required
            />
            <input
              type="password"
              className="form-control mb-3"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ยืนยันรหัสผ่านใหม่"
              required
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
            <p className="auth-link" onClick={() => setPage("login")}>
              กลับไปหน้าเข้าสู่ระบบ
            </p>
          </form>
        )}
      </div>
    </Container>
  );
}
