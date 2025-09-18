import React from 'react';
import './Card.css';

const Card = ({ title, data }) => {
  if (!data) return null;

  const renderValue = (value) => {
    if (typeof value === 'number') {
      // If it's a monetary value (check for specific fields)
      if (title.toLowerCase().includes('amount') || 
          title.toLowerCase().includes('funds') || 
          title.toLowerCase().includes('cash') || 
          title.toLowerCase().includes('inflow') || 
          title.toLowerCase().includes('outflow')) {
        return `$${value.toFixed(2)}`;
      }
      return value;
    }
    return value;
  };

  return (
    <div className="department-card">
      <h3 className="card-title">
        {title.replace(/_/g, ' ')}
      </h3>
      <div className="card-content">
        {Object.entries(data).map(([key, value]) => {
          // Skip metadata fields
          if (['id', 'created_at', 'date'].includes(key)) return null;
          
          return (
            <div key={key} className="data-row">
              <span className="data-label">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
              <span className="data-value">{renderValue(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Card; 