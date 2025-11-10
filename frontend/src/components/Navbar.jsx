// src/components/Navbar.jsx
import {
  Navbar as BSNavbar,
  Nav,
  Dropdown,
  Image,
  Container,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const avatar =
    user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <BSNavbar style={{ background: "#10162F" }} variant="dark" expand="lg">
      <Container>
        <BSNavbar.Brand
          style={{ cursor: "pointer", fontWeight: 700 }}
          onClick={() => navigate("/dashboard")}
        >
          🎓 MyApp
        </BSNavbar.Brand>

        <BSNavbar.Brand
          style={{ cursor: "pointer", fontWeight: 700 }}
          onClick={() => navigate("/courses")}
        >
          Courses
        </BSNavbar.Brand>

        <Nav className="ms-auto d-flex align-items-center">
          <Dropdown align="end">
            <Dropdown.Toggle
              as="div"
              style={{
                cursor: "pointer",
                color: "white",
              }}
              className="dropdown-toggle"
            >
              <Image
                src={avatar}
                roundedCircle
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  border: "2px solid #fff",
                }}
              />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => navigate("/dashboard")}>
                Dashboard
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/profile")}>
                Profile
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/purchases")}>
                Purchases
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={handleLogout}
                style={{ color: "#d9534f" }}
              >
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </BSNavbar>
  );
}
