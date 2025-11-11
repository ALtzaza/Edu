import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, ProgressBar, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import "./PurchasesPage.css";

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const primaryColor = "#10162F";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchPurchases = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/purchases/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้");
          return;
        }

        setPurchases(data.purchases || []);
      } catch (err) {
        alert("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [navigate]);

  const handleSlipUpload = async (purchaseId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("slip", file);

    const token = localStorage.getItem("token");
    setUploading(purchaseId);
    try {
      const res = await fetch(
        `http://localhost:3000/api/purchases/${purchaseId}/upload-slip`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }

      alert("✅ อัปโหลดสลิปสำเร็จ รอการตรวจสอบจากแอดมิน");
      setPurchases((prev) =>
        prev.map((p) =>
          p._id === purchaseId ? { ...p, slipUrl: data.slipUrl } : p
        )
      );
    } catch (err) {
      alert("Server error");
    } finally {
      setUploading(null);
    }
  };

  if (loading)
    return (
      <>
       
        <p className="loading-text">⏳ กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
      </>
    );

  return (
    <>
      
      <Container className="purchase-container">
        <h3 className="purchase-title">รายการคำสั่งซื้อของฉัน</h3>

        {purchases.length === 0 ? (
          <div className="no-purchase">
            <p>ยังไม่มีคำสั่งซื้อ</p>
            <Button className="purchase-btn" onClick={() => navigate("/courses")}>
              ไปดูคอร์สเรียน
            </Button>
          </div>
        ) : (
          <Row className="justify-content-center">
            {purchases.map((p) => (
              <Col md={6} key={p._id}>
                <Card className="purchase-card">
                  <Row>
                    <Col xs={4} className="thumbnail-wrap">
                      <img
                        src={p.course?.thumbnail || "/no-course.png"}
                        alt="course"
                        className="thumbnail-img"
                      />
                    </Col>
                    <Col xs={8}>
                      <h5 className="course-title">{p.course?.title || "คอร์สนี้ถูกลบแล้ว"}</h5>
                      <p className="price">ราคา: {p.course?.price || 0} บาท</p>

                      <p className="status">
                        สถานะ:{" "}
                        <span className={`status-badge status-${p.status || "pending"}`}>
                          {p.status === "paid"
                            ? "ชำระแล้ว"
                            : p.status === "pending"
                            ? "รอตรวจสอบ"
                            : "ยกเลิกแล้ว"}
                        </span>
                      </p>

                      <p className="purchase-date">
                        วันที่ซื้อ:{" "}
                        {new Date(p.createdAt).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>

                      {p.slipUrl && (
                        <p>
                          <a
                            href={`http://localhost:3000${p.slipUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="slip-link"
                          >
                            ดูสลิป
                          </a>
                        </p>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}
