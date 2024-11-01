// CustomLegend.jsx
import React from 'react';

const CustomLegend = ({ labels, onToggleVisibility, visibleIndexes, parkingLotName }) => {
  return (
    <div className="custom-legend-container">
      <ul className="custom-legend">
        {labels.map((label, index) => (
          <li
            key={index}
            onClick={() => onToggleVisibility(index, parkingLotName)}
            style={{ cursor: 'pointer' }}
            className="legend-item"
          >
            <span
              className="color-indicator"
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: visibleIndexes.includes(index) ? label.color : '#e0e0e0',
                marginRight: '8px',
                borderRadius: '3px'
              }}
            ></span>
            <span className="label-text">{label.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomLegend;