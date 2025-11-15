import React from 'react';
import './InputField.css';

const InputField = ({ label, type = "text", value, onChange, placeholder = "", error = null, required = false, ...rest }) => {
  console.log('[InputField] rendered, props:', { label, value, error, required, hasOnChange: !!onChange });

  const containerClass = `input-field-container${error ? ' has-error' : ''}`;

  return (
    <div className={containerClass}>
      {label && <label className="input-field-label">{label}{required && <span style={{color:'crimson', marginLeft:6}}>*</span>}</label>}
      <input
        className="input-field-input"
        type={type}
        value={value}
        onChange={(e) => {
          console.log('[InputField] native onChange -> value=', e.target.value);
          if (onChange) onChange(e);
        }}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...rest}
      />
      {error && (
        <div className="input-field-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
};

export default InputField;
