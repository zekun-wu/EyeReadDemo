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
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [gazeData, setGazeData] = useState(null);
  const [isEyeTrackingActive, setIsEyeTrackingActive] = useState(false);
  const audioPlayerRef = useRef(null);
  const gazeIntervalRef = useRef(null);

  // Sample images from the pictures folder
  const allImages = [
    'http://localhost:8000/pictures/1.jpg',
    'http://localhost:8000/pictures/2.jpg',
    'http://localhost:8000/pictures/3.jpg',
    'http://localhost:8000/pictures/4.jpg',
    'http://localhost:8000/pictures/5.jpg'
  ];

  // Now showing 1 image per page
  const totalPages = allImages.length;

  // Get current page image
  const getCurrentPageImage = () => {
    return allImages[currentPage];
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

  const handleEnterEyeTrackingMode = async () => {
    try {
      console.log('🎯 Starting Eye-Tracking Mode...');
      
      // Step 1: Connect to Tobii eye tracker
      console.log('🔌 Connecting to Tobii Pro Fusion...');
      const connectResponse = await fetch('http://localhost:8000/eye-tracking/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const connectResult = await connectResponse.json();
      console.log('Connection result:', connectResult);
      
      if (!connectResult.success) {
        throw new Error(connectResult.message || 'Failed to connect to eye tracker');
      }
      
      // Step 2: Set current image context
      const currentImageFile = getCurrentPageImage().split('/').pop(); // Extract filename
      console.log(`📸 Setting image context to: ${currentImageFile}`);
      
      const imageFormData = new FormData();
      imageFormData.append('image_filename', currentImageFile);
      
      const setImageResponse = await fetch('http://localhost:8000/eye-tracking/set-image', {
        method: 'POST',
        body: imageFormData,
      });
      
      const setImageResult = await setImageResponse.json();
      console.log('Set image result:', setImageResult);
      
      // Step 3: Start eye tracking
      console.log('👁️ Starting gaze data collection...');
      const startResponse = await fetch('http://localhost:8000/eye-tracking/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const startResult = await startResponse.json();
      console.log('Start tracking result:', startResult);
      
      if (!startResult.success) {
        throw new Error(startResult.message || 'Failed to start eye tracking');
      }
      
      // Step 4: Enter browser fullscreen
      console.log('🖥️ Entering fullscreen mode...');
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      setIsFullscreenMode(true);
      setIsEyeTrackingActive(true);
      
      // Start real-time gaze data fetching
      startGazeDataPolling();
      
      console.log('✅ Eye-Tracking Mode activated successfully!');
      
    } catch (error) {
      console.error('❌ Failed to enter Eye-Tracking Mode:', error);
      alert(`Failed to start Eye-Tracking Mode: ${error.message}`);
      // Still show fullscreen mode even if eye tracking fails
      setIsFullscreenMode(true);
    }
  };

  const startGazeDataPolling = () => {
    // Poll for gaze data every 50ms (20 FPS)
    gazeIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:8000/eye-tracking/gaze-data');
        const result = await response.json();
        
        if (result.success && result.current_position) {
          setGazeData(result.current_position);
        }
      } catch (error) {
        console.error('Error fetching gaze data:', error);
      }
    }, 50);
  };

  const stopGazeDataPolling = () => {
    if (gazeIntervalRef.current) {
      clearInterval(gazeIntervalRef.current);
      gazeIntervalRef.current = null;
    }
    setGazeData(null);
  };

  const handleExitFullscreen = async () => {
    try {
      console.log('🛑 Exiting Eye-Tracking Mode...');
      
      // Stop gaze data polling
      stopGazeDataPolling();
      setIsEyeTrackingActive(false);
      
      // Stop eye tracking
      console.log('⏸️ Stopping gaze data collection...');
      const stopResponse = await fetch('http://localhost:8000/eye-tracking/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const stopResult = await stopResponse.json();
      console.log('Stop tracking result:', stopResult);
      
    } catch (error) {
      console.error('⚠️ Error stopping eye tracking:', error);
      // Continue with exit even if stopping fails
    }
    
    setIsFullscreenMode(false);
    // Exit browser fullscreen if active
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    
    console.log('✅ Eye-Tracking Mode deactivated');
  };

  // Listen for ESC key to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isFullscreenMode) {
        handleExitFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      // If browser exits fullscreen but component thinks it's still fullscreen
      if (!document.fullscreenElement && isFullscreenMode) {
        setIsFullscreenMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreenMode]);

  // Cleanup gaze polling on component unmount
  React.useEffect(() => {
    return () => {
      stopGazeDataPolling();
    };
  }, []);

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

  // If in fullscreen mode, render only the image
  if (isFullscreenMode) {
    return (
      <div className="fullscreen-eye-tracking">
        <img
          src={getCurrentPageImage()}
          alt={`Picture book page ${currentPage + 1}`}
          className="fullscreen-image"
        />
        
        {/* Gaze indicator */}
        {isEyeTrackingActive && gazeData && (
          <div
            className="gaze-indicator"
            style={{
              left: `${gazeData.x}px`,
              top: `${gazeData.y}px`,
            }}
          />
        )}
        
        {/* Eye tracking status */}
        <div className="eye-tracking-status">
          <div className={`status-indicator ${isEyeTrackingActive ? 'active' : 'inactive'}`}>
            {isEyeTrackingActive ? '👁️ Eye Tracking Active' : '⏸️ Eye Tracking Paused'}
          </div>
          {gazeData && (
            <div className="gaze-coords">
              X: {Math.round(gazeData.x)}, Y: {Math.round(gazeData.y)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="picture-book">
      {/* Compact header with back button and navigation */}
      <div className="compact-header">
        <button 
          className="back-button"
          onClick={onBackToModeSelect}
        >
          ← Back to Mode Selection
        </button>
        
        <div className="top-navigation">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="nav-button prev-button"
          >
            ← Previous
          </button>
          
          <div className="page-info">
            <span className="page-counter">
              Page {currentPage + 1} of {totalPages}
            </span>
            {selectedImages.size > 0 && (
              <span className="selection-counter">
                ✓ Ready!
              </span>
            )}
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="nav-button next-button"
          >
            Next →
          </button>
        </div>
        
        {/* Eye-tracking mode button on the right */}
        <button
          onClick={handleEnterEyeTrackingMode}
          className="eye-tracking-button"
        >
          👁️ Eye-Tracking Mode
        </button>
      </div>

      {/* Main image area - takes most of the space */}
      <div className="main-image-area">
          <div
            className={`image-card ${selectedImages.has(getCurrentPageImage()) ? 'selected' : ''}`}
            onClick={() => handleImageSelect(getCurrentPageImage())}
          >
            <img
              src={getCurrentPageImage()}
              alt={`Picture book page ${currentPage + 1}`}
              className="book-image"
            />
            <div className="image-overlay">
              {selectedImages.has(getCurrentPageImage()) && (
                <div className="selection-indicator">✓</div>
              )}
            </div>
          </div>
        </div>

      {/* Compact bottom section - always visible when image selected */}
      {selectedImages.size > 0 && (
        <div className="bottom-section">
          {/* Show button only if no narration yet, otherwise show player directly */}
          {!narrationData && !isLoading && (
            <div className="bottom-controls">
              <button
                onClick={generateDescription}
                className="describe-button"
              >
                🎭 Tell Me About This Image
              </button>
            </div>
          )}

          {/* Loading state - compact */}
          {isLoading && (
            <div className="loading-section">
              <LoadingSpinner />
              <span className="loading-text">Creating your story...</span>
            </div>
          )}

          {/* Error state - compact */}
          {error && (
            <div className="error-section">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {/* Audio player - compact and always visible when story is ready */}
          {narrationData && (
            <div className="compact-player-section">
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
                <div className="compact-transcript">
                  <p>{narrationData.narration_text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PictureBook;
