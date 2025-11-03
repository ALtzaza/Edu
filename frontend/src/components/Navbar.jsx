import React from 'react';
import { Link } from 'react-router-dom'; // ใช้ Link แทน <a> เพื่อไม่ให้หน้า reload

const Navbar = () => {
  return (
    // โค้ด HTML ที่ผมให้ไป จะมาอยู่ที่นี่ (เปลี่ยน <a> เป็น <Link>)
    <nav className="bg-neutral-900 text-white h-[78px]">
      <div className="container mx-auto h-full flex justify-between items-center px-6">
        
        {/* 1. กลุ่มด้านซ้าย (Left Group) */}
        <div className="flex items-center space-x-6">
          <Link to="/catalog" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Catalog</Link>
          <Link to="/lab" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Tid_Lab</Link>
          <Link to="/blog" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Blog</Link>
          <Link to="/review" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Review</Link>
          
          <Link to="/profile" className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <span>Your_Profile</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </Link>
        </div>

        {/* 2. กลุ่มด้านขวา (Right Group / Logo) */}
        <div>
          <Link to="/" className="text-xl font-bold tracking-wider">Tid_Code.</Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
