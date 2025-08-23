import React from 'react';
import './ModeSelector.css';

const ModeSelector = ({ onModeSelect }) => {
  return (
    <div className="mode-selector-container">
      <div className="mode-selector-content">
        <header className="mode-selector-header">
          <h1 className="mode-selector-title">📚 GlimmerRead</h1>
          <p className="mode-selector-subtitle">Choose Your Reading Adventure!</p>
        </header>

        <div className="mode-options">
          <div 
            className="mode-card upload-mode"
            onClick={() => onModeSelect('upload')}
          >
            <div className="mode-icon">📷</div>
            <h2 className="mode-title">Upload Your Picture</h2>
            <p className="mode-description">
              Take a photo or upload an image from your device and let AI tell you an amazing story about it!
            </p>
            <div className="mode-features">
              <div className="feature">✨ AI-powered storytelling</div>
              <div className="feature">🎵 Voice narration</div>
              <div className="feature">📱 Upload any image</div>
            </div>
            <button className="mode-button">
              Start with Upload
            </button>
          </div>

          <div 
            className="mode-card storybook-mode"
            onClick={() => onModeSelect('storybook')}
          >
            <div className="mode-icon">📖</div>
            <h2 className="mode-title">Picture Book Adventure</h2>
            <p className="mode-description">
              Explore a collection of beautiful pictures and discover magical stories hidden within each image!
            </p>
            <div className="mode-features">
              <div className="feature">🎨 Beautiful illustrations</div>
              <div className="feature">📚 Multiple story pages</div>
              <div className="feature">🎭 Interactive storytelling</div>
            </div>
            <button className="mode-button">
              Enter Storybook
            </button>
          </div>
        </div>

        <div className="mode-selector-footer">
          <p>Both modes include age-appropriate content and voice narration!</p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
