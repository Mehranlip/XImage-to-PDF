import express from 'express';
import formidable from 'formidable';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 4000;

// Enable CORS for all routes
app.use(cors());

// Middleware for serving static files
app.use(express.static('public'));

// Function to check if the file is a valid image (jpg or png)
const isValidImageFile = (file) => {
    const validMimeTypes = ['image/jpeg', 'image/png'];
    return validMimeTypes.includes(file.mimetype);
};

// Endpoint to handle file upload and create PDF
app.post('/api/upload', (req, res) => {
    console.log('Incoming request to /api/upload');

    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ message: 'Error parsing form' });
        }

        console.log('Uploaded files:', files);

        // Check if files were uploaded
        if (!files.files || files.files.length === 0) {
            console.log('No files uploaded.');
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Validate each file to ensure it's a jpg or png image
        const validFiles = Object.values(files.files).filter(isValidImageFile);
        if (validFiles.length === 0) {
            return res.status(400).json({ message: 'Only JPG and PNG files are allowed' });
        }

        try {
            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();

            // Loop through the valid files and add each image to the PDF
            for (const file of validFiles) {
                const imgPath = file.filepath;
                const imgBytes = fs.readFileSync(imgPath);
                const img = file.mimetype === 'image/jpeg'
                    ? await pdfDoc.embedJpg(imgBytes)
                    : await pdfDoc.embedPng(imgBytes); // Handle both JPG and PNG

                const page = pdfDoc.addPage([img.width, img.height]);

                page.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height,
                });
            }

            // Save the PDF to a file
            const pdfBytes = await pdfDoc.save();
            const outputPath = path.join(process.cwd(), 'public', 'output.pdf');
            fs.writeFileSync(outputPath, pdfBytes);

            console.log('PDF created successfully!');
            res.status(200).json({ message: 'PDF created', pdfUrl: '/output.pdf' });
        } catch (error) {
            console.error('Error creating PDF:', error);
            res.status(500).json({ message: 'Error creating PDF' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
