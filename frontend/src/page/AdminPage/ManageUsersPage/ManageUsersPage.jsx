// src/pages/Admin/ManageUsersPage.jsx (V1)

import React, { useState, useEffect } from 'react';
import api from '../../../api/api'; // (Import API)
// (ใช้ CSS "ร่วม" (V1))
import './ManageUsersPage.css'; 

// (Import ไอคอน (ต้อง npm install react-bootstrap-icons))
import { TrashFill, PersonXFill, PersonCheckFill } from 'react-bootstrap-icons';

// (Component หลัก (V1))
const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (ฟังก์ชัน "ดึง" (Fetch) User (V1))
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. ⭐️ (API จริง) ยิง API (admin.js V3)
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // (ยิง API (V1) ตอนโหลด)
  useEffect(() => {
    fetchUsers();
  }, []);

  // (ฟังก์ชัน "ลบ/Deactivate" (V1))
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`คุณแน่ใจนะ ว่าจะ "ปิดใช้งาน" (Deactivate) ผู้ใช้ ${username}?`)) {
      return;
    }
    try {
      // 2. ⭐️ (API จริง) ยิง API (admin.js V3)
      await api.delete(`/admin/users/${userId}`);
      alert("ปิดใช้งาน (Deactivate) ผู้ใช้สำเร็จ!");
      fetchUsers(); // (โหลด "ตาราง" ใหม่)
    } catch (err) {
      alert("Error: " + err.response?.data?.message);
    }
  };
  
  if (loading) return <div>Loading Users...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Manage Users ({users.length})</h1>
      
      {/* 2. (Table) */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  {/* (Mock Avatar (V1)) */}
                  <div className="navbar-avatar" style={{ margin: 0 }}>
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                </td>
                <td>{user.name} {user.surname}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {/* (เช็ค "ยศ" (Role)) */}
                  {user.role === 'admin' ? (
                    <span style={{ color: '#4EC9B0' }}><PersonCheckFill /> Admin</span>
                  ) : user.role === 'student' ? (
                    <span>Student</span>
                  ) : (
                    <span style={{ color: '#F44747' }}><PersonXFill /> Deactivated</span>
                  )}
                </td>
                <td className="actions-cell">
                  {/* (ปุ่ม "ลบ" (V1)) */}
                  {/* (เรา "ไม่" ลบ Admin คนอื่น (V1)) */}
                  {user.role === 'student' && (
                    <button 
                      className="action-button delete-button"
                      onClick={() => handleDeleteUser(user._id, user.username)}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsersPage;