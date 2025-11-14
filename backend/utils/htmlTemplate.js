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
                :root {
                    --bg-dark: #111827;       /* Slate 900 */
                    --panel: #1f2937;         /* Slate 800 */
                    --border: #374151;        /* Slate 700 */
                    --text: #e5e7eb;          /* Gray 200 */
                    --muted: #9ca3af;         /* Gray 400 */
                    --accent: #f59e0b;        /* Amber 500 */
                    --brand: #60a5fa;         /* Blue 400 */
                    --success: #10B981;       /* Emerald 500 */
                    --gold: #f59e0b;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: 'Sarabun', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
                    color: var(--text);
                    width: 900px;
                    margin: 32px auto;
                    background: var(--bg-dark);
                }

                .certificate {
                    background: linear-gradient(180deg, #0f172a 0%, #0b1222 100%);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 42px 54px;
                    position: relative;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.45);
                }

                /* Outer decorative border using accent color */
                .certificate::before {
                    content: "";
                    position: absolute;
                    inset: -10px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, rgba(245,158,11,0.8), rgba(96,165,250,0.6));
                    z-index: -1;
                }

                .header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .title {
                    font-family: 'Taviraj', Georgia, serif;
                    font-size: 34px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: var(--accent);
                    margin: 0;
                }
                .subtitle {
                    margin: 8px 0 0;
                    color: var(--muted);
                    font-size: 16px;
                }

                .divider {
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--brand), var(--accent), transparent);
                    margin: 24px 0 32px;
                }

                .name {
                    font-family: 'Taviraj', Georgia, serif;
                    font-size: 42px;
                    font-weight: 800;
                    color: #fff;
                    text-align: center;
                    margin: 6px 0 0;
                }

                .label {
                    text-align: center;
                    color: var(--muted);
                    font-size: 16px;
                    margin-top: 6px;
                }

                .course {
                    text-align: center;
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--brand);
                    margin: 6px 0 18px;
                }

                .date-row {
                    text-align: center;
                    color: var(--muted);
                    font-size: 14px;
                    margin-top: 8px;
                }

                .footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 36px;
                }

                .sign {
                    text-align: center;
                }
                .sign .line {
                    width: 240px;
                    height: 1px;
                    background: var(--border);
                    margin: 26px auto 8px;
                }
                .sign .name {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text);
                }
                .sign .role {
                    font-size: 12px;
                    color: var(--muted);
                }

                .badge {
                    width: 110px;
                    height: 110px;
                    border-radius: 999px;
                    background: radial-gradient(circle at 30% 30%, rgba(245,158,11,0.9), rgba(245,158,11,0.4));
                    border: 2px solid rgba(245,158,11,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #0b1222;
                    font-weight: 900;
                    font-size: 18px;
                    text-transform: uppercase;
                    box-shadow: 0 8px 18px rgba(245,158,11,0.25);
                }

                @media print {
                    body { background: #0b1222; }
                    .certificate::before { inset: -8px; }
                }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="header">
                    <h1 class="title">Certificate of Completion</h1>
                    <p class="subtitle">ขอมอบประกาศนียบัตรฉบับนี้เพื่อแสดงว่า</p>
                </div>

                <div class="divider"></div>

                <div class="name">${userName}</div>
                <div class="label">ได้สำเร็จหลักสูตร</div>
                <div class="course">${courseTitle}</div>
                <div class="date-row">ออกให้ ณ วันที่ ${formattedDate}</div>

                <div class="footer">
                    <div class="sign">
                        <div class="line"></div>
                        <div class="name">Course Instructor</div>
                        <div class="role">ผู้สอน</div>
                    </div>
                    <div class="badge">Tid_Code</div>
                    <div class="sign">
                        <div class="line"></div>
                        <div class="name">Authorized</div>
                        <div class="role">ผู้อนุมัติ</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}