import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  const loadingMessages = [
    "🔍 Looking at your picture...",
    "🧠 Thinking of a wonderful story...",
    "✨ Adding some magic...",
    "🎭 Preparing the narration...",
    "🎵 Getting the voice ready..."
  ];

  const [currentMessage, setCurrentMessage] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  return (
    <div className="loading-spinner">
      <div className="spinner-container">
        <div className="spinner">
          <div className="spinner-book">📖</div>
          <div className="spinner-circle">
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>
        </div>
        
        <div className="loading-message">
          <h3>{loadingMessages[currentMessage]}</h3>
          <p>This usually takes 10-15 seconds...</p>
        </div>
        
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
