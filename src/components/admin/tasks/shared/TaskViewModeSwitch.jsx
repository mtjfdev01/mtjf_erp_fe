import React from 'react';
import { FiGrid, FiList } from 'react-icons/fi';
import './TaskViewModeSwitch.css';

export default function TaskViewModeSwitch({ value = 'kanban', onChange }) {
  return (
    <div className="tkviewmode-switch" role="group" aria-label="Task view mode">
      <button
        type="button"
        className={`tkviewmode-btn ${value === 'list' ? 'tkviewmode-btn--active' : ''}`}
        onClick={() => onChange?.('list')}
        aria-pressed={value === 'list'}
      >
        <FiList />
        <span>List</span>
      </button>
      <button
        type="button"
        className={`tkviewmode-btn ${value === 'kanban' ? 'tkviewmode-btn--active' : ''}`}
        onClick={() => onChange?.('kanban')}
        aria-pressed={value === 'kanban'}
      >
        <FiGrid />
        <span>Board</span>
      </button>
    </div>
  );
}
