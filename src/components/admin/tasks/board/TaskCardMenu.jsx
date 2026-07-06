import React, { useEffect, useRef } from 'react';
import {
  FiChevronRight,
  FiCornerDownRight,
  FiDroplet,
  FiEdit2,
  FiEye,
  FiMoreVertical,
  FiTrash2,
} from 'react-icons/fi';
import { BOARD_COLUMNS, CARD_COLOR_OPTIONS } from './taskBoardConfig';

export default function TaskCardMenu({
  task,
  open,
  submenu,
  onToggle,
  onSubmenu,
  onClose,
  onView,
  onEdit,
  onDelete,
  onMoveTo,
  onColorChange,
  canView,
  canEdit,
  canDelete,
  canMove,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  const currentStatus = String(task?.status || 'open').toLowerCase();
  const moveTargets = BOARD_COLUMNS.filter((col) => col.id !== currentStatus);

  return (
    <div className="trello-card-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="trello-card-menu-trigger"
        aria-label="Task actions"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <FiMoreVertical />
      </button>

      {open && (
        <div className="trello-card-menu-dropdown">
          <button
            type="button"
            className={`trello-card-menu-item ${submenu === 'color' ? 'trello-card-menu-item--active' : ''}`}
            onClick={() => onSubmenu(submenu === 'color' ? null : 'color')}
          >
            <FiDroplet />
            <span>Change Color</span>
            <FiChevronRight className="trello-card-menu-chevron" />
          </button>
          {submenu === 'color' && (
            <div className="trello-card-menu-submenu">
              {CARD_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="trello-card-menu-subitem"
                  onClick={() => {
                    onColorChange(opt.id);
                    onClose();
                  }}
                >
                  <span
                    className="trello-card-menu-color-swatch"
                    style={{ background: opt.value, borderColor: opt.border }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className={`trello-card-menu-item ${submenu === 'move' ? 'trello-card-menu-item--active' : ''}`}
            onClick={() => onSubmenu(submenu === 'move' ? null : 'move')}
            disabled={!canMove}
          >
            <FiCornerDownRight />
            <span>Move To</span>
            <FiChevronRight className="trello-card-menu-chevron" />
          </button>
          {submenu === 'move' && (
            <div className="trello-card-menu-submenu trello-card-menu-submenu--scroll">
              {moveTargets.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  className="trello-card-menu-subitem"
                  disabled={!canMove}
                  onClick={() => {
                    onMoveTo(col.id);
                    onClose();
                  }}
                >
                  <span
                    className="trello-board-column-dot"
                    style={{ backgroundColor: col.color }}
                  />
                  {col.label}
                </button>
              ))}
            </div>
          )}

          <div className="trello-card-menu-divider" />

          <button
            type="button"
            className="trello-card-menu-item"
            disabled={!canView}
            onClick={() => {
              onView();
              onClose();
            }}
          >
            <FiEye />
            <span>View Task</span>
          </button>

          <button
            type="button"
            className="trello-card-menu-item"
            disabled={!canEdit}
            onClick={() => {
              onEdit();
              onClose();
            }}
          >
            <FiEdit2 />
            <span>Edit Task</span>
          </button>

          <div className="trello-card-menu-divider" />

          <button
            type="button"
            className="trello-card-menu-item trello-card-menu-item--danger"
            disabled={!canDelete}
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <FiTrash2 />
            <span>Delete Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
