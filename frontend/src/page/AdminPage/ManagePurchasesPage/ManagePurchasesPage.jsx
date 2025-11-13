// src/pages/AdminPage/ManagePurchasesPage/ManagePurchasesPage.jsx
import React, { useEffect, useState } from "react";
import "./ManagePurchasesPage.css";

export default function ManagePurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSlip, setShowSlip] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");

  const token = localStorage.getItem("token");

  const fetchPurchases = async (status = "pending") => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/admin/purchases${
          status ? `?status=${status}` : ""
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch (err) {
      alert("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(); // เริ่มต้นรอยืนยัน
  }, []);

  const handleShowAll = () => {
    const newShowAll = !showAll;
    setShowAll(newShowAll);
    fetchPurchases(newShowAll ? "" : "pending"); // "" = ดึงทุก status, "pending" = เฉพาะรอยืนยัน
  };

  // ⭐️ แก้ไขตรงนี้ให้ต่อกับ host เพื่อโหลดรูปสลิป
  const handleViewSlip = (filePath) => {
    setSlipUrl(`http://localhost:3000${filePath}`);
    setShowSlip(true);
  };

  const handleApprove = async (id) => {
  try {
    const res = await fetch(`http://localhost:3000/api/purchases/${id}/pay`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      alert(`Error: ${text}`);
      return;
    }

    const data = await res.json();
    alert(data.message || "อนุมัติสำเร็จ");

    fetchPurchases(showAll ? "" : "pending"); // รีเฟรชตาราง
  } catch (err) {
    alert("ไม่สามารถอนุมัติได้");
  }
};


  return (
    <div className="manage-purchases-container">
      <div className="manage-purchases-header">
        <h3>จัดการคำสั่งซื้อ</h3>
        <button className="mp-button" onClick={handleShowAll}>
          {showAll ? "แสดงเฉพาะรอยืนยัน" : "แสดงทั้งหมด"}
        </button>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : purchases.length === 0 ? (
        <p>ไม่พบคำสั่งซื้อ</p>
      ) : (
        <table className="mp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Slip</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p, idx) => (
              <tr key={p._id}>
                <td>{idx + 1}</td>
                <td>{p.user?.username || p.user?.name}</td>
                <td>{p.course?.title}</td>
                <td>{p.amount}</td>
                <td>
                  <span className={`mp-badge ${p.status}`}>{p.status}</span>
                </td>
                <td>
                  {p.slipUrl ? (
                    <button
                      className="mp-button"
                      onClick={() => handleViewSlip(p.slipUrl)}
                    >
                      ดูสลิป
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {p.status === "pending" && (
                    <button
                      className="mp-button"
                      onClick={() => handleApprove(p._id)}
                    >
                      อนุมัติ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showSlip && (
        <div className="mp-modal" onClick={() => setShowSlip(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>สลิปการโอนเงิน</h5>
              <button onClick={() => setShowSlip(false)} className="mp-button">
                ปิด
              </button>
            </div>
            <div className="modal-body">
              <img src={slipUrl} alt="Slip" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
