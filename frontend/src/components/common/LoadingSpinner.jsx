import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Yükleniyor...' }) {
  return (
    <div className="spinner-container">
      <div className="loading-spinner"></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}
