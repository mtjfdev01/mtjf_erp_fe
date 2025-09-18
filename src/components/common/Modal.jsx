import React from 'react';
import './Modal.css';

const Modal = ({ open, onClose, details, title }) => {
  if (!open) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content">
        <button className="custom-modal-close" onClick={onClose}>&times;</button>
        <h2>{title || 'Details'} : </h2>
        <div className="custom-modal-details">
          {details ? (
            <ul>
              {Object.entries(details).map(([key, value]) => (
                <li key={key}> <span style={{color: 'GrayText'}}>{key}:</span> <strong>{String(value)}</strong></li>
              ))}
            </ul>
          ) : (
            <p>No details available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal; 