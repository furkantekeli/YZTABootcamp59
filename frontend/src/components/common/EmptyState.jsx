import React from 'react';
import './EmptyState.css';
import Button from './Button';

export default function EmptyState({
  title,
  message,
  actionText,
  onAction,
  icon: Icon
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-container">
        {Icon ? <Icon size={48} className="empty-state-icon" /> : '📁'}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}
