import React, { useState, useRef } from 'react';
import ImageUploader from './ImageUploader';
import AudioPlayer from './AudioPlayer';
import ImageModal from './ImageModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './UploadPage.css';

const UploadPage = ({ ageGroup, language, onBackToModeSelect }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [narrationData, setNarrationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const audioPlayerRef = useRef(null);

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setNarrationData(null);
    setError(null);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setImagePreview(null);
    setNarrationData(null);
    setShowTranscript(false);
  };

  const handleToggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };

  const generateNarration = async () => {
    if (!selectedImage) {
      setError('Please select an image first!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const ageMap = { '4-5': 4, '6-7': 6, '8-9': 8 };
      formData.append('age', ageMap[ageGroup].toString());
      formData.append('language', language);

      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate narration');
      }

      const data = await response.json();
      setNarrationData(data);

      if (data.audio_url && audioPlayerRef.current) {
        setTimeout(() => {
          audioPlayerRef.current.play();
        }, 1000);
      }

    } catch (err) {
      console.error('Error generating narration:', err);
      setError(err.message || 'Something went wrong. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-page-header">
        <button 
          className="back-button"
          onClick={onBackToModeSelect}
        >
          ← Back to Mode Selection
        </button>
        <h1 className="upload-page-title">📷 Upload Your Picture</h1>
        <p className="upload-page-subtitle">Share a photo and let AI create a magical story!</p>
      </div>

      <div className="upload-page-content">
        <div className="upload-section">
          <ImageUploader onImageSelect={handleImageSelect} />
        </div>

        {imagePreview && !showImageModal && (
          <div className="selected-image-preview">
            <img src={imagePreview} alt="Selected book page" className="preview-image" />
            <button onClick={() => setShowImageModal(true)} className="change-image-btn">
              Change Picture
            </button>
          </div>
        )}

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

      {showImageModal && (
        <ImageModal
          imagePreview={imagePreview}
          onGenerate={generateNarration}
          onClose={closeImageModal}
          isLoading={isLoading}
          narrationData={narrationData}
        />
      )}
    </div>
  );
};

export default UploadPage;
