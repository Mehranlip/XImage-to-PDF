import express from 'express';
import formidable from 'formidable';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import cors from 'cors'; // Import the CORS module

const app = express();
const PORT = 4000;

// Enable CORS for all routes
app.use(cors()); // Enable CORS

// Middleware for serving static files
app.use(express.static('public'));

// Endpoint to handle file upload and create PDF
app.post('/api/upload', (req, res) => {
    console.log('Incoming request to /api/upload');

    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
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

        const doc = new PDFDocument();
        const outputPath = path.join(process.cwd(), 'public', 'output.pdf');
        const writeStream = fs.createWriteStream(outputPath);

        doc.pipe(writeStream);

        console.log('Processing images...');

        // Add each image to the PDF
        for (const file of Object.values(files.files)) {
            const imgPath = file.filepath;
            console.log(`Adding image to PDF: ${imgPath}`);
            doc.image(imgPath, 0, 0, { fit: [500, 500] });
            doc.addPage();
        }

        doc.end();

        writeStream.on('finish', () => {
            console.log('PDF created successfully!');
            res.status(200).json({ message: 'PDF created', pdfUrl: '/output.pdf' });
        });

        writeStream.on('error', (error) => {
            console.error('Error writing PDF:', error);
            res.status(500).json({ message: 'Error creating PDF' });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
