// src/pages/Admin/ManageCategoriesPage.jsx (V1)

import React, { useState, useEffect } from 'react';
import api from '../../../api/api'; // (Import API)
// (ใช้ CSS (V1) "ร่วมกัน" กับ 'ManageCoursesPage')
import './ManageCategoriesPage.css'; 

// (Form สร้าง/แก้ไข)
const CategoryForm = ({ onCategoryUpdated, editingCategory, setEditingCategory }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // (useEffect "ดักฟัง" ว่า "กำลังแก้ไข" หรือไม่)
  useEffect(() => {
    if (editingCategory) {
      // (ถ้า "แก้ไข" ➡️ "ดึง" ข้อมูลเก่ามาใส่ Form)
      setName(editingCategory.name);
      setDescription(editingCategory.description || '');
    } else {
      // (ถ้า "สร้าง" ➡️ "เคลียร์" Form)
      setName('');
      setDescription('');
    }
  }, [editingCategory]); // (ทำงานเมื่อ 'editingCategory' เปลี่ยน)

  // (ฟังก์ชัน "ยิง API")
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("กรุณากรอก 'Name'");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editingCategory) {
        // 1. ⭐️ (API "แก้ไข") (V1 - Mock)
        const res = await api.put(`/categories/${editingCategory._id}`, { name, description });
        onCategoryUpdated(res.data.data, 'update');
        
      } else {
        // 2. ⭐️ (API "สร้าง") (V1 - Mock)
        const res = await api.post('/categories', { name, description });
        onCategoryUpdated(res.data.data, 'add');
      }
      // (สำเร็จ ➡️ เคลียร์ Form)
      setEditingCategory(null);

    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <h2>{editingCategory ? "แก้ไข หมวดหมู่" : "สร้าง หมวดหมู่ใหม่"}</h2>
      <form className="admin-form-grid" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="cat-name">Name</label>
          <input type="text" id="cat-name" className="admin-form-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label htmlFor="cat-desc">Description (Optional)</label>
          <input type="text" id="cat-desc" className="admin-form-input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        
        <div className="admin-form-group" style={{ gridColumn: '1 / -1', alignItems: 'flex-end', gap: '1rem', flexDirection: 'row' }}>
          {editingCategory && (
            <button type="button" className="admin-submit-button" 
                    style={{ backgroundColor: '#555' }} 
                    onClick={() => setEditingCategory(null)}>
              Cancel
            </button>
          )}
          <button type="submit" className="admin-submit-button" disabled={loading}>
            {loading ? "Loading..." : (editingCategory ? "Update Category" : "Create Category")}
          </button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
};


// (Component หลัก (V1))
const ManageCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (State "กำลังแก้ไข")
  const [editingCategory, setEditingCategory] = useState(null);

  // (ยิง API 'GET /categories' (V1 - Mock))
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // (ฟังก์ชัน "ลบ" (V1) - Mock)
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("คุณแน่ใจนะ ว่าจะลบหมวดหมู่นี้?")) {
      return;
    }
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(categories.filter(c => c._id !== categoryId));
    } catch (err) {
      alert("Error: " + err.response?.data?.message);
    }
  };
  
  // (ฟังก์ชัน "อัปเดตตาราง" (V1))
  const handleCategoryUpdated = (updatedCategory, mode) => {
    if (mode === 'add') {
      // (เพิ่ม)
      setCategories([updatedCategory, ...categories]);
    } else {
      // (แก้ไข)
      setCategories(categories.map(c => 
        c._id === updatedCategory._id ? updatedCategory : c
      ));
    }
  };

  if (loading) return <div>Loading Categories...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Manage Categories</h1>
      
      {/* 1. (Form) */}
      <CategoryForm 
        onCategoryUpdated={handleCategoryUpdated} 
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
      />
      
      {/* 2. (Table) */}
      <h1>Existing Categories ({categories.length})</h1>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat._id}>
                <td>{cat.name}</td>
                <td>{cat.description || "N/A"}</td>
                <td className="actions-cell">
                  {/* (ปุ่ม "แก้ไข") */}
                  <button 
                    className="action-button edit-button"
                    onClick={() => setEditingCategory(cat)}
                  >
                    Edit
                  </button>
                  {/* (ปุ่ม "ลบ") */}
                  <button 
                    className="action-button delete-button"
                    onClick={() => handleDeleteCategory(cat._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCategoriesPage;