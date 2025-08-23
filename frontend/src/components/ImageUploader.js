import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './ImageUploader.css';

const ImageUploader = ({ onImageSelect }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image is too large! Please choose an image smaller than 10MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, etc.)');
        return;
      }
      
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div className="image-uploader">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="upload-icon">📖</div>
          <h3 className="upload-title">
            {isDragActive ? 'Drop your picture here!' : 'Upload Your Picture Book Page'}
          </h3>
          <p className="upload-description">
            {isDragActive 
              ? 'Let go to upload...' 
              : 'Drag & drop a picture, or click to browse'
            }
          </p>
          <button type="button" className="browse-btn">
            Choose Picture
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
