import React, { useState } from 'react';
import TasksBoard from './board';
import TasksList from './list';
import { loadTasksViewMode, saveTasksViewMode } from './shared/taskViewMode';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState(loadTasksViewMode);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    saveTasksViewMode(mode);
  };

  if (viewMode === 'list') {
    return <TasksList viewMode={viewMode} onViewModeChange={handleViewModeChange} />;
  }

  return <TasksBoard viewMode={viewMode} onViewModeChange={handleViewModeChange} />;
}
