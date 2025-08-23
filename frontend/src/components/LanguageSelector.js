import React from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ language, onLanguageChange }) => {
  const languageOptions = [
    { value: 'en-US', label: 'English', flag: '🇺🇸', name: 'English' },
    { value: 'es-ES', label: 'Spanish', flag: '🇪🇸', name: 'Español' },
    { value: 'fr-FR', label: 'French', flag: '🇫🇷', name: 'Français' },
    { value: 'de-DE', label: 'German', flag: '🇩🇪', name: 'Deutsch' },
    { value: 'it-IT', label: 'Italian', flag: '🇮🇹', name: 'Italiano' },
    { value: 'pt-BR', label: 'Portuguese', flag: '🇧🇷', name: 'Português' }
  ];

  return (
    <div className="language-selector">
      <label className="selector-label">
        <span className="label-icon">🌍</span>
        <span className="label-text">Language</span>
      </label>
      
      <div className="language-dropdown-container">
        <select 
          className="language-dropdown"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Select language"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.flag} {option.name}
            </option>
          ))}
        </select>
        
        <div className="dropdown-icon">⌄</div>
      </div>
      
      <div className="language-description">
        <small>
          Stories and audio will be generated in the selected language.
        </small>
      </div>
    </div>
  );
};

export default LanguageSelector;
