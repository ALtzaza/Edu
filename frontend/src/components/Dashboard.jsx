// ✅ เพิ่ม import Container
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container } from "react-bootstrap"; // ✅ แก้ตรงนี้
import Navbar from "./Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("ออกจากระบบเรียบร้อย ✅");
    navigate("/");
  };

  return (
    <>
      <Navbar />

      {/* ✅ ส่วน Dashboard ใหม่ */}
      <Container style={{ paddingTop: 24, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Dashboard</h2>
        </div>

        {/* ✅ แสดงชื่อ */}
        {user && (
          <p style={{ marginTop: 20, fontSize: 18, color: "white" }}>
            สวัสดี, <b>{user.name} {user.surname}</b> 🎉
          </p>
        )}
      </Container>
    </>
  );
}
