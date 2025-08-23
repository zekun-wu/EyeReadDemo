import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="error-message">
      <div className="error-content">
        <div className="error-icon">😕</div>
        <div className="error-text">
          <h4>Oops! Something went wrong</h4>
          <p>{message}</p>
        </div>
        <button 
          className="error-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss error message"
        >
          ✕
        </button>
      </div>
      
      <div className="error-suggestions">
        <h5>💡 Try these tips:</h5>
        <ul>
          <li>🔄 Try uploading your picture again</li>
          <li>📱 Make sure your internet connection is working</li>
          <li>🖼️ Try a different picture if this one isn't working</li>
          <li>⏰ Wait a moment and try again</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorMessage;
