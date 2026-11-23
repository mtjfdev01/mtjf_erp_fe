import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEllipsisVertical } from 'react-icons/fa6';
import './ActionMenu.css';

const ActionMenu = ({ actions, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const handleActionClick = (action) => {
    if (action.onClick) action.onClick();
    close();
  };

  const visibleActions = Array.isArray(actions)
    ? actions.filter((action) => action && action.visible !== false)
    : [];

  const renderAction = (action, index) => {
    const className = `action-menu-item ${action.disabled ? 'action-disabled' : ''}`;

    if (action.to && !action.disabled) {
      return (
        <Link
          key={index}
          to={action.to}
          state={action.state}
          className={className}
          style={{ textDecoration: 'inherit', color: 'inherit' }}
          onClick={close}
        >
          <span className="action-icon" style={{ color: action.color }}>
            {action.icon}
          </span>
          <span className="action-label">{action.label}</span>
        </Link>
      );
    }

    return (
      <button
        key={index}
        type="button"
        className={className}
        onClick={() => !action.disabled && handleActionClick(action)}
        disabled={action.disabled}
      >
        <span className="action-icon" style={{ color: action.color }}>
          {action.icon}
        </span>
        <span className="action-label">{action.label}</span>
      </button>
    );
  };

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        type="button"
        className={`action-menu-trigger${isOpen ? ' action-menu-trigger--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Actions"
      >
        {trigger || <FaEllipsisVertical />}
      </button>

      {isOpen && (
        <>
          <div className="action-menu-backdrop" onClick={close} aria-hidden="true" />
          <div className="action-menu-modal" role="menu">
            {visibleActions.length > 0 ? (
              visibleActions.map(renderAction)
            ) : (
              <div className="action-menu-empty">No actions</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ActionMenu;
