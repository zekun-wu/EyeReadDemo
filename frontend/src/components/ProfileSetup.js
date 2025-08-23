import React, { useState } from 'react';
import './ProfileSetup.css';

const ProfileSetup = ({ onProfileSubmit }) => {
  const [ageGroup, setAgeGroup] = useState('');
  const [language, setLanguage] = useState('');
  const [errors, setErrors] = useState({});

  const ageGroups = [
    { value: '4-5', label: '4 - 5 years' },
    { value: '6-7', label: '6 - 7 years' },
    { value: '8-9', label: '8 - 9 years' }
  ];

  const languages = [
    { value: 'en-US', label: 'English' },
    { value: 'de-DE', label: 'German' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!ageGroup) newErrors.ageGroup = 'Please select an age group';
    if (!language) newErrors.language = 'Please select a language';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onProfileSubmit({ ageGroup, language });
  };

  return (
    <div className="profile-setup">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">Welcome to GlimmerRead</h1>
          <p className="profile-subtitle">Tell us a bit about your child</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label className="form-label">Age Group</label>
            <div className="age-group-options">
              {ageGroups.map((group) => (
                <button
                  key={group.value}
                  type="button"
                  className={`age-group-btn ${ageGroup === group.value ? 'selected' : ''}`}
                  onClick={() => {
                    setAgeGroup(group.value);
                    setErrors(prev => ({ ...prev, ageGroup: '' }));
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>
            {errors.ageGroup && <span className="error-text">{errors.ageGroup}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Language</label>
            <div className="language-options">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  className={`language-btn ${language === lang.value ? 'selected' : ''}`}
                  onClick={() => {
                    setLanguage(lang.value);
                    setErrors(prev => ({ ...prev, language: '' }));
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            {errors.language && <span className="error-text">{errors.language}</span>}
          </div>

          <button type="submit" className="submit-btn">
            Start Reading Journey
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
