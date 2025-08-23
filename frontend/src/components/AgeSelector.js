import React from 'react';
import './AgeSelector.css';

const AgeSelector = ({ age, onAgeChange }) => {
  const ageOptions = [
    { value: 3, label: '3 years', emoji: '🐣' },
    { value: 4, label: '4 years', emoji: '🦋' },
    { value: 5, label: '5 years', emoji: '🌟' },
    { value: 6, label: '6 years', emoji: '🚀' },
    { value: 7, label: '7 years', emoji: '🎨' },
    { value: 8, label: '8 years', emoji: '📚' },
    { value: 9, label: '9 years', emoji: '🧠' },
    { value: 10, label: '10 years', emoji: '🏆' }
  ];

  return (
    <div className="age-selector">
      <label className="selector-label">
        <span className="label-icon">👶</span>
        <span className="label-text">Child's Age</span>
      </label>
      
      <div className="age-options">
        {ageOptions.map((option) => (
          <button
            key={option.value}
            className={`age-option ${age === option.value ? 'selected' : ''}`}
            onClick={() => onAgeChange(option.value)}
            aria-label={`Select age ${option.label}`}
          >
            <span className="age-emoji">{option.emoji}</span>
            <span className="age-label">{option.label}</span>
          </button>
        ))}
      </div>
      
      <div className="age-description">
        <small>
          Stories are tailored to be age-appropriate and engaging for your child's development level.
        </small>
      </div>
    </div>
  );
};

export default AgeSelector;
