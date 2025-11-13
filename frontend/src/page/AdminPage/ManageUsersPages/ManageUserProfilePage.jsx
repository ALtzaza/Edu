// src/pages/Admin/ManageUserProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "./ManageUserProfilePage.css";

const ManageUserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/admin/users/${id}`);
        setUser(res.data.data || res.data);
      } catch (err) {
        alert("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    setAvatarFile(e.target.files[0]);
    // แสดง preview รูปใหม่ทันที
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUser((prev) => ({ ...prev, avatar: ev.target.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("surname", user.surname);
      formData.append("username", user.username);
      formData.append("email", user.email);
      formData.append("role", user.role || "student");
      if (password) formData.append("password", password);
      if (avatarFile) formData.append("avatar", avatarFile);

      await api.put(`/admin/users/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("อัปเดตผู้ใช้สำเร็จ");
      navigate("/admin/manage-users");
    } catch (err) {
      alert("ไม่สามารถบันทึกข้อมูลได้");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p>Loading user data...</p>;

  // fallback avatar: ใช้รูป default หรือชื่อ user ตัวอักษรแรก
  const avatarSrc = user.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `http://localhost:3000${user.avatar}`
    : `https://cdn-icons-png.flaticon.com/512/149/149071.png`;

  return (
    <div className="manage-userprofile-container">
      <h2>แก้ไขผู้ใช้: {user.username}</h2>

      <div className="profile-grid">
        <div className="profile-avatar">
          <img src={avatarSrc} alt={user.username || "Avatar"} />
          <input type="file" onChange={handleAvatarChange} />
        </div>

        <div className="profile-info">
          <label>ชื่อ</label>
          <input name="name" value={user.name || ""} onChange={handleChange} />

          <label>นามสกุล</label>
          <input name="surname" value={user.surname || ""} onChange={handleChange} />

          <label>Email</label>
          <input name="email" value={user.email || ""} onChange={handleChange} />

          <label>Username</label>
          <input name="username" value={user.username || ""} onChange={handleChange} />

          <label>Password (ถ้าต้องการเปลี่ยน)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />

          <label>Role</label>
          <select name="role" value={user.role || "student"} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="profile-buttons">
        <button onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button className="btn-cancel" onClick={() => navigate("/admin/manage-users")}>
          ปิด / ย้อนกลับ
        </button>
      </div>
    </div>
  );
};

export default ManageUserProfilePage;
