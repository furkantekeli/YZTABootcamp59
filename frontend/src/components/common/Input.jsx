import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    icon: Icon,
    type = 'text',
    id,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`input-group ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={`input ${Icon ? 'input--with-icon' : ''} ${error ? 'input--error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
});

export default Input;
