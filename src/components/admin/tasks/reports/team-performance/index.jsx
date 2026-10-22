import React, { useState, useMemo, useCallback } from 'react';
import axiosInstance from '@/utils/axios';
import './index.css';

const DURATION_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_year', label: 'This year' },
];

// Ring geometry for the completion donut
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const TeamPerformance = ({
  taskAggregates,
  currentUser,
  duration,
  getDateRangeForDuration,
  // Optional: pass these to enable the duration dropdown and "vs last month" trends.
  // If omitted, the dropdown and trend lines are simply not rendered.
  onDurationChange,
  durationOptions = DURATION_OPTIONS,
  previousSummary, // { members, totalTasks, inProgress, completed, overdue, avgRate }
  comparisonLabel = 'vs last month',
}) => {
  // State management (unchanged)
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedMemberTasks, setSelectedMemberTasks] = useState(null);
  const [showMemberTasksModal, setShowMemberTasksModal] = useState(false);
  const [memberTasksLoading, setMemberTasksLoading] = useState(false);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatRole = (role) =>
    String(role || 'User')
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');

  const getStatusConfig = (status, task) => {
    const s = (status || 'open').toLowerCase();
    if (s === 'completed' || s === 'closed') return { icon: '✓', label: 'Completed', class: 'completed' };
    if (s === 'in_progress') return { icon: '🔄', label: 'In Progress', class: 'in-progress' };
    if (s === 'overdue' || (task.due_date && new Date(task.due_date) < new Date() && s !== 'completed' && s !== 'closed'))
      return { icon: '⚠️', label: 'Overdue', class: 'overdue' };
    return {
      icon: '⏳',
      label: String(status).split('_').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : '')).join(' '),
      class: s.replace('_', '-'),
    };
  };

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    const diff = new Date() - new Date(dueDate);
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Health of a member, used for the ring colour, the pill and the alert banner
  const getHealth = (member) => {
    const total = Number(member.count) || 0;
    const rate = Number(member.rate) || 0;
    if (total === 0) return { key: 'idle', label: 'No tasks' };
    if (rate >= 70) return { key: 'on-track', label: 'On track' };
    if (rate >= 40) return { key: 'watch', label: 'Watch' };
    return { key: 'attention', label: 'Needs attention' };
  };

  const formatRate = (rate) => {
    const n = Number(rate) || 0;
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  };

  // Filtered team members (exclude current user) - unchanged
  const filteredTeamMembers = useMemo(() => {
    if (!taskAggregates.users) return [];

    const currentUserId = Number(currentUser?.id);
    const teamWithoutCurrentUser = taskAggregates.users.filter((member) => {
      const memberId = Number(member.id || member.user_id || member.userId);
      return memberId !== currentUserId;
    });

    if (!teamSearchQuery.trim()) return teamWithoutCurrentUser;

    const query = teamSearchQuery.toLowerCase();
    return teamWithoutCurrentUser.filter(
      (member) =>
        member.label.toLowerCase().includes(query) ||
        (member.role && member.role.toLowerCase().includes(query))
    );
  }, [taskAggregates.users, teamSearchQuery, currentUser?.id]);

  // Team summary - unchanged
  const teamSummary = useMemo(() => {
    const list = filteredTeamMembers;
    const members = list.length;
    const totalTasks = list.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
    const completed = list.reduce((sum, m) => sum + (Number(m.completed_count) || 0), 0);
    const inProgress = list.reduce((sum, m) => sum + (Number(m.in_progress_count) || 0), 0);
    const overdue = list.reduce((sum, m) => sum + (Number(m.overdue_count) || 0), 0);
    const avgRateRaw = members > 0 ? list.reduce((s, m) => s + (Number(m.rate) || 0), 0) / members : 0;
    const avgRate = Math.round(avgRateRaw);
    return { members, totalTasks, completed, inProgress, overdue, avgRate };
  }, [filteredTeamMembers]);

  // Members that need attention (worst first) for the alert banner
  const attentionMembers = useMemo(
    () =>
      filteredTeamMembers
        .filter((m) => getHealth(m).key === 'attention')
        .sort((a, b) => (Number(a.rate) || 0) - (Number(b.rate) || 0)),
    [filteredTeamMembers] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Handle showing member tasks - unchanged
  const handleShowMemberTasks = useCallback(
    async (member) => {
      setSelectedMemberTasks({ member, tasks: [] });
      setShowMemberTasksModal(true);
      setMemberTasksLoading(true);

      try {
        const range = getDateRangeForDuration(duration);
        const memberId = member.id || member.user_id || member.userId;

        if (!memberId) {
          setMemberTasksLoading(false);
          return;
        }

        const payload = {
          pagination: { page: 1, pageSize: 100 },
          filters: {
            start_date: range.from,
            end_date: range.to,
            assignee_id: memberId,
            team_performance: true,
          },
        };

        const res = await axiosInstance.post('/tasks/search', payload);
        const tasks = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.data?.data)
            ? res.data.data.data
            : [];

        setSelectedMemberTasks((prev) => ({
          ...prev,
          tasks,
        }));
      } catch (e) {
        console.error('Error fetching member tasks:', e);
      } finally {
        setMemberTasksLoading(false);
      }
    },
    [duration, getDateRangeForDuration]
  );

  // Render helpers
  const renderTrend = (current, previous, { goodWhenUp = true, suffix = '', neutral = false } = {}) => {
    if (previous === undefined || previous === null) return null;
    const delta = Math.round((Number(current) - Number(previous)) * 10) / 10;
    if (delta === 0) {
      return <div className="team-perf-trend team-perf-trend-flat">No change</div>;
    }
    const up = delta > 0;
    let tone = 'neutral';
    if (!neutral) tone = up === goodWhenUp ? 'good' : 'bad';
    return (
      <div className={`team-perf-trend team-perf-trend-${tone}`}>
        <span aria-hidden="true">{up ? '▲' : '▼'}</span> {Math.abs(delta)}
        {suffix} {comparisonLabel}
      </div>
    );
  };

  const renderSummaryCard = ({ label, value, trend, accent }) => (
    <div className={`team-perfo-summary-item ${accent ? `team-perfo-summary-item-${accent}` : ''}`}>
      <div className="team-perfo-summary-label">{label}</div>
      <div className="team-perfo-summary-value">{value}</div>
      {trend}
    </div>
  );

  const renderRing = (member, health) => {
    const rate = Math.min(100, Math.max(0, Number(member.rate) || 0));
    const offset = RING_CIRCUMFERENCE * (1 - rate / 100);
    return (
      <div className="team-perf-ring" aria-label={`${Math.round(rate)}% complete`}>
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle className="team-perf-ring-track" cx="32" cy="32" r={RING_RADIUS} />
          <circle
            className={`team-perf-ring-value team-perf-ring-${health.key}`}
            cx="32"
            cy="32"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <span className="team-perf-ring-label">{Math.round(rate)}%</span>
      </div>
    );
  };

  const renderSplitBar = (member) => {
    const total = Number(member.count) || 0;
    const done = Number(member.completed_count) || 0;
    const onTrack = Number(member.in_progress_count) || 0;
    const overdue = Number(member.overdue_count) || 0;
    const pct = (n) => (total > 0 ? (n / total) * 100 : 0);
    return (
      <div className="team-perf-splitbar" role="img" aria-label={`${done} completed, ${onTrack} in progress, ${overdue} overdue`}>
        <span className="team-perf-split team-perf-split-done" style={{ width: `${pct(done)}%` }} />
        <span className="team-perf-split team-perf-split-track" style={{ width: `${pct(onTrack)}%` }} />
        <span className="team-perf-split team-perf-split-overdue" style={{ width: `${pct(overdue)}%` }} />
      </div>
    );
  };

  const renderTaskCard = (task) => {
    const statusConfig = getStatusConfig(task.status, task);
    const overdueDays = getOverdueDays(task.due_date);

    return (
      <div key={task.id} className={`team-perf-modal-task-item status-${statusConfig.class}`}>
        <div className="team-perf-modal-task-main">
          <div className="team-perf-modal-task-title">{task.title}</div>
          <div className={`team-perf-modal-task-status team-perf-modal-task-status-${statusConfig.class}`}>
            {statusConfig.icon} {statusConfig.label}
          </div>
        </div>
        <div className="team-perf-modal-task-details">
          <div className="team-perf-modal-task-detail-item">
            Priority:{' '}
            <span className={`priority-${(task.priority || 'medium').toLowerCase()}`}>
              {(task.priority || 'MEDIUM').toUpperCase()}
            </span>
          </div>
          <div className="team-perf-modal-task-detail-item">Department: {task.department || 'N/A'}</div>
          <div className="team-perf-modal-task-detail-item">
            Due Date: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
          </div>

          {statusConfig.class === 'completed' && (task.completed_date || task.completed_at) && (
            <div className="team-perf-modal-task-detail-item">
              Completed: {new Date(task.completed_date || task.completed_at).toLocaleDateString()}
            </div>
          )}

          {statusConfig.class === 'in-progress' && task.progress !== undefined && (
            <div className="team-perf-modal-task-detail-item">Progress: {task.progress}%</div>
          )}

          {statusConfig.class === 'overdue' && overdueDays > 0 && (
            <div className="team-perf-modal-task-detail-item">Days Overdue: {overdueDays}</div>
          )}
        </div>
      </div>
    );
  };

  const topAttention = attentionMembers[0];

  return (
    <>
      <div className="team-perf-card">
        {/* Header */}
        <div className="team-perfo-header">
          <div className="team-perf-title-group">
            <h2 className="team-perf-title">Team performance</h2>
            <p className="team-perf-subtitle">Task progress across your team</p>
          </div>
          <div className="team-perfo-header-actions">
            <div className={`team-perf-search-wrapper ${mobileSearchOpen ? 'team-perf-search-wrapper-open' : ''}`}>
              <span className="team-perf-search-icon" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
                🔍
              </span>
              <input
                type="text"
                className="team-perf-search-input"
                placeholder="Search team members"
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
              />
            </div>
            {typeof onDurationChange === 'function' && (
              <select
                className="team-perf-duration-select"
                value={duration}
                onChange={(e) => onDurationChange(e.target.value)}
                aria-label="Duration"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            <span className="team-perf-active-badge">{filteredTeamMembers.length} active members</span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="team-perfo-summary">
          {renderSummaryCard({
            label: 'Team Members',
            value: teamSummary.members,
            trend: renderTrend(teamSummary.members, previousSummary?.members, { neutral: true }),
          })}
          {renderSummaryCard({
            label: 'Total Tasks',
            value: teamSummary.totalTasks,
            trend: renderTrend(teamSummary.totalTasks, previousSummary?.totalTasks),
          })}
          {renderSummaryCard({
            label: 'In Progress',
            value: teamSummary.inProgress,
            trend: renderTrend(teamSummary.inProgress, previousSummary?.inProgress, { neutral: true }),
          })}
          {renderSummaryCard({
            label: 'Completed',
            value: teamSummary.completed,
            trend: renderTrend(teamSummary.completed, previousSummary?.completed),
          })}
          {renderSummaryCard({
            label: 'Overdue',
            value: teamSummary.overdue,
            accent: 'overdue',
            trend: renderTrend(teamSummary.overdue, previousSummary?.overdue, { goodWhenUp: false }),
          })}
          {renderSummaryCard({
            label: 'Completion',
            value: `${teamSummary.avgRate}%`,
            accent: 'rate',
            trend: renderTrend(teamSummary.avgRate, previousSummary?.avgRate, { suffix: '%' }),
          })}
        </div>

        {/* Attention alert */}
        {/* {topAttention && (
          <div className="team-perf-alert" role="alert">
            <span className="team-perf-alert-dot" aria-hidden="true" />
            <span>
              <strong>{topAttention.label}</strong> needs attention: {formatRate(topAttention.rate)}% complete with{' '}
              {Number(topAttention.overdue_count) || 0} overdue of {Number(topAttention.count) || 0} tasks.
              {attentionMembers.length > 1 && ` ${attentionMembers.length - 1} more member(s) also need attention.`}
            </span>
          </div>
        )} */}

        {/* Member cards */}
        <div className="team-perf-grid">
          {filteredTeamMembers.length > 0 ? (
            filteredTeamMembers.map((member, index) => {
              const health = getHealth(member);
              return (
                <div key={member.id || member.user_id || member.userId || index} className="team-perf-member-card">
                  <div className="team-perf-member-header">
                    <div className="team-perf-member-avatar">{(member.label || 'U').charAt(0).toUpperCase()}</div>
                    <div className="team-perf-member-info">
                      <div className="team-perf-member-name">{member.label}</div>
                      <div className="team-perf-member-role">{formatRole(member.role)}</div>
                    </div>
                    {renderRing(member, health)}
                  </div>

                  {renderSplitBar(member)}

                  <div className="team-perf-legend">
                    <span className="team-perf-legend-item">
                      <i className="team-perf-dot team-perf-dot-done" />
                      <b>{member.completed_count || 0}</b> completed
                    </span>
                    <span className="team-perf-legend-item">
                      <i className="team-perf-dot team-perf-dot-track" />
                      <b>{member.in_progress_count || 0}</b> in progress
                    </span>
                    <span className="team-perf-legend-item">
                      <i className="team-perf-dot team-perf-dot-overdue" />
                      <b>{member.overdue_count || 0}</b> overdue
                    </span>
                  </div>

                  <div className="team-perf-member-footer-actions">
                    <span className={`team-perf-pill team-perf-pill-${health.key}`}>{health.label}</span>
                    <button className="team-perf-view-details-btn" onClick={() => handleShowMemberTasks(member)}>
                      View {member.count || 0} tasks
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="team-perf-empty-search">
              {teamSearchQuery.trim()
                ? `No team members found matching "${teamSearchQuery}"`
                : 'No direct reports found.'}
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal (unchanged) */}
      {showMemberTasksModal && selectedMemberTasks && (
        <div className="team-perf-modal-overlay" onClick={() => setShowMemberTasksModal(false)}>
          <div className="team-perf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="team-perf-modal-header">
              <div className="team-perf-modal-header-left">
                <div className="team-perf-modal-avatar">
                  {getInitials(selectedMemberTasks.member.label || selectedMemberTasks.member.name)}
                </div>
                <div className="team-perf-modal-user-info">
                  <h3 className="team-perf-modal-user-name">
                    {selectedMemberTasks.member.label || selectedMemberTasks.member.name || 'User'}
                  </h3>
                  <span className="team-perf-modal-user-role">{selectedMemberTasks.member.role || 'User'}</span>
                </div>
              </div>
              <div className="team-perf-modal-header-right">
                <button className="team-perf-modal-close" onClick={() => setShowMemberTasksModal(false)}>
                  ×
                </button>
              </div>
            </div>

            <div className="team-perf-modal-body">
              <div className="team-perf-modal-stats">
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value">{selectedMemberTasks.member.count}</div>
                  <div className="team-perf-modal-stat-label">Total Tasks</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value team-perf-modal-stat-value-in-progress">
                    {selectedMemberTasks.member.in_progress_count || 0}
                  </div>
                  <div className="team-perf-modal-stat-label">In Progress</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value team-perf-modal-stat-value-completed">
                    {selectedMemberTasks.member.completed_count || 0}
                  </div>
                  <div className="team-perf-modal-stat-label">Completed</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value team-perf-modal-stat-value-overdue">
                    {selectedMemberTasks.member.overdue_count || 0}
                  </div>
                  <div className="team-perf-modal-stat-label">Pending/Overdue</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value">{selectedMemberTasks.member.rate || 0}%</div>
                  <div className="team-perf-modal-stat-label">Completion Rate</div>
                </div>
              </div>

              <div className="team-perf-modal-task-list-section">
                <h4 className="team-perf-modal-section-title">📋 Task List ({selectedMemberTasks.tasks.length} Tasks)</h4>
                <div className="team-perf-modal-task-list">
                  {memberTasksLoading ? (
                    <div className="team-perf-modal-loading">
                      <div className="team-perf-loading-spinner"></div>
                      <p>Loading member tasks...</p>
                    </div>
                  ) : selectedMemberTasks.tasks.length > 0 ? (
                    selectedMemberTasks.tasks.map(renderTaskCard)
                  ) : (
                    <div className="team-perf-modal-empty">No tasks found for this member.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamPerformance;
