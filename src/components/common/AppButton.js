// src/components/AppButton.jsx
import React from 'react';

const AppButton = ({
  title,
  onClick,
  type = "button",
  disabled = false,
  ...rest
}) => {
  return (
    <button
      className="app-button"
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {title}
    </button>
  );
};

export default AppButton;
