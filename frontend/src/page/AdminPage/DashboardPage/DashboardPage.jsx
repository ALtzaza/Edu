// src/pages/Admin/DashboardPage.jsx (V2 - ยิง API จริง)

import React, { useState, useEffect } from 'react';
import api from '../../../api/api'; // (Import API)
import './DashboardPage.css'; // (Import CSS)

import { PeopleFill, BookFill, CashCoin, HourglassSplit } from 'react-bootstrap-icons';

// (StatCard Component - เหมือนเดิม)
const StatCard = ({ title, value, icon, className }) => {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${className}`}>
        {icon}
      </div>
      <div className="stat-card-info">
        <h4>{title}</h4>
        <span className="stat-number">{value}</span>
      </div>
    </div>
  );
};


const DashboardPage = () => {
  // ⭐️ (แก้ไข) 1. State สำหรับเก็บ "ตัวเลข" (V2)
  const [stats, setStats] = useState(null); // (เริ่มต้นเป็น null)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐️ (แก้ไข) 2. "ยิง API จริง" ⭐️
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // (ยิง API (V2) ที่เราเพิ่งสร้างใน 'admin.js')
        const res = await api.get('/admin/stats');
        
        setStats(res.data.stats); // (เก็บ "ตัวเลขจริง")
        
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("ไม่สามารถโหลดข้อมูล Dashboard ได้");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []); // (ยิงครั้งเดียวตอนโหลด)

  // (UI ตอน Loading / Error)
  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats) return <div>ไม่พบข้อมูล</div>; // (กัน 'stats' เป็น null)

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>
      
      {/* ⭐️ 3. (แก้ไข) "แสดงผล" (V2) ⭐️ */}
      {/* (แสดง "ตัวเลขจริง" จาก 'stats' State) */}
      <div className="stat-card-grid">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers}
          icon={<PeopleFill />}
          className="icon-users"
        />
        <StatCard 
          title="Total Courses" 
          value={stats.totalCourses}
          icon={<BookFill />}
          className="icon-courses"
        />
        <StatCard 
          title="Total Sales" 
          // (จัด Format "ตัวเลข" (เช่น 85000) 
          //  ให้เป็น "สกุลเงิน" (เช่น ฿85,000))
          value={`฿${stats.totalSales.toLocaleString('th-TH')}`}
          icon={<CashCoin />}
          className="icon-sales"
        />
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders}
          icon={<HourglassSplit />}
          className="icon-pending"
        />
      </div>
      
    </div>
  );
};

export default DashboardPage;