// src/components/InputField.jsx
import React from 'react';

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  ...rest
}) => {
  return (
    <div className="input-field-container">
      {label && <label className="input-field-label">{label}</label>}
      <input
        className="input-field-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
};

export default InputField;
