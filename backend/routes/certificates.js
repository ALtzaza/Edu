import express from "express";
import { Certificate, User, Course } from "../models/schema.models.js";

import { getCertificateHtml } from "../utils/htmlTemplate.js";
import { generatePdfFromHtml } from "../utils/pdfGenerator.js";


const router = express.Router();

const MOCK_USER_ID = "68fb69f249ed00d001f1d029";
const MOCK_ADMIN_ID = "660000000000000000000001";

// API: (นักเรียน) ดูใบ Certificate ทั้งหมดของตัวเอง
router.get("/api/certificates/me", async (req, res) => {
  try {
    // (ในอนาคต: const userId = req.user._id;)
    const userId = MOCK_USER_ID;

    const certificates = await Certificate.find({ user: userId })
      .populate("course", "title instructor") // ดึง "title" และ "instructor" จาก Model 'Course'
      .populate("approvedBy", "name"); // ดึง "name" จาก Model 'User' (ที่เป็น Admin)

    res.status(200).send(certificates);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});



// API: ดาวน์โหลด Certificate เป็น PDFun 
router.get("/api/certificates/:id/download", async (req, res) => {
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


// API: (Admin) ออก Certificate ให้ User (เวอร์ชันอัปเกรด)
router.post("/api/certificates", async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const adminId = MOCK_ADMIN_ID;

    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ message: "userId and courseId are required" });
    }

    const existingCert = await Certificate.findOne({
      user: userId,
      course: courseId,
    });
    if (existingCert) {
      return res.status(409).json({ message: "Certificate already exists" });
    }

    // -----  Logic 

    //  ดึงข้อมูล "ชื่อ" จริงเพื่อใช้ใน PDF
    console.log("Fetching user and course data...");
    const user = await User.findById(userId).select("name");
    const course = await Course.findById(courseId).select("title");

    if (!user || !course) {
      return res.status(404).json({ message: "User or Course not found" });
    }

    const issueDate = new Date();

    // สร้าง HTML สำหรับ Certificate
    console.log("Generating HTML...");
    const htmlContent = getCertificateHtml(user.name, course.title, issueDate);

    //  สร้าง PDF Buffer 
    console.log("Generating PDF Buffer...");
    const pdfBuffer = await generatePdfFromHtml(htmlContent);

    // แปลง Buffer เป็น Base64 String
    const pdfBase64 = pdfBuffer.toString("base64");

    // ----- ‼จบ Logic 

    const newCertificate = new Certificate({
      user: userId,
      course: courseId,
      certificateData: pdfBase64,
      approvedBy: adminId,
      issueDate: issueDate,
    });

    await newCertificate.save();
    // ส่งข้อมูลที่ populate แล้วกลับไปให้ client
    const populatedCert = await Certificate.findById(newCertificate._id)
      .populate("course", "title instructor")
      .populate("approvedBy", "name");

    res.status(201).send(populatedCert);
  } catch (error) {
    console.error("Error in POST /api/certificates:", error);
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// API:(Admin) ดู Certificate ทั้งหมดที่ออกให้ Course นี้

router.get("/api/courses/:courseId/certificates", async (req, res) => {
  try {
    const { courseId } = req.params;

    // ค้นหา Certificate ทั้งหมดที่ "course" field ตรงกับ courseId
    const certificates = await Certificate.find({ course: courseId }).populate(
      "user",
      "name"
    ); // ดึง "name" ของ User (นักเรียน)

    res.status(200).send(certificates);
  } catch (error) {
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});

// API:(Admin) "ยกเลิก/ลบ" Certificate

router.delete("/api/certificates/:certId", async (req, res) => {
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
