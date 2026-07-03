import React from 'react';
import { ShieldAlert, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';
import './AiInsightCard.css';

export default function AiInsightCard({ type = 'general', title, text }) {
  const getIcon = () => {
    switch (type) {
      case 'risk':
      case 'warning':
        return <ShieldAlert className="insight-icon icon-danger" />;
      case 'recommendation':
      case 'opportunity':
        return <Lightbulb className="insight-icon icon-warning" />;
      case 'performance':
        return <TrendingUp className="insight-icon icon-success" />;
      default:
        return <CheckCircle className="insight-icon icon-primary" />;
    }
  };

  return (
    <div className={`insight-card card-${type} glassmorphism`}>
      <div className="insight-card-header">
        {getIcon()}
        <h4 className="insight-title">{title}</h4>
      </div>
      <div className="insight-body">
        <p>{text}</p>
      </div>
    </div>
  );
}
