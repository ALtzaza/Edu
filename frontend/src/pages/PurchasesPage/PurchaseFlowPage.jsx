// src/pages/purchases/PurchasePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Spinner, Form } from "react-bootstrap";
import Navbar from "../../components/Navbar";
import "./PurchaseFlowPage.css";

export default function PurchasePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // ✅ โหลดข้อมูลคอร์ส + ข้อมูลบัญชี
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, payRes] = await Promise.all([
          fetch(`http://localhost:3000/api/courses/${courseId}`),
          fetch(`http://localhost:3000/api/purchases/payment-info`),
        ]);

        const courseData = await courseRes.json();
        const payData = await payRes.json();

        if (courseData.success) setCourse(courseData.data);
        setPaymentInfo(payData);
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  // ✅ ฟังก์ชันแนบสลิป
  const handleUploadSlip = async () => {
    if (!token) return alert("กรุณาเข้าสู่ระบบก่อน");
    if (!slip) return alert("กรุณาเลือกไฟล์สลิปก่อน");

    try {
      // 1. สร้างคำสั่งซื้อก่อน
      const createRes = await fetch("http://localhost:3000/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course: courseId }),
      });
      const createData = await createRes.json();
      if (!createRes.ok)
        return alert(createData.message || "สร้างคำสั่งซื้อไม่สำเร็จ");

      const purchaseId = createData.purchase._id;

      // 2. อัปโหลดสลิป
      const formData = new FormData();
      formData.append("slip", slip);

      const uploadRes = await fetch(
        `http://localhost:3000/api/purchases/${purchaseId}/upload-slip`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const uploadData = await uploadRes.json();

      if (uploadRes.ok) {
        alert("✅ อัปโหลดสลิปสำเร็จ! รอการตรวจสอบจากแอดมิน");
        navigate("/purchases");
      } else {
        alert(uploadData.message || "อัปโหลดสลิปไม่สำเร็จ");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปโหลดสลิป");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <Container className="text-center py-5">
          <h5>❌ ไม่พบคอร์สที่เลือก</h5>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="purchase-container">
        <Card className="purchase-card shadow-sm">
          <Card.Body>
            <div className="course-header">
              <img
                src={
                  course.thumbnail ||
                  "https://placehold.co/400x200?text=No+Image"
                }
                alt={course.title}
                className="course-thumb"
              />
              <div className="course-info">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <h5>💰 ราคา: {course.price} บาท</h5>
              </div>
            </div>

            <hr />

            <div className="payment-section">
  <h5>📱 ข้อมูลการชำระเงิน</h5>
  {paymentInfo ? (
    <div className="payment-wrapper">
      {/* Left: ข้อมูลเดิม */}
      <div className="payment-left">
        <p>
          <b>ธนาคาร:</b> {paymentInfo.bankName || "ไทยพาณิชย์(SCB)"}
        </p>
        <p>
          <b>ชื่อบัญชี:</b> {paymentInfo.bankAccountName || "—"}
        </p>
        <p>
          <b>เลขบัญชี:</b> {paymentInfo.bankAccountNumber || "—"}
        </p>
        <p><b>QR Code:</b></p>
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=FAKEPAYMENT"
          alt="QR Code (mock)"
          className="qr-code"
        />
      </div>

      {/* Right: ข้อความเพิ่มเติม */}
      <div className="payment-right">
        <p><b>วิธีการชำระเงินด้วย QR Code</b></p>
        <p>
          ขั้นตอนที่ 1<br />
          เปิดแอปพลิเคชั่น Mobile Banking และเลือกชำระเงินด้วย QR Code จากนั้นทำการสแกน QR Code
        </p>
        <p>
          ขั้นตอนที่ 2<br />
          เมื่อจ่ายเงินเรียบร้อยแล้วรอแอดมินอนุมัติ
        </p>
      </div>
    </div>
  ) : (
    <p>ไม่พบข้อมูลการชำระเงิน</p>
  )}
</div>

            <div className="upload-section mt-4">
              <h5>📤 แนบสลิปการโอนเงิน</h5>
              <Form.Group>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSlip(e.target.files[0])}
                />
              </Form.Group>
            </div>

            <div className="btn-group mt-4">
              <Button className="confirm-btn" onClick={handleUploadSlip}>
                ยืนยันการชำระเงิน
              </Button>
              <Button
                variant="secondary"
                className="cancel-btn"
                onClick={() => navigate("/courses")}
              >
                ยกเลิก
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}
