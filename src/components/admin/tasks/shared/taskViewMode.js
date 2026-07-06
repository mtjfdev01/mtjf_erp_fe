export const TASKS_VIEW_MODE_KEY = 'tasks-view-mode';

export function loadTasksViewMode() {
  try {
    const value = localStorage.getItem(TASKS_VIEW_MODE_KEY);
    return value === 'list' ? 'list' : 'kanban';
  } catch {
    return 'kanban';
  }
}

export function saveTasksViewMode(mode) {
  if (mode !== 'list' && mode !== 'kanban') return;
  localStorage.setItem(TASKS_VIEW_MODE_KEY, mode);
}
