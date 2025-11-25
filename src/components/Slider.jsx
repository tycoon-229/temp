"use client";

import React, { useRef, useEffect, useState } from "react";

const Slider = ({ value = 0, max = 100, onChange, className = "", disabled = false }) => {
  const sliderRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (sliderRef.current) {
      const percent = max > 0 ? (value / max) * 100 : 0;
      sliderRef.current.style.setProperty("--value", `${percent}%`);
    }
  }, [value, max]);

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
  };

  const handleMouseDown = () => setIsActive(true);
  const handleMouseUp = () => setIsActive(false);

  return (
    <div className={`w-full ${className}`}>
      <style jsx>{`
        .slider-input {
          --value: 0%;
          width: 100%;
          height: 5px;
          border-radius: 5px;
          background: linear-gradient(
            to right,
            #22c55e 0%,
            #22c55e var(--value),
            #404040 var(--value),
            #404040 100%
          );
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          transition: background 0.1s;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? '0.5' : '1'};
        }

        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #22c55e;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          box-shadow: ${isActive ? '0 0 0 3px rgba(34, 197, 94, 0.3)' : 'none'};
          transition: all 0.2s ease;
        }

        .slider-input::-webkit-slider-thumb:hover {
          transform: ${disabled ? 'scale(1)' : 'scale(1.3)'};
          background: #16a34a;
          box-shadow: ${disabled ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.4)'};
        }

        .slider-input::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #22c55e;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          border: none;
          box-shadow: ${isActive ? '0 0 0 3px rgba(34, 197, 94, 0.3)' : 'none'};
          transition: all 0.2s ease;
        }

        .slider-input::-moz-range-thumb:hover {
          transform: ${disabled ? 'scale(1)' : 'scale(1.3)'};
          background: #16a34a;
          box-shadow: ${disabled ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.4)'};
        }

        .slider-input::-moz-range-track {
          background: transparent;
          border: none;
        }

        .slider-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max={max || 100}
        value={value}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={disabled}
        className="slider-input"
      />
    </div>
  );
};

export default Slider;
