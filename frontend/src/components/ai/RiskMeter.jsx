import React from 'react';
import './RiskMeter.css';

export default function RiskMeter({ score = 1, label = 'Düşük' }) {
  // score ranges from 1 to 10. Normalize for rotation.
  // Semicircle runs from -90deg (value 1) to 90deg (value 10)
  const normalizedScore = Math.max(1, Math.min(10, score));
  const rotation = -90 + (normalizedScore - 1) * 20; // 180 degrees total range / 9 intervals = 20 deg per interval

  const getRiskColor = (lbl) => {
    switch (lbl) {
      case 'Düşük':
        return '#10b981'; // Green
      case 'Orta':
        return '#f59e0b'; // Amber/Yellow
      case 'Yüksek':
        return '#ef4444'; // Red
      case 'Çok Yüksek':
        return '#8b5cf6'; // Purple/Very high
      default:
        return '#3b82f6'; // Blue
    }
  };

  return (
    <div className="risk-meter-container">
      <div className="risk-meter-gauge">
        <div className="gauge-background"></div>
        <div className="gauge-fill" style={{ background: `linear-gradient(90deg, #10b981, #f59e0b, #ef4444)` }}></div>
        <div className="gauge-cover">
          <span className="risk-score-value font-mono">{normalizedScore.toFixed(1)}</span>
          <span className="risk-score-label" style={{ color: getRiskColor(label) }}>{label} Risk</span>
        </div>
        <div className="gauge-needle-hub"></div>
        <div className="gauge-needle" style={{ transform: `rotate(${rotation}deg)` }}></div>
      </div>
      <p className="risk-meter-subtext">Portföyünüzün volatilite oranı baz alınarak hesaplanmıştır.</p>
    </div>
  );
}
