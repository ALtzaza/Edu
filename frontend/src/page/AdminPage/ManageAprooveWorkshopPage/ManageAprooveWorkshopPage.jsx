import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import "./ManageAprooveWorkshopPage.css";

const ManageAprooveWorkshopPage = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [filterStatus, setFilterStatus] = useState("pending");

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const res = await api.get("/workshops");
        console.log("Data from API:", res.data.workshops);
        setWorkshops(res.data.workshops || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkshops();
  }, []);

  const handleFeedbackChange = (id, value) => {
    setFeedbacks((prev) => ({ ...prev, [id]: value }));
  };

  const handleReview = async (workshopId, status) => {
    try {
      const feedback =
        feedbacks[workshopId] ||
        (status === "approved"
          ? "Your workshop has been approved."
          : "Your workshop needs corrections. Please review and resubmit.");

      const body = { status, feedback };
      await api.put(`/workshops/${workshopId}/review`, body);

      setWorkshops((prev) =>
        prev.map((w) => (w._id === workshopId ? { ...w, status, feedback } : w))
      );
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (workshopId) => {
    const confirmDelete = window.confirm(
      "คุณแน่ใจหรือไม่ว่าต้องการลบ Workshop นี้?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/workshops/${workshopId}`);
      setWorkshops((prev) =>
        prev.filter((workshop) => workshop._id !== workshopId)
      );
      alert("ลบ Workshop สำเร็จ");
    } catch (err) {
      alert("ไม่สามารถลบ Workshop ได้: " + err.message);
    }
  };

  const filteredWorkshops =
    filterStatus === "all"
      ? workshops
      : workshops.filter((w) => w.status === filterStatus);

  if (loading) return <div className="admin-loading">Loading Workshops...</div>;
  if (error) return <div className="admin-error">Error: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Manage Workshops</h1>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filterStatus === status ? "active" : ""}`}
            onClick={() => setFilterStatus(status)}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course</th>
              {/* <th>Section</th> */}
              <th>Lesson</th>
              <th>User</th>
              <th>Status</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkshops.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#aaa" }}>
                  No workshops found for this status.
                </td>
              </tr>
            ) : (
              filteredWorkshops.map((workshop) => (
                <tr key={workshop._id}>
                  
                  <td>{workshop.course?.title || "-"}</td>
                  {/* <td>{workshop.section?.title || "-"}</td> */}
                  <td>{workshop.lesson?.title || "-"}</td>
                  <td>{workshop.user ? (workshop.user.username || workshop.user.name || "Unknown") : "Unknown"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        workshop.status === "approved"
                          ? "approved"
                          : workshop.status === "rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {workshop.status ? workshop.status.toUpperCase() : "PENDING"}
                    </span>
                  </td>
                  <td>
                    <textarea
                      className="admin-feedback-textarea"
                      placeholder="Leave feedback..."
                      value={feedbacks[workshop._id] || ""}
                      onChange={(e) =>
                        handleFeedbackChange(workshop._id, e.target.value)
                      }
                    />
                  </td>
                  <td className="actions-cell">
                    {workshop.downloadUrl && (
                      <a
                        href={workshop.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button download-button"
                      >
                        Download
                      </a>
                    )}
                    <button
                      className="action-button approve-button"
                      onClick={() => handleReview(workshop._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="action-button reject-button"
                      onClick={() => handleReview(workshop._id, "rejected")}
                    >
                      Reject
                    </button>
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDelete(workshop._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageAprooveWorkshopPage;
