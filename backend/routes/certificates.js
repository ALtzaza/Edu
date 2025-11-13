import express from "express";
import { Certificate, User, Course } from "../models/schema.models.js";

import { getCertificateHtml } from "../utils/htmlTemplate.js";
import { generatePdfFromHtml } from "../utils/pdfGenerator.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";


const router = express.Router();

const MOCK_USER_ID = "68fb69f249ed00d001f1d029";
const MOCK_ADMIN_ID = "660000000000000000000001";

// API: (นักเรียน) ดูใบ Certificate ทั้งหมดของตัวเอง
// ต้องมี auth middleware ที่ set req.user
router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    console.log("--- GET /me ---");
    console.log("userId:", userId);
    
    if (!userId) {
      return res.status(401).send({ message: "Unauthorized: No user info" });
    }
    const certificates = await Certificate.find({ user: userId })
      .populate("course", "title instructor")
      .populate("approvedBy", "name");
    res.status(200).send(certificates);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});



// API: ดาวน์โหลด Certificate เป็น PDF
router.get("/:id/download", async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert || !cert.certificateData) {
      return res.status(404).send({ message: "Certificate not found or data missing" });
    }

    // -- Check if data is Base64 or number array ---
    let pdfBuffer;
    // Simple check: Base64 usually doesn't contain commas
    if (cert.certificateData.includes(',')) {
      // Data is likely the number array string "37,80,..."
      console.log("Decoding PDF from number array string...");
      const byteArray = cert.certificateData.split(',').map(Number);
      pdfBuffer = Buffer.from(byteArray);
    } else {
      // Data is likely Base64
      console.log("Decoding PDF from Base64 string...");
      pdfBuffer = Buffer.from(cert.certificateData, "base64");
    }
    // --- End Check ---


    // --- ‼️ Change 'inline' to 'attachment' here ‼️ ---
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${cert._id}.pdf"`, // Force download
    });
    // --- End Change ---

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error downloading certificate:", err);
    res.status(500).send({ message: "Error retrieving certificate", error: err.message });
  }
});


// API: (นักเรียน) ขอ Certificate ให้ตัวเอง (ต้องเรียนครบ)
// ต้องมี auth middleware ที่ set req.user
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { courseId } = req.body;
    const adminId = MOCK_ADMIN_ID;
    
    console.log("--- POST /api/certificates ---");
    console.log("userId:", userId);
    console.log("courseId:", courseId);
    console.log("req.user:", req.user);
    
    if (!userId || !courseId) {
      return res.status(400).json({ message: "userId (from token) and courseId are required" });
    }
    
    const existingCert = await Certificate.findOne({ user: userId, course: courseId });
    if (existingCert) {
      return res.status(409).json({ message: "Certificate already exists" });
    }
    
    // ดึงข้อมูล "ชื่อ" จริงเพื่อใช้ใน PDF
    const user = await User.findById(userId).select("name");
    const course = await Course.findById(courseId).select("title");
    
    console.log("user found:", !!user, user?.name);
    console.log("course found:", !!course, course?.title);
    
    if (!user || !course) {
      return res.status(404).json({ message: "User or Course not found" });
    }
    
    const issueDate = new Date();
    
    try {
      const htmlContent = getCertificateHtml(user.name, course.title, issueDate);
      console.log("HTML generated, starting PDF generation...");
      
      const pdfBuffer = await generatePdfFromHtml(htmlContent);
      console.log("PDF generated successfully, size:", pdfBuffer.length);
      
      const pdfBase64 = pdfBuffer.toString("base64");
      
      const newCertificate = new Certificate({
        user: userId,
        course: courseId,
        certificateData: pdfBase64,
        approvedBy: adminId,
        issueDate: issueDate,
      });
      
      await newCertificate.save();
      console.log("Certificate saved with ID:", newCertificate._id);
      
      const populatedCert = await Certificate.findById(newCertificate._id)
        .populate("course", "title instructor")
        .populate("approvedBy", "name");
      
      res.status(201).send(populatedCert);
    } catch (pdfError) {
      console.error("Error in PDF generation:", pdfError);
      throw new Error(`PDF generation failed: ${pdfError.message}`);
    }
  } catch (error) {
    console.error("Error in POST /api/certificates:", error);
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// API:(Admin) "ยกเลิก/ลบ" Certificate

router.delete("/:certId", async (req, res) => {
  try {
    const { certId } = req.params;

    const deletedCert = await Certificate.findByIdAndDelete(certId);

    if (!deletedCert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

export default router;
