// src/pages/ProfilePage/ProfilePage.jsx (V3 - แก้ไข "Double Layout")

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
// ⭐️ 1. (ลบ) 'import Layout' (V3) (ไม่จำเป็น)
import "./ProfilePage.css"; // (V3)
// ⭐️ 2. (Import "สมอง" (V6))
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/api.js"; // (V1.2)

export default function ProfilePage() {
  const navigate = useNavigate();
  // ⭐️ 3. (อ่าน "สมอง" (V6))
  const { user, updateUser, loading: authLoading } = useAuth(); 
  
  const [formData, setFormData] = useState(null); // (V2)
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // (useEffect "ดักฟัง" (Listen) 'user' (V6) (จาก "สมอง" (V6)))
  useEffect(() => {
    // (V6) (ถ้า "สมอง" (V6) โหลดเสร็จ 
    //  และ "ไม่" (Not) "มี" (Exist) 'user' (V6))
    if (!authLoading && !user) {
      navigate("/login"); // (เด้งไป Login)
      return;
    }
    // (V6) (ถ้า "มี" (Exist) 'user' (V6))
    if (user) {
      setFormData(user); // (คัดลอก (Copy) 'user' (V6) มาใส่ 'formData' (V2))
      setPreview(user.avatar || "/default-avatar.png");
    }
  }, [user, authLoading, navigate]); // (ทำงานเมื่อ 'user' (V6) เปลี่ยน)

  // (ฟังก์ชัน "เปลี่ยนรูป" (V1) - (เหมือนเดิม))
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      // (V2) (อัปเดต 'formData' (V2) (Base64))
      setFormData((f) => ({ ...f, avatar: reader.result })); 
    };
    reader.readAsDataURL(file);
  };
  
  // (ฟังก์ชัน "พิมพ์" (V2))
  const handleFormChange = (e) => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // (ฟังก์ชัน "Save" (V2))
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    
    try {
      // (API 'PUT /update' (V2) (จาก `users.js` (V2)))
      const body = {
        name: formData.name,
        surname: formData.surname,
        username: formData.username,
        email: formData.email,
      };
      if (formData.password) body.password = formData.password;
      if (formData.avatar) body.avatar = formData.avatar;

      // ⭐️ 4. (แก้ไข) "ยิง" (Call) API (V1.2) (ด้วย 'api.js')
      const res = await api.put("/users/update", body);
      const data = res.data;

      if (!data.success) {
        alert(data.message || "อัปเดตไม่สำเร็จ");
        setSaving(false);
        return;
      }

      // ⭐️ 5. (แก้ไข) (BUG FIX) ⭐️
      // (เรียก "สมอง" (V6) ให้อัปเดต 'user' (V6))
      updateUser(data.user);
      
      alert("อัปเดตข้อมูลสำเร็จ ✅");
      setSaving(false);
      
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
      setSaving(false);
    }
  };

  // (V6) (ถ้า 'authLoading' (V6) หรือ 'formData' (V2) "ยังไม่มา" (Not ready))
  if (authLoading || !formData) {
    return (
      <p className="loading-text">⏳ กำลังโหลดข้อมูล...</p>
    );
  }

  return (
    // ⭐️ 6. (แก้ไข) "ลบ" (Remove) <Layout /> (V4) (Wrapper) ⭐️
    // (เพราะ 'App.jsx' (V9) "หุ้ม" (Wrap) ให้อยู่แล้ว)
   
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
                    name="name" // (V2)
                    value={formData.name || ""}
                    onChange={handleFormChange} // (V2)
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>นามสกุล</Form.Label>
                  <Form.Control
                    name="surname" // (V2)
                    value={formData.surname || ""}
                    onChange={handleFormChange} // (V2)
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    name="username" // (V2)
                    value={formData.username || ""}
                    onChange={handleFormChange} // (V2)
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email" // (V2)
                    value={formData.email || ""}
                    onChange={handleFormChange} // (V2)
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>รหัสผ่าน (ถ้าต้องการเปลี่ยน)</Form.Label>
                  <Form.Control
                    type="password"
                    name="password" // (V2)
                    onChange={handleFormChange} // (V2)
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
    
  );
}