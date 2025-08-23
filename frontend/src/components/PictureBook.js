import React, { useState, useRef } from 'react';
import AudioPlayer from './AudioPlayer';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './PictureBook.css';

const PictureBook = ({ ageGroup, language, onBackToModeSelect }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [narrationData, setNarrationData] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioPlayerRef = useRef(null);

  // Sample images from the pictures folder
  const allImages = [
    'http://localhost:8000/pictures/1.png',
    'http://localhost:8000/pictures/2.png',
    'http://localhost:8000/pictures/3.png',
    'http://localhost:8000/pictures/4.png',
    'http://localhost:8000/pictures/5.png',
    'http://localhost:8000/pictures/6.png',
    'http://localhost:8000/pictures/7.png',
    'http://localhost:8000/pictures/8.png',
    'http://localhost:8000/pictures/9.png',
    'http://localhost:8000/pictures/10.png'
  ];

  // Calculate total pages (4 images per page)
  const imagesPerPage = 4;
  const totalPages = Math.ceil(allImages.length / imagesPerPage);

  // Get current page images
  const getCurrentPageImages = () => {
    const startIndex = currentPage * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    return allImages.slice(startIndex, endIndex);
  };

  const handleImageSelect = (imagePath) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imagePath)) {
      newSelected.delete(imagePath);
    } else {
      newSelected.add(imagePath);
    }
    setSelectedImages(newSelected);
    setNarrationData(null);
    setError(null);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setSelectedImages(new Set());
      setNarrationData(null);
      setShowTranscript(false);
      setError(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setSelectedImages(new Set());
      setNarrationData(null);
      setShowTranscript(false);
      setError(null);
    }
  };

  const handleToggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };

  const generateDescription = async () => {
    if (selectedImages.size === 0) {
      setError('Please select at least one image!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get all selected image URLs and extract filenames
      const selectedImageUrls = Array.from(selectedImages);
      const imageFilenames = selectedImageUrls.map(url => url.split('/').pop()); // e.g., ["1.png", "2.png"]
      
      // Join filenames with commas for the backend
      const filenamesString = imageFilenames.join(',');
      
      // Use the backend endpoint that accepts multiple image filenames
      const formData = new FormData();
      formData.append('image_filenames', filenamesString);
      
      // Convert age group to numeric age for backend
      const ageMap = { '4-5': 4, '6-7': 6, '8-9': 8 };
      formData.append('age', ageMap[ageGroup].toString());
      formData.append('language', language);

      const apiResponse = await fetch('http://localhost:8000/generate-from-filename', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Failed to generate description');
      }

      const data = await apiResponse.json();
      setNarrationData(data);

      // Auto-play audio if available
      if (data.audio_url) {
        setTimeout(() => {
          if (audioPlayerRef.current && audioPlayerRef.current.play) {
            try {
              audioPlayerRef.current.play();
              console.log('Audio auto-play started successfully');
            } catch (error) {
              console.log('Auto-play failed, user interaction may be required:', error);
              // Audio auto-play failed, but that's okay - user can click play manually
            }
          }
        }, 800); // Give a bit more time for the component to render
      }

    } catch (err) {
      console.error('Error generating description:', err);
      setError(err.message || 'Something went wrong. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPageImages = getCurrentPageImages();

  return (
    <div className="picture-book">
      <div className="picture-book-header">
        <button 
          className="back-button"
          onClick={onBackToModeSelect}
        >
          ← Back to Mode Selection
        </button>
        <h2 className="picture-book-title">📚 Picture Book Adventure</h2>
        <p className="picture-book-subtitle">
          Select images to hear their stories! Click on the pictures you want to explore.
        </p>
      </div>

      <div className="picture-book-content">
        <div className="page-info">
          <span className="page-counter">
            Page {currentPage + 1} of {totalPages}
          </span>
          {selectedImages.size > 0 && (
            <span className="selection-counter">
              {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        <div className="images-grid">
          {currentPageImages.map((imagePath, index) => (
            <div
              key={imagePath}
              className={`image-card ${selectedImages.has(imagePath) ? 'selected' : ''}`}
              onClick={() => handleImageSelect(imagePath)}
            >
              <img
                src={imagePath}
                alt={`Picture book page ${currentPage * imagesPerPage + index + 1}`}
                className="book-image"
              />
              <div className="image-overlay">
                {selectedImages.has(imagePath) && (
                  <div className="selection-indicator">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="book-controls">
          <div className="navigation-controls">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="nav-button prev-button"
            >
              ← Previous
            </button>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="nav-button next-button"
            >
              Next →
            </button>
          </div>

          <div className="action-controls">
            {selectedImages.size > 0 && (
              <button
                onClick={generateDescription}
                disabled={isLoading}
                className="describe-button"
              >
                {isLoading ? 'Creating Story...' : 
                 selectedImages.size === 1 ? 
                 '🎭 Tell Me About This Image' : 
                 `🎭 Tell Me a Story About These ${selectedImages.size} Images`}
              </button>
            )}
          </div>
        </div>

        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {narrationData && (
          <div className="narration-section">
            <div className="narration-content">
              <h3 className="narration-title">🌟 Story Time!</h3>
              
              {narrationData.audio_url && (
                <AudioPlayer
                  ref={audioPlayerRef}
                  audioUrl={`http://localhost:8000${narrationData.audio_url}`}
                  onError={() => setError('Audio playback failed, but you can still read the text below!')}
                  showTranscriptButton={true}
                  onToggleTranscript={handleToggleTranscript}
                  showingTranscript={showTranscript}
                />
              )}
              
              {showTranscript && (
                <div className="narration-text">
                  <p>{narrationData.narration_text}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PictureBook;
