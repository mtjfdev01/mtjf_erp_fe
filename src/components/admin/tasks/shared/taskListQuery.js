export const EMPTY_TASK_FILTERS = {
  search: '',
  department: '',
  project_name: '',
  status: '',
  priority: '',
  team_filter: 'all',
  team_filter_user_id: '',
};

export function mapActiveTabToViewType(activeTab) {
  const map = {
    assigned_to_me: 'assigned',
    assigned_to_team: 'direct_reports',
    other_tasks: 'other_tasks',
    approval_tasks: 'approval_tasks',
    all: 'all',
  };
  return map[activeTab] || 'assigned';
}

export function buildTasksSearchPayload({
  currentPage,
  pageSize,
  sortField,
  sortOrder,
  appliedFilters,
  assigneeId,
  activeTab,
}) {
  const filters = {
    search: appliedFilters.search || undefined,
    department: appliedFilters.department || undefined,
    project_name: appliedFilters.project_name || undefined,
    status: appliedFilters.status || undefined,
    priority: appliedFilters.priority || undefined,
    view_type: mapActiveTabToViewType(activeTab),
  };

  if (assigneeId) {
    filters.assignee_id = assigneeId;
  }

  // Only apply team_filter narrowing if the user explicitly selected a mode other than 'all'
  // and the view is not "Assigned by me" (which is specifically tasks created by currentUser).
  const teamMode = String(appliedFilters.team_filter || 'all')
    .trim()
    .toLowerCase();
  if (teamMode && teamMode !== 'all' && activeTab !== 'other_tasks') {
    filters.team_filter = teamMode;
    if (teamMode === 'user' && appliedFilters.team_filter_user_id) {
      filters.team_filter_user_id = appliedFilters.team_filter_user_id;
    }
  }

  return {
    pagination: {
      page: currentPage,
      pageSize,
      sortField,
      sortOrder,
    },
    filters,
  };
}
