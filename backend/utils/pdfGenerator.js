import puppeteer from 'puppeteer';

// ฟังก์ชันที่รับ HTML ไปสร้าง PDF Buffer
export async function generatePdfFromHtml(htmlContent) {
    let browser = null;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true
        });

        return pdfBuffer;

    } catch (err) {
        console.error('Error generating PDF:', err);
        throw new Error('Could not generate PDF');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}