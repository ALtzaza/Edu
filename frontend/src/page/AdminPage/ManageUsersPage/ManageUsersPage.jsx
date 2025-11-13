import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "./ManageUsersPage.css";
import { TrashFill, PersonCheckFill } from "react-bootstrap-icons";

const ManageUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/users");
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "ลบผู้ใช้ไม่สำเร็จ");
        return;
      }

      alert("ลบผู้ใช้สำเร็จ");
      setUsers(users.filter((u) => u._id !== id));
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  if (loading) return <div>Loading Users...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="manage-users-container">
      <h1>ผู้ใช้ทั้งหมด ({users.length})</h1>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>ชื่อ</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="clickable-row"
                onClick={() => navigate(`/admin/manage-users/${user._id}`)}
              >
                <td>
                  <div className="user-avatar">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                </td>
                <td>
                  {user.name} {user.surname}
                </td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {user.role === "admin" ? (
                    <span className="role-admin">
                      <PersonCheckFill /> Admin
                    </span>
                  ) : user.role === "student" ? (
                    <span className="role-student">Student</span>
                  ) : (
                    <span className="role-deactivated">Deactivated</span>
                  )}
                </td>
                <td>
                  {user.role === "student" && (
                    <button
                      className="btn-delete-user"
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกันไม่ให้ trigger onClick ของ tr
                        handleDeleteUser(user._id);
                      }}
                    >
                      <TrashFill /> ลบบัญชี
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
