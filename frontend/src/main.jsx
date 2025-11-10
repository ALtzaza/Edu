import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// import "./indexs.css";

// ✅ import จากโฟลเดอร์ components
import Dashboard from "./components/Dashboard.jsx";
import AuthPage from "./pages/AuthPage/AuthPage.jsx";
import Profile from "./pages/ProfilePage/ProfilePage.jsx";


import { BrowserRouter, Routes, Route } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* หน้า login & register */}
        <Route path="/*" element={<App />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard หลัง login */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* หน้า profile */}
        <Route path="/profile" element={<Profile />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
