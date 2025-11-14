// src/pages/ProfilePage/ProfilePage.jsx (V4 - Full Page Hi-Tech)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/api.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      setFormData(user);
      setPreview(user.avatar || "/default-avatar.png");
    }
  }, [user, authLoading, navigate]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFormData((f) => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      const body = {
        name: formData.name,
        surname: formData.surname,
        username: formData.username,
        email: formData.email,
      };
      if (formData.password) body.password = formData.password;
      if (formData.avatar) body.avatar = formData.avatar;

      const res = await api.put("/users/update", body);
      const data = res.data;

      if (!data.success) {
        alert(data.message || "อัปเดตไม่สำเร็จ");
        setSaving(false);
        return;
      }

      updateUser(data.user);
      alert("อัปเดตข้อมูลสำเร็จ ✅");
      setSaving(false);
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
      setSaving(false);
    }
  };

  if (authLoading || !formData) {
    return <p className="loading-text">⏳ กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="profile-container">
      <h2 className="profile-title">โปรไฟล์ของฉัน</h2>

      <div className="profile-grid">
        {/* Avatar */}
        <div className="profile-avatar">
          <img src={preview || "/default-avatar.png"} alt="avatar" />

          {/* ปุ่มเปลี่ยนรูปแบบสวย */}
          <label className="avatar-change-btn">
            เปลี่ยนรูปโปรไฟล์
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }} // ซ่อน input จริง
            />
          </label>
        </div>

        {/* Form */}
        <div className="profile-info">
          <label>ชื่อ</label>
          <input
            name="name"
            value={formData.name || ""}
            onChange={handleFormChange}
          />

          <label>นามสกุล</label>
          <input
            name="surname"
            value={formData.surname || ""}
            onChange={handleFormChange}
          />

          <label>Username</label>
          <input
            name="username"
            value={formData.username || ""}
            onChange={handleFormChange}
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleFormChange}
          />

          <label>รหัสผ่าน (ถ้าต้องการเปลี่ยน)</label>
          <input
            type="password"
            name="password"
            onChange={handleFormChange}
            placeholder="ปล่อยว่างถ้าไม่เปลี่ยน"
          />

          <button
            className="profile-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
