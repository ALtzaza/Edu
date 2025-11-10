import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Row, Col, Spinner } from "react-bootstrap";
import Navbar from "../../components/Navbar";
import "./CoursesPage.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ โหลดข้อมูลคอร์สและคำสั่งซื้อ
  useEffect(() => {
    const token = localStorage.getItem("token");

    Promise.all([
      fetch("http://localhost:3000/api/courses").then(res => res.json()),
      token
        ? fetch("http://localhost:3000/api/purchases/mine", {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json())
        : Promise.resolve({ purchases: [] }),
    ])
      .then(([courseData, purchaseData]) => {
        if (courseData.success) setCourses(courseData.data);
        setPurchases(purchaseData.purchases || []);
      })
      .catch(() => alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"))
      .finally(() => setLoading(false));
  }, []);

  // ✅ หาสถานะคอร์สที่ผู้ใช้ซื้อ
  const getPurchaseStatus = (courseId) => {
    const found = purchases.find((p) => p.course?._id === courseId);
    return found ? found.status : null;
  };

  // ✅ ฟังก์ชันซื้อคอร์ส
  const handleBuy = (courseId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนซื้อคอร์ส");
      navigate("/");
      return;
    }
    navigate(`/purchase/${courseId}`);
  };

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 30 }}>
        <h3 className="courses-title">📚 คอร์สทั้งหมด</h3>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : courses.length === 0 ? (
          <p>ยังไม่มีคอร์สในระบบ</p>
        ) : (
          <Row>
            {courses.map((course) => {
              const status = getPurchaseStatus(course._id);
              let buttonText = "ซื้อคอร์สนี้";
              let buttonVariant = "primary";
              let disabled = false;

              if (status === "pending") {
                buttonText = "รออนุมัติจากแอดมิน";
                buttonVariant = "warning";
                disabled = true;
              } else if (status === "paid") {
                buttonText = "เป็นเจ้าของแล้ว";
                buttonVariant = "success";
                disabled = true;
              } else if (status === "cancelled") {
                buttonText = "ยกเลิกแล้ว";
                buttonVariant = "secondary";
                disabled = true;
              }

              return (
                <Col key={course._id} md={4} className="mb-4">
                  <Card className="course-card">
                    <Card.Img
                      variant="top"
                      src={
                        course.thumbnail ||
                        "https://placehold.co/400x200?text=No+Image"
                      }
                      className="course-img"
                    />
                    <Card.Body>
                      <Card.Title>{course.title}</Card.Title>
                      <Card.Text className="course-desc">
                        {course.description
                          ? course.description.slice(0, 70) + "..."
                          : "ไม่มีคำอธิบาย"}
                      </Card.Text>
                      <p>
                        💰 ราคา: <b>{course.price}</b> บาท
                      </p>

                      <Button
                        variant={buttonVariant}
                        className="course-btn"
                        disabled={disabled}
                        onClick={() => !disabled && handleBuy(course._id)}
                      >
                        {buttonText}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </>
  );
}
