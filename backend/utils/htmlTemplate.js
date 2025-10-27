// ฟังก์ชันที่รับข้อมูลไปสร้าง HTML
export function getCertificateHtml(userName, courseTitle, issueDate) {
    const formattedDate = issueDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
           <style>
                body {
                    /* ใช้ฟอนต์ Sarabun เป็นหลัก */
                    font-family: 'Sarabun', sans-serif;
                    font-weight: 400;
                    color: #444;
                    
                    /* Layout ของตัว Certificate */
                    width: 750px; /* กำหนดความกว้างคงที่ */
                    margin: 40px auto; /* จัดกลางหน้าจอแนวนอน */
                    padding: 40px 60px;
                    border: 10px double #b08d57; /* กรอบสีทองแบบสองชั้น */
                    background-color: #fdfdfa; /* สีพื้นหลัง (ขาวครีม) */
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* เพิ่มเงาให้ดูมีมิติ */
                    text-align: center;
                    box-sizing: border-box;
                }

                /* "Certificate of Completion" */
                body > h1:first-of-type {
                    font-family: 'Taviraj', serif; /* ใช้ฟอนต์หัวเรื่องที่ต่างออกไป */
                    font-size: 2.4rem;
                    color: #333;
                    font-weight: 700;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                    margin-top: 10px;
                }

                /* "ขอมอบประกาศนียบัตร..." */
                body > h2:first-of-type {
                    font-size: 1.3rem;
                    font-weight: 500;
                    color: #555;
                    margin-top: 0;
                    margin-bottom: 40px;
                }

                /* ชื่อผู้ใช้ (ตัวใหญ่สุด) */
                body > h1:nth-of-type(2) {
                    font-family: 'Taviraj', serif;
                    font-size: 3.2rem;
                    color: #b08d57; /* สีทองเดียวกับกรอบ */
                    font-weight: 700;
                    margin-top: 20px;
                    margin-bottom: 20px;
                }

                /* "ได้สำเร็จหลักสูตร" */
                body > h2:nth-of-type(2) {
                    font-size: 1.3rem;
                    font-weight: 500;
                    color: #555;
                    margin-top: 30px;
                    margin-bottom: 10px;
                }
                
                /* ชื่อคอร์ส */
                body > h2:nth-of-type(3) {
                    font-family: 'Taviraj', serif;
                    font-size: 2.0rem;
                    font-weight: 600;
                    color: #333;
                    margin-top: 0;
                    margin-bottom: 40px;
                }

                /* วันที่ออก */
                p {
                    font-size: 1.1rem;
                    color: #666;
                    margin-top: 50px;
                }

                /* สำหรับการแสดงผลบนมือถือ */
                @media (max-width: 850px) {
                    body {
                        width: 90%; /*ปรับความกว้างให้พอดีหน้าจอ*/
                        margin: 20px auto;
                        padding: 20px 30px;
                    }
                    body > h1:nth-of-type(2) {
                        font-size: 2.2rem; /* ลดขนาดชื่อ */
                    }
                    body > h1:first-of-type,
                    body > h2:nth-of-type(3) {
                        font-size: 1.6rem; /* ลดขนาดหัวเรื่อง/ชื่อคอร์ส */
                    }
                }
            </style>
        </head>
        <body>
            <h1>Certificate of Completion</h1>
            <h2>ขอมอบประกาศนียบัตรฉบับนี้เพื่อแสดงว่า</h2>
            <h1>${userName}</h1>
            <h2>ได้สำเร็จหลักสูตร</h2>
            <h2>${courseTitle}</h2>
            <p>ออกให้ ณ วันที่ ${formattedDate}</p>
        </body>
        </html>
    `;
}