// src/components/common/DropdownSelect.jsx
import React, { useState, useRef, useEffect } from "react";
import "./DropdownSelect.css";

const DropdownSelect = ({
  label = "Select",
  options = [],
  value = "",
  onChange = () => {},
  placeholder = "Select...",
  required = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className={`dropdown-wrapper ${className}`} ref={ref}>
      {label && (
        <label className="dropdown-label">
          {label} {required && <span className="dropdown-required">*</span>}
        </label>
      )}

      <button
        type="button"
        className="dropdown-btn"
        onClick={() => setOpen(!open)}
      >
        <span className={`dropdown-value ${value ? "has-value" : "placeholder"}`}>
          {value || placeholder}
        </span>
        <span className="dropdown-caret">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="dropdown-list">
          {options.map((opt) => (
            <li
              key={opt}
              className="dropdown-item"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DropdownSelect;
