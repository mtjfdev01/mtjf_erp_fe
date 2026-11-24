import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FaEllipsisVertical } from 'react-icons/fa6';
import './ActionMenu.css';

const MENU_MIN_WIDTH = 180;
const VIEWPORT_PAD = 8;

const ActionMenu = ({ actions, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: MENU_MIN_WIDTH });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = Math.max(MENU_MIN_WIDTH, menuEl?.offsetWidth || MENU_MIN_WIDTH);
    const menuHeight = menuEl?.offsetHeight || 0;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
      setCoords({ top: 0, left: 0, width: menuWidth, mobile: true });
      return;
    }

    let left = rect.right - menuWidth;
    left = Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD);
    left = Math.max(VIEWPORT_PAD, left);

    let top = rect.bottom + 4;
    if (menuHeight > 0 && top + menuHeight > window.innerHeight - VIEWPORT_PAD) {
      top = Math.max(VIEWPORT_PAD, rect.top - menuHeight - 4);
    }

    setCoords({ top, left, width: menuWidth, mobile: false });
  };

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      const inTrigger = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setIsOpen(false);
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

  const menu =
    isOpen &&
    createPortal(
      <>
        <div className="action-menu-backdrop" onClick={close} aria-hidden="true" />
        <div
          className={`action-menu-modal${coords.mobile ? ' action-menu-modal--mobile' : ''}`}
          role="menu"
          ref={menuRef}
          style={
            coords.mobile
              ? undefined
              : {
                  top: coords.top,
                  left: coords.left,
                  minWidth: coords.width,
                }
          }
        >
          {visibleActions.length > 0 ? (
            visibleActions.map(renderAction)
          ) : (
            <div className="action-menu-empty">No actions</div>
          )}
        </div>
      </>,
      document.body,
    );

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`action-menu-trigger${isOpen ? ' action-menu-trigger--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Actions"
      >
        {trigger || <FaEllipsisVertical />}
      </button>
      {menu}
    </div>
  );
};

export default ActionMenu;
