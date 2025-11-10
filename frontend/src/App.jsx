import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage/AuthPage.jsx";
import PurchasesPage from "./pages/PurchasesPage/PurchasesPage";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import PurchaseFlowPage from "./pages/PurchasesPage/PurchaseFlowPage";
// import ForgotPassword from "./components/ForgotPassword";
// import ResetPassword from "./components/ResetPassword";

const query = new URLSearchParams(window.location.search);
const token = query.get("token");

console.log("reset token =", token); // ใช้ตรวจสอบได้

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/purchases" element={<PurchasesPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/purchase/:courseId" element={<PurchaseFlowPage />} />
      {/* <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} /> */}
    </Routes>
  );
}
