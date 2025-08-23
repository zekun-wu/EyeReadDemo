import React, { useState } from 'react';
import ProfileSetup from './components/ProfileSetup';
import ModeSelector from './components/ModeSelector';
import UploadPage from './components/UploadPage';
import PictureBook from './components/PictureBook';
import './App.css';

function App() {
  const [ageGroup, setAgeGroup] = useState('');
  const [language, setLanguage] = useState('');
  const [currentPage, setCurrentPage] = useState('profile'); // 'profile', 'modeSelect', 'upload', 'storybook'

  const handleProfileSubmit = (profile) => {
    setAgeGroup(profile.ageGroup);
    setLanguage(profile.language);
    setCurrentPage('modeSelect');
  };

  const handleModeSelect = (mode) => {
    if (mode === 'upload') {
      setCurrentPage('upload');
    } else if (mode === 'storybook') {
      setCurrentPage('storybook');
    }
  };

  const handleBackToModeSelect = () => {
    setCurrentPage('modeSelect');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'profile':
        return <ProfileSetup onProfileSubmit={handleProfileSubmit} />;
      
      case 'modeSelect':
        return <ModeSelector onModeSelect={handleModeSelect} />;
      
      case 'upload':
        return (
          <UploadPage 
            ageGroup={ageGroup} 
            language={language} 
            onBackToModeSelect={handleBackToModeSelect}
          />
        );
      
      case 'storybook':
        return (
          <PictureBook 
            ageGroup={ageGroup} 
            language={language} 
            onBackToModeSelect={handleBackToModeSelect}
          />
        );
      
      default:
        return <ProfileSetup onProfileSubmit={handleProfileSubmit} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App;
