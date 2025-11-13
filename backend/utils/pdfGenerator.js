import puppeteer from 'puppeteer';

// ฟังก์ชันที่รับ HTML ไปสร้าง PDF Buffer
export async function generatePdfFromHtml(htmlContent) {
    let browser = null;
    try {
        console.log('Starting Puppeteer...');
        browser = await puppeteer.launch({ headless: true });
        console.log('Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('New page created');
        
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        console.log('HTML content set on page');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true
        });
        console.log('PDF generated, buffer size:', pdfBuffer.length);

        return pdfBuffer;

    } catch (err) {
        console.error('Error generating PDF:', err);
        console.error('Error stack:', err.stack);
        throw new Error(`PDF generation failed: ${err.message}`);
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log('Browser closed');
            } catch (closeErr) {
                console.error('Error closing browser:', closeErr.message);
            }
        }
    }
}