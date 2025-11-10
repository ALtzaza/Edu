import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const primaryColor = "#10162F";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
          navigate("/");
          return;
        }
        setUser(data.user);
        setPreview(data.user.avatar || "/default-avatar.png");
      } catch (err) {
        alert("Server error");
      }
    };
    fetchProfile();
  }, [navigate]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setUser((u) => ({ ...u, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
      };
      if (user.password) body.password = user.password;
      if (user.avatar) body.avatar = user.avatar;

      const res = await fetch("http://localhost:3000/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "อัปเดตไม่สำเร็จ");
        setSaving(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      alert("อัปเดตข้อมูลสำเร็จ ✅");
      setSaving(false);
    } catch (err) {
      alert("Server error");
      setSaving(false);
    }
  };

  if (!user)
    return (
      <p className="loading-text">⏳ กำลังโหลดข้อมูล...</p>
    );

  return (
    <>
      <Navbar />
      <Container className="profile-container">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="profile-card">
              <h3 className="profile-title">โปรไฟล์ของฉัน</h3>

              <div className="avatar-wrapper">
                <img
                  src={preview || "/default-avatar.png"}
                  alt="avatar"
                  className="avatar-img"
                  style={{ borderColor: primaryColor }}
                />
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2 text-center">
                  <Form.Label className="d-block">เปลี่ยนรูปโปรไฟล์</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>ชื่อ</Form.Label>
                  <Form.Control
                    value={user.name || ""}
                    onChange={(e) =>
                      setUser({ ...user, name: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>นามสกุล</Form.Label>
                  <Form.Control
                    value={user.surname || ""}
                    onChange={(e) =>
                      setUser({ ...user, surname: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    value={user.username || ""}
                    onChange={(e) =>
                      setUser({ ...user, username: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={user.email || ""}
                    onChange={(e) =>
                      setUser({ ...user, email: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>รหัสผ่าน (ถ้าต้องการเปลี่ยน)</Form.Label>
                  <Form.Control
                    type="password"
                    onChange={(e) =>
                      setUser({ ...user, password: e.target.value })
                    }
                    placeholder="ปล่อยว่างถ้าไม่เปลี่ยน"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="profile-btn"
                  disabled={saving}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
