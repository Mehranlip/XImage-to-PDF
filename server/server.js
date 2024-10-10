import express from 'express';
import formidable from 'formidable';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.static('public'));

const isValidImageFile = (file) => {
    const validMimeTypes = ['image/jpeg', 'image/png'];
    return validMimeTypes.includes(file.mimetype);
};

const pdfDir = path.join(process.cwd(), 'pdfs');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
}

app.post('/api/upload', (req, res) => {
    console.log('Incoming request to /api/upload');

    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ message: 'Error parsing form' });
        }

        console.log('Uploaded files:', files);

        if (!files.files || files.files.length === 0) {
            console.log('No files uploaded.');
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const validFiles = Object.values(files.files).filter(isValidImageFile);
        if (validFiles.length === 0) {
            return res.status(400).json({ message: 'Only JPG and PNG files are allowed' });
        }

        try {
            const pdfDoc = await PDFDocument.create();

            for (const file of validFiles) {
                const imgPath = file.filepath;
                const imgBytes = fs.readFileSync(imgPath);
                const img = file.mimetype === 'image/jpeg'
                    ? await pdfDoc.embedJpg(imgBytes)
                    : await pdfDoc.embedPng(imgBytes);

                const page = pdfDoc.addPage([img.width, img.height]);

                page.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height,
                });
            }

            const uniqueName = crypto.randomBytes(16).toString('hex') + '.pdf';
            const outputPath = path.join(pdfDir, uniqueName);

            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(outputPath, pdfBytes);

            console.log('PDF created successfully!');
            res.status(200).json({ message: 'PDF created', pdfUrl: `/pdfs/${uniqueName}` });

          
            setTimeout(() => {
                fs.unlink(outputPath, (err) => {
                    if (err) {
                        console.error('Error deleting PDF:', err);
                    } else {
                        console.log(`PDF ${uniqueName} deleted after 30 seconds.`);
                    }
                });
            }, 30000);

        } catch (error) {
            console.error('Error creating PDF:', error);
            res.status(500).json({ message: 'Error creating PDF' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
