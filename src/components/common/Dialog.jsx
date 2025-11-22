import React from "react";
import "./dialog.css";

export default function Dialog({ title, children, onClose }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-header">
          {title && <h3>{title}</h3>}
          {onClose && (
            <button className="dialog-close" onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        <div className="dialog-content">{children}</div>
      </div>
    </div>
  );
}