import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import LoadingSpinner from './LoadingSpinner';
import './ImageModal.css';

const ImageModal = ({ imagePreview, onGenerate, onClose, isLoading, narrationData }) => {
  const [showText, setShowText] = useState(false);
  const audioPlayerRef = useRef(null);

  // Auto-play audio when narration data becomes available
  useEffect(() => {
    if (narrationData && narrationData.audio_url && audioPlayerRef.current) {
      setTimeout(() => {
        audioPlayerRef.current.play();
      }, 500);
    }
  }, [narrationData]);

  const handleGenerate = () => {
    onGenerate();
  };

  // Only show loading or results, not both buttons
  const showInitialButtons = !isLoading && !narrationData;
  const showResults = !isLoading && narrationData;

  return (
    <div className="image-modal-overlay" onClick={!isLoading && !narrationData ? onClose : undefined}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close" 
          onClick={onClose}
          disabled={isLoading}
        >
          ×
        </button>
        
        <div className="modal-content">
          <img 
            src={imagePreview} 
            alt="Selected book page" 
            className="modal-image"
          />
          
          {isLoading && (
            <div className="modal-loading">
              <LoadingSpinner />
            </div>
          )}

          {showInitialButtons && (
            <div className="modal-actions">
              <button 
                onClick={handleGenerate}
                className="generate-btn"
              >
                Tell Me About This Picture!
              </button>
              <button 
                onClick={onClose}
                className="change-btn"
              >
                Choose Different Picture
              </button>
            </div>
          )}

          {showResults && (
            <div className="modal-results">
              <div className="audio-section">
                <AudioPlayer
                  ref={audioPlayerRef}
                  audioUrl={`http://localhost:8000${narrationData.audio_url}`}
                  showTextButton={true}
                  onShowText={() => setShowText(!showText)}
                  showingText={showText}
                  onError={() => console.error('Audio playback failed')}
                />
              </div>

              {showText && (
                <div className="modal-text-content">
                  <div className="narration-text">
                    <p>{narrationData.narration_text}</p>
                  </div>

                  {narrationData.question && (
                    <div className="question-section">
                      <h4 className="question-title">Think About This:</h4>
                      <p className="question-text">{narrationData.question}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-bottom-actions">
                <button onClick={onClose} className="done-btn">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
