import React from 'react';
import './styles.css';

const FormTextarea = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  isEdit = false,
  className = '',
  rows = 4,
  maxLength,
}) => {
  const inputId = name ? `form-textarea-${name}` : undefined;

  return (
    <div className={`form-group form-textarea-group ${className}`.trim()}>
      {label ? (
        <label className="form-textarea-label" htmlFor={inputId}>
          <span className="form-textarea-label__text">{label}</span>
          {required ? (
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-input form-textarea ${error ? 'form-input--error' : ''}`}
        placeholder={placeholder}
        disabled={disabled || isEdit}
        required={required}
        rows={rows}
        maxLength={maxLength}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default FormTextarea;
