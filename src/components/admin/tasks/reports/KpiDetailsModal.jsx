import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  FaTimes,
  FaSpinner,
  FaSearch,
  FaRegFolderOpen,
  FaSyncAlt,
  FaLayerGroup,
  FaHourglassHalf,
  FaCheck,
  FaExclamationTriangle,
  FaChartLine,
  FaCalendarAlt,
  FaTasks,
  FaArrowRight,
  FaInfoCircle
} from 'react-icons/fa';
import axiosInstance from '../../../../utils/axios';

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in the client's local timezone.
 */
const getLocalTodayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Status display configuration mapping */
const STATUS_CONFIG = {
  open: { label: 'Open', color: '#077af5' },
  in_progress: { label: 'In Progress', color: '#fccf3a' },
  pending_approval: { label: 'Pending Approval', color: '#A281C7' },
  approved: { label: 'Approved', color: '#61C0AA' },
  completed: { label: 'Completed', color: '#0feb42' },
  closed: { label: 'Closed', color: '#6B7280' },
  rejected: { label: 'Rejected', color: '#f10a1d' },
  cancelled: { label: 'Cancelled', color: '#f10a1d' },
  draft: { label: 'Draft', color: '#94a3b8' },
  blocked: { label: 'Blocked', color: '#dc2626' }
};

/**
 * Returns true if the task status represents a completed/terminal positive outcome.
 */
const isCompletedStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return ['completed', 'closed', 'approved'].includes(s);
};

/**
 * Determines whether a task is overdue relative to today or the selected calendar date.
 */
const isTaskOverdue = (task, todayIso, selectedDay) => {
  const s = String(task.status || '').toLowerCase();
  if (['completed', 'closed', 'approved', 'cancelled'].includes(s)) return false;
  const taskDate = task.due_date || task.recurrence_next_date;
  if (!taskDate) return false;
  const dateStr = String(taskDate).slice(0, 10);
  if (selectedDay && selectedDay < todayIso) {
    return dateStr <= selectedDay;
  }
  return dateStr < todayIso;
};

/**
 * KpiDetailsModal
 * 
 * Interactive popup modal for KPI cards in the Report Dashboard.
 * - Displays a scoped task list for Total Tasks, Pending, Completed, and Overdue cards.
 * - Displays a visual task progress bar & metrics analysis for the Completion Rate card.
 */
