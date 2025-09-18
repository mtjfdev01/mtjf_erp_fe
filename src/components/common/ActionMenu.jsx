import React, { useState } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import './ActionMenu.css';

const ActionMenu = ({ actions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleActionClick = (action) => {
    action.onClick();
    setIsModalOpen(false);
  };

  return (
    <div className="action-menu">
      {/* Desktop View */}
      <div className="action-buttons desktop-view">
        {actions.map((action, index) => (
          action.visible && (
            <button
              key={index}
              className={`action-button ${action.disabled ? 'action-disabled' : ''}`}
              style={{ color: action.color }}
              onClick={() => !action.disabled && handleActionClick(action)}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon}
            </button>
          )
        ))}
      </div>

      {/* Mobile View */}
      <div className="mobile-view">
        <button 
          className="action-menu-trigger"
          onClick={() => setIsModalOpen(true)}
        >
          <FiMoreVertical />
        </button>

        {/* Mobile Modal */}
        {isModalOpen && (
          <>
            <div 
              className="action-menu-backdrop"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="action-menu-modal">
              {actions.map((action, index) => (
                action.visible && (
                  <button
                    key={index}
                    className="action-menu-item"
                    onClick={() => handleActionClick(action)}
                  >
                    <span className="action-icon" style={{ color: action.color }}>
                      {action.icon}
                    </span>
                    <span className="action-label">{action.label}</span>
                  </button>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionMenu; 