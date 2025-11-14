// src/components/common/AppButton.jsx
import React from 'react';
import './AppButton.css'; // ملف CSS منفصل للزر

const AppButton = ({
  title = "Button",
  onClick,
  type = "button",
  disabled = false,
  bgColor = "#143a2d",       // اللون الخلفي
  color = "#ffffff",          // لون النص
  width = "100%",             // العرض
  fontSize = "15px",          // حجم الخط
  borderRadius = "8px",       // نصف قطر الزوايا
  padding = "12px",           // padding داخلي
  ...rest
}) => {
  return (
    <button
      className="app-button"
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        color: color,
        width: width,
        fontSize: fontSize,
        borderRadius: borderRadius,
        padding: padding,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      {...rest}
    >
      {title}
    </button>
  );
};

export default AppButton;
