import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import './App.css';

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [countdown, setCountdown] = useState(30); 
  const [showDownloadButton, setShowDownloadButton] = useState(false); 

  const onDrop = (acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (validFiles.length === 0) {
      toast.error("Please upload only image files")
      return;
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please select an image before uploading");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error('Error during upload');
      }

      const data = await res.json();
      console.log('PDF created at:', data.pdfUrl);
      setPdfUrl(data.pdfUrl);
      setSelectedFiles([]);
      setShowDownloadButton(true); 
      startCountdown(); 
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(30); 
    const intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalId); 
          setShowDownloadButton(false); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000); 
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="container text-center position-relative">
      <h1 className="title-main">XImage to PDF</h1>
      <h2 className="title-sub">Image to PDF Converter</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <p className="dropzone-text">Drag 'n' drop some files here, or click to select files</p>
        </div>
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h3 className="title-selected-file">Selected Files</h3>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="selected-file position-relative">
                  <img
                    className='rounded'
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                  />
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="remove-btn position-absolute"
                    title="Remove"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="btn-gradient mt-3" disabled={loading}>
          Upload and Create PDF
        </button>
      </form>
      {loading && <img width={50} src="../public/loading1.gif" alt="Loading..." />}
      {pdfUrl && showDownloadButton && ( 
        <div>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <button className='download-link'>
              Download PDF
            </button>
          </a>
          <p className="countdown mt-3">This PDF will be deleted in {countdown} seconds.</p>
        </div>
      )}

      <footer className="footer text-center mt-4 fixed-bottom">
        Developed by ❤️ from <a target='_blank' href='https://github.com/Mehranlip'>Mehran</a>
      </footer>
      <ToastContainer />
    </div>
  );
}

export default App;