const KpiDetailsModal = ({
  isOpen,
  isBackgrounded,
  onClose,
  kpiKey,
  kpiTitle,
  kpiColor,
  activeFilterContext,
  initialStats,
  filterParams,
  selectedDay,
  onSelectTask,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(initialStats || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(kpiKey === 'completion_rate' ? 'progress' : 'list');

  const todayIso = useMemo(() => getLocalTodayIso(), []);
  const prevIsOpenRef = useRef(false);

  // Sync initialStats when modal opens or parent stats update
  useEffect(() => {
    if (isOpen) {
      if (initialStats) {
        setStatsData(initialStats);
      }
      if (!prevIsOpenRef.current) {
        setSearchQuery('');
        setActiveTab(kpiKey === 'completion_rate' ? 'progress' : 'list');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialStats, kpiKey]);

  // Fetch fresh task data from the backend API for the active report filters
  const fetchTaskData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filterParams,
        today: getLocalTodayIso(),
      };
      const res = await axiosInstance.get('/tasks/dashboard/stats', { params });
      const data = res.data?.data || res.data;
      setStatsData(data);
    } catch (err) {
      console.error('Failed to fetch KPI modal tasks:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch task records from database');
    } finally {
      setLoading(false);
    }
  }, [isOpen, filterParams]);

  // Trigger fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTaskData();
    }
  }, [isOpen, fetchTaskData]);

  // Comprehensive refresh handler that triggers parent dashboard update and local modal data refresh
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
      await fetchTaskData();
    } catch (err) {
      console.error('Failed to refresh KPI modal tasks:', err);
      setError(err.response?.data?.message || err.message || 'Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  }, [onRefresh, fetchTaskData]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract task list from statsData
  const allTasks = useMemo(() => {
    return Array.isArray(statsData?.tasks) ? statsData.tasks : [];
  }, [statsData?.tasks]);

  // Filter tasks based on selected KPI card
  const categoryTasks = useMemo(() => {
    switch (kpiKey) {
      case 'total':
        return allTasks;
      case 'pending':
        // Non-completed tasks
        return allTasks.filter((t) => !isCompletedStatus(t.status));
      case 'completed':
        // Completed, closed, or approved tasks
        return allTasks.filter((t) => isCompletedStatus(t.status));
      case 'overdue':
        // Past due and not completed/cancelled
        return allTasks.filter((t) => isTaskOverdue(t, todayIso, selectedDay));
      case 'completion_rate':
        // For completion rate modal list view (shows completed tasks)
        return allTasks.filter((t) => isCompletedStatus(t.status));
      default:
        return allTasks;
    }
  }, [allTasks, kpiKey, todayIso, selectedDay]);

  // Apply search query filter purely on the frontend in memory without API calls
  const displayedTasks = useMemo(() => {
    if (!searchQuery.trim()) return categoryTasks;
    const q = searchQuery.toLowerCase().trim();
    return categoryTasks.filter((t) => {
      const titleMatch = t.title?.toLowerCase().includes(q);
      const idMatch = String(t.id).includes(q);
      const deptMatch = t.department?.toLowerCase().includes(q);
      const projectMatch = t.project_name?.toLowerCase().includes(q);
      const statusMatch = t.status?.toLowerCase().includes(q);
      const priorityMatch = t.priority?.toLowerCase().includes(q);
      const typeMatch = t.task_type?.toLowerCase().includes(q) ||
        (t.task_type === 'recurring' ? 'recurring' : 'one time').includes(q);
      const dateStr = String(t.due_date || t.recurrence_next_date || '');
      const dateMatch = dateStr.includes(q);
      const assigneeMatch = Array.isArray(t.assigned_users_meta) &&
        t.assigned_users_meta.some((u) => u.name?.toLowerCase().includes(q) || String(u.user_id).includes(q));
      return titleMatch || idMatch || deptMatch || projectMatch || statusMatch || priorityMatch || typeMatch || dateMatch || assigneeMatch;
    });
  }, [categoryTasks, searchQuery]);

  // Compute Completion Rate analytics metrics
  const completionMetrics = useMemo(() => {
    const total = statsData?.total_tasks ?? allTasks.length;
    const completed = allTasks.filter((t) => isCompletedStatus(t.status)).length;
    const inProgress = allTasks.filter((t) => ['in_progress', 'pending_approval'].includes(String(t.status || '').toLowerCase())).length;
    const notStarted = allTasks.filter((t) => ['open', 'draft'].includes(String(t.status || '').toLowerCase())).length;
    const overdue = allTasks.filter((t) => isTaskOverdue(t, todayIso, selectedDay)).length;
    const other = Math.max(0, total - completed - inProgress - notStarted);

    let rate = 0;
    if (typeof statsData?.completion_rate === 'number') {
      rate = statsData.completion_rate;
    } else if (total > 0) {
      rate = (completed / total) * 100;
    }

    const pctCompleted = total > 0 ? (completed / total) * 100 : 0;
    const pctInProgress = total > 0 ? (inProgress / total) * 100 : 0;
    const pctNotStarted = total > 0 ? (notStarted / total) * 100 : 0;
    const pctOther = total > 0 ? (other / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      overdue,
      other,
      rate: rate.toFixed(1),
      pctCompleted: pctCompleted.toFixed(1),
      pctInProgress: pctInProgress.toFixed(1),
      pctNotStarted: pctNotStarted.toFixed(1),
      pctOther: pctOther.toFixed(1)
    };
  }, [statsData, allTasks, todayIso, selectedDay]);

  if (!isOpen) return null;

  // Icon mapping for header
  const renderKpiIcon = () => {
    switch (kpiKey) {
      case 'total':
        return <FaLayerGroup />;
      case 'pending':
        return <FaHourglassHalf />;
      case 'completed':
        return <FaCheck />;
      case 'overdue':
        return <FaExclamationTriangle />;
      case 'completion_rate':
        return <FaChartLine />;
      default:
        return <FaTasks />;
    }
  };

  return (
    <div
      className={`task-kpi-modal-overlay ${isBackgrounded ? 'is-backgrounded' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-kpi-modal-title"
    >
      <div
        className={`task-kpi-modal-container task-kpi-modal-container--${kpiColor || 'purple'} task-kpi-modal-container--${kpiKey === 'completion_rate' && activeTab === 'progress' ? 'completion-progress' : 'task-list'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="task-kpi-modal-header">
          <div className="task-kpi-modal-title-group">
            <span className={`task-kpi-modal-icon-badge task-kpi-modal-icon-badge--${kpiColor || 'purple'}`}>
              {renderKpiIcon()}
            </span>
            <div>
              <h3 id="task-kpi-modal-title" className="task-kpi-modal-title">
                {kpiTitle}
              </h3>
              <p className="task-kpi-modal-subtitle">
                {activeFilterContext || 'Current Report Filters'}
              </p>
            </div>
          </div>

          <div className="task-kpi-modal-actions">
            <button
              type="button"
              className="task-kpi-modal-refresh-btn"
              onClick={handleRefresh}
              title="Refresh task data"
              disabled={loading}
              aria-label="Refresh"
            >
              <FaSyncAlt className={loading ? 'task-spin' : ''} />
            </button>
            <button
              type="button"
              className="task-kpi-modal-close-btn"
              onClick={onClose}
              title="Close popup"
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Modal Toolbar / Tab Navigation */}
        <div className="task-kpi-modal-toolbar">
          {kpiKey === 'completion_rate' ? (
            <div className="task-kpi-modal-tabs">
              <button
                type="button"
                className={`task-kpi-modal-tab ${activeTab === 'progress' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('progress')}
              >
                <FaChartLine /> Progress Visualization
              </button>
              <button
                type="button"
                className={`task-kpi-modal-tab ${activeTab === 'list' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <FaCheck /> Completed Tasks ({completionMetrics.completed})
              </button>
            </div>
          ) : (
            <div className="task-kpi-modal-search-wrap">
              <FaSearch className="task-kpi-modal-search-icon" />
              <input
                type="text"
                className="task-kpi-modal-search-input"
                placeholder="Search by title, ID, assignee, or dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="task-kpi-modal-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          )}

          <div className="task-kpi-modal-count-badge">
            {kpiKey === 'completion_rate' ? (
              <span>Rate: <strong>{completionMetrics.rate}%</strong></span>
            ) : (
              <span>
                {displayedTasks.length} {displayedTasks.length === 1 ? 'Task' : 'Tasks'}
                {categoryTasks.length !== displayedTasks.length && ` (of ${categoryTasks.length})`}
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className={`task-kpi-modal-body ${kpiKey === 'completion_rate' && activeTab === 'progress' ? 'task-kpi-modal-body--progress' : 'task-kpi-modal-body--has-table'}`}>
          {loading && !statsData ? (
            <div className="task-kpi-modal-loading">
              <FaSpinner className="task-spin task-kpi-modal-spinner" />
              <h4>Loading task records...</h4>
              <p>Fetching accurate data according to active filters.</p>
            </div>
          ) : error ? (
            <div className="task-kpi-modal-error">
              <FaExclamationTriangle className="task-kpi-modal-error-icon" />
              <h4>Failed to load tasks</h4>
              <p>{error}</p>
              <button
                type="button"
                className="task-kpi-modal-retry-btn"
                onClick={fetchTaskData}
              >
                <FaSyncAlt /> Try Again
              </button>
            </div>
          ) : kpiKey === 'completion_rate' && activeTab === 'progress' ? (
            /* =================================================================
               COMPLETION RATE: Progress Bar & Progress Visualization View
               ================================================================= */
            <div className="task-kpi-progress-view">
              {/* Hero Progress Card */}
              <div className="task-kpi-progress-hero">
                <div className="task-kpi-progress-hero-main">
                  <div className="task-kpi-progress-hero-number">
                    <span className="task-kpi-progress-val">{completionMetrics.rate}</span>
                    <span className="task-kpi-progress-unit">%</span>
                  </div>
                  <div className="task-kpi-progress-hero-meta">
                    <span className="task-kpi-progress-hero-label">Overall Completion Rate</span>
                    <span
                      className={`task-kpi-progress-status-badge ${
                        Number(completionMetrics.rate) >= 80
                          ? 'is-excellent'
                          : Number(completionMetrics.rate) >= 50
                          ? 'is-good'
                          : 'is-needs-work'
                      }`}
                    >
                      {Number(completionMetrics.rate) >= 80
                        ? 'High Completion'
                        : Number(completionMetrics.rate) >= 50
                        ? 'Moderate Progress'
                        : 'Needs Attention'}
                    </span>
                    <p className="task-kpi-progress-hero-desc">
                      <strong>{completionMetrics.completed}</strong> of{' '}
                      <strong>{completionMetrics.total}</strong> total tasks are completed or approved.
                    </p>
                  </div>
                </div>

                {/* Primary Progress Bar */}
                <div className="task-kpi-bar-wrapper">
                  <div className="task-kpi-bar-track">
                    <div
                      className="task-kpi-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, Number(completionMetrics.rate)))}%` }}
                    />
                  </div>
                  <div className="task-kpi-bar-ticks">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Progress Breakdown Cards Grid */}
              <div className="task-kpi-progress-stats-grid">
                <div className="task-kpi-progress-stat-card is-completed">
                  <div className="task-kpi-progress-stat-title">
                    <span className="task-kpi-progress-dot is-completed" />
                    Completed Tasks
                  </div>
                  <div className="task-kpi-progress-stat-num">{completionMetrics.completed}</div>
                  <div className="task-kpi-progress-stat-sub">
                    {completionMetrics.pctCompleted}% of total
                  </div>
                </div>

                <div className="task-kpi-progress-stat-card is-in-progress">
                  <div className="task-kpi-progress-stat-title">
                    <span className="task-kpi-progress-dot is-in-progress" />
                    In Progress
                  </div>
                  <div className="task-kpi-progress-stat-num">{completionMetrics.inProgress}</div>
                  <div className="task-kpi-progress-stat-sub">
                    {completionMetrics.pctInProgress}% of total
                  </div>
                </div>

                <div className="task-kpi-progress-stat-card is-open">
                  <div className="task-kpi-progress-stat-title">
                    <span className="task-kpi-progress-dot is-open" />
                    Not Started / Open
                  </div>
                  <div className="task-kpi-progress-stat-num">{completionMetrics.notStarted}</div>
                  <div className="task-kpi-progress-stat-sub">
                    {completionMetrics.pctNotStarted}% of total
                  </div>
                </div>

                <div className="task-kpi-progress-stat-card is-overdue">
                  <div className="task-kpi-progress-stat-title">
                    <span className="task-kpi-progress-dot is-overdue" />
                    Overdue
                  </div>
                  <div className="task-kpi-progress-stat-num">{completionMetrics.overdue}</div>
                  <div className="task-kpi-progress-stat-sub">
                    {completionMetrics.total > 0
                      ? ((completionMetrics.overdue / completionMetrics.total) * 100).toFixed(1)
                      : '0.0'}
                    % of total
                  </div>
                </div>
              </div>

              {/* Multi-Segment Proportional Distribution Bar */}
              <div className="task-kpi-distribution-box">
                <div className="task-kpi-distribution-header">
                  <h4>Task Lifecycle Distribution</h4>
                  <span className="task-kpi-distribution-count">{completionMetrics.total} Total Tasks</span>
                </div>
                <div className="task-kpi-segment-bar">
                  <div
                    className="task-kpi-segment is-completed"
                    style={{ width: `${completionMetrics.pctCompleted}%` }}
                    title={`Completed: ${completionMetrics.completed} (${completionMetrics.pctCompleted}%)`}
                  />
                  <div
                    className="task-kpi-segment is-in-progress"
                    style={{ width: `${completionMetrics.pctInProgress}%` }}
                    title={`In Progress: ${completionMetrics.inProgress} (${completionMetrics.pctInProgress}%)`}
                  />
                  <div
                    className="task-kpi-segment is-open"
                    style={{ width: `${completionMetrics.pctNotStarted}%` }}
                    title={`Not Started: ${completionMetrics.notStarted} (${completionMetrics.pctNotStarted}%)`}
                  />
                  <div
                    className="task-kpi-segment is-other"
                    style={{ width: `${completionMetrics.pctOther}%` }}
                    title={`Other: ${completionMetrics.other} (${completionMetrics.pctOther}%)`}
                  />
                </div>
                <div className="task-kpi-distribution-legend">
                  <span className="task-kpi-legend-item">
                    <span className="task-kpi-legend-dot is-completed" /> Completed ({completionMetrics.completed})
                  </span>
                  <span className="task-kpi-legend-item">
                    <span className="task-kpi-legend-dot is-in-progress" /> In Progress ({completionMetrics.inProgress})
                  </span>
                  <span className="task-kpi-legend-item">
                    <span className="task-kpi-legend-dot is-open" /> Open ({completionMetrics.notStarted})
                  </span>
                  {completionMetrics.other > 0 && (
                    <span className="task-kpi-legend-item">
                      <span className="task-kpi-legend-dot is-other" /> Other ({completionMetrics.other})
                    </span>
                  )}
                </div>
              </div>

              {/* Footer CTA to inspect individual completed tasks */}
              <div className="task-kpi-progress-footer-cta">
                <div className="task-kpi-progress-footer-info">
                  <FaInfoCircle />
                  <span>
                    Click below to inspect the individual completed task records contributing to this rate.
                  </span>
                </div>
                <button
                  type="button"
                  className="task-kpi-view-completed-btn"
                  onClick={() => setActiveTab('list')}
                >
                  View Completed Tasks List <FaArrowRight />
                </button>
              </div>
            </div>
          ) : (
            /* =================================================================
               TASK LIST VIEW (for Total, Pending, Completed, and Overdue cards)
               ================================================================= */
            displayedTasks.length === 0 ? (
              <div className="task-kpi-modal-empty">
                <FaRegFolderOpen className="task-kpi-modal-empty-icon" />
                <h4>No tasks found</h4>
                <p>
                  {searchQuery
                    ? `No tasks match your search "${searchQuery}". Try a different keyword.`
                    : `There are no ${kpiTitle.toLowerCase()} matching the current dashboard filters.`}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    className="task-kpi-modal-empty-clear-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="task-scheduled-table-wrap task-kpi-table-wrap">
                <table className="task-scheduled-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Type</th>
                      <th>Dept / Project</th>
                      <th>Due Date</th>
                      <th>Assignees</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="task-scheduled-row"
                        onClick={() => onSelectTask && onSelectTask(task.id)}
                      >
                        <td className="task-scheduled-name">
                          <span className="task-scheduled-title" title={task.title}>
                            {task.title}
                          </span>
                          <span className="task-scheduled-id">#{task.id}</span>
                        </td>
                        <td>
                          <span className={`task-badge-status task-badge-status--${task.status || 'open'}`}>
                            {STATUS_CONFIG[task.status]?.label || task.status}
                          </span>
                        </td>
                        <td>
                          <span className={`task-badge-priority task-badge-priority--${task.priority || 'medium'}`}>
                            {task.priority || 'medium'}
                          </span>
                        </td>
                        <td>
                          <span className="task-type-tag">
                            {task.task_type === 'recurring' ? 'Recurring' : 'One Time'}
                          </span>
                        </td>
                        <td>
                          <span className="task-project-text" title={task.project_name || task.department || ''}>
                            {task.project_name || task.department || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="task-kpi-due-text">
                            {task.due_date || task.recurrence_next_date || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="task-assignees-preview">
                            {Array.isArray(task.assigned_users_meta) && task.assigned_users_meta.length > 0 ? (
                              task.assigned_users_meta.slice(0, 3).map((assignee, idx) => (
                                <span
                                  key={idx}
                                  className="task-assignee-avatar"
                                  title={assignee.name || `User ${assignee.user_id}`}
                                >
                                  {(assignee.name ? assignee.name[0] : 'U').toUpperCase()}
                                </span>
                              ))
                            ) : (
                              <span className="task-unassigned">Unassigned</span>
                            )}
                            {task.assigned_users_meta?.length > 3 && (
                              <span className="task-assignee-more">+{task.assigned_users_meta.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="task-view-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectTask) onSelectTask(task.id);
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

KpiDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isBackgrounded: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  kpiKey: PropTypes.oneOf(['total', 'pending', 'completed', 'overdue', 'completion_rate']).isRequired,
  kpiTitle: PropTypes.string.isRequired,
  kpiColor: PropTypes.string,
  activeFilterContext: PropTypes.string,
  initialStats: PropTypes.object,
  filterParams: PropTypes.object,
  selectedDay: PropTypes.string,
  onSelectTask: PropTypes.func,
  onRefresh: PropTypes.func
};

KpiDetailsModal.defaultProps = {
  isBackgrounded: false,
  kpiColor: 'purple',
  activeFilterContext: '',
  initialStats: null,
  filterParams: {},
  selectedDay: null,
  onSelectTask: null,
  onRefresh: null
};

export default KpiDetailsModal;
