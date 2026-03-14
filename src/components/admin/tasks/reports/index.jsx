import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { Chart, registerables } from 'chart.js';
import axiosInstance from '../../../../utils/axios';
import { departments } from '../../../../utils/admin';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import '../../../../styles/components.css';
import './index.css';

Chart.register(...registerables);

const STATUS_LABELS = [
  'Open',
  'In Progress',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Completed',
  'Closed',
  'Cancelled'
];

const STATUS_COLORS = [
  '#077af5',
  '#fccf3a',
  '#A281C7',
  '#61C0AA',
  '#ef4444',
  '#0feb42',
  '#E88073',
  '#f10a1d'
];

const STATUS_DOT_CLASSNAMES = [
  'task-progress-dot--open',
  'task-progress-dot--in-progress',
  'task-progress-dot--pending-approval',
  'task-progress-dot--approved',
  'task-progress-dot--rejected',
  'task-progress-dot--completed',
  'task-progress-dot--closed',
  'task-progress-dot--cancelled'
];

function createOrUpdateDoughnutChart(ctx, data, chartInstanceRef) {
  if (chartInstanceRef.current) {
    chartInstanceRef.current.data = data;
    chartInstanceRef.current.update();
    return;
  }
  chartInstanceRef.current = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

const TaskReports = () => {
  const { user, permissions } = useAuth();
  const role = user?.role || 'user';
  const [duration, setDuration] = useState('this_year');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [taskStats, setTaskStats] = useState(null);
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);
  const [taskStatsError, setTaskStatsError] = useState(null);
  const [taskAggregates, setTaskAggregates] = useState({ users: [], projects: [], avgCompletionDays: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  const rolePerms = useMemo(() => {
    return {
      scope: taskPerms.reportScope,
      canCreate: taskPerms.canCreate,
      canAssign: taskPerms.canAssign,
      canApprove: taskPerms.canApprove,
      canEditCompleted: taskPerms.canEditCompleted
    };
  }, [taskPerms]);

  const statsSummary = useMemo(() => {
    const total = taskStats?.total_tasks || 0;
    const breakdown = taskStats?.status_breakdown || {};
    const sumBy = (keys) => keys.reduce((sum, key) => sum + (breakdown[key] || 0), 0);
    const open = breakdown.open || 0;
    const draft = breakdown.draft || 0;
    const inProgress = breakdown.in_progress || 0;
    const pendingApproval = breakdown.pending_approval || 0;
    const approved = breakdown.approved || 0;
    const completed = breakdown.completed || 0;
    const closed = breakdown.closed || 0;
    const rejected = breakdown.rejected || 0;
    const cancelled = breakdown.cancelled || 0;
    const pending = sumBy(['draft', 'open', 'in_progress', 'pending_approval', 'approved']);
    const ended = sumBy(['completed', 'closed', 'cancelled']);
    const completionRate = taskStats?.completion_rate || 0;
    const overdue = taskStats?.overdue_tasks || 0;
    const progressCompleted = completed + closed + approved;
    const progressInProgress = inProgress + pendingApproval;
    const progressNotStarted = open + draft;
    const active = open + inProgress + pendingApproval + approved;
    const completedTotal = completed + closed;
    return {
      total,
      pending,
      ended,
      completionRate,
      overdue,
      open,
      draft,
      inProgress,
      pendingApproval,
      approved,
      completed,
      closed,
      rejected,
      cancelled,
      active,
      completedTotal,
      progressCompleted,
      progressInProgress,
      progressNotStarted
    };
  }, [taskStats]);

  const prioritySummary = useMemo(() => {
    const breakdown = taskStats?.priority_breakdown || {};
    const low = breakdown.low || 0;
    const medium = breakdown.medium || 0;
    const high = breakdown.high || 0;
    const critical = breakdown.critical || 0;
    return {
      low,
      medium,
      high,
      critical
    };
  }, [taskStats]);

  const formattedCurrentTime = useMemo(() => {
    return currentTime.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [currentTime]);

  const durationLabel = useMemo(() => {
    switch (duration) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'this_week':
        return 'This Week';
      case 'last_week':
        return 'Last Week';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'this_year':
        return 'This Year';
      case 'last_year':
        return 'Last Year';
      default:
        return 'Custom Range';
    }
  }, [duration]);

  const completionRateChartRef = useRef(null);
  const completionRateChartInstance = useRef(null);
  const userBarChartRef = useRef(null);
  const userBarChartInstance = useRef(null);
  const projectBarChartRef = useRef(null);
  const projectBarChartInstance = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getDateRangeForDuration = (durationValue) => {
    const today = new Date();
    const formatDateToYYYYMMDD = (date) => date.toISOString().split('T')[0];
    let from;
    let to;
    switch (durationValue) {
      case 'today': {
        from = formatDateToYYYYMMDD(today);
        to = from;
        break;
      }
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        from = formatDateToYYYYMMDD(y);
        to = from;
        break;
      }
      case 'this_week': {
        const start = new Date(today);
        const dow = today.getDay();
        const diff = today.getDate() - dow + (dow === 0 ? -6 : 1);
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'last_week': {
        const start = new Date(today);
        const dow = today.getDay();
        const diff = today.getDate() - dow + (dow === 0 ? -6 : 1) - 7;
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'this_month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'last_month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'this_year': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'last_year': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      default: {
        from = formatDateToYYYYMMDD(today);
        to = from;
        break;
      }
    }
    return { from, to };
  };

  useEffect(() => {
    const fetchTaskReports = async () => {
      setTaskStatsLoading(true);
      setTaskStatsError(null);
      try {
        const range = getDateRangeForDuration(duration);
        const department = selectedDepartment || undefined;

        let statsDepartment;
        if (rolePerms.scope === 'org') {
          statsDepartment = department;
        } else if (rolePerms.scope === 'department' || rolePerms.scope === 'team') {
          statsDepartment = user?.department;
        } else {
          statsDepartment = user?.department;
        }

        const statsParams = {
          start_date: range.from,
          end_date: range.to,
          department: statsDepartment
        };
        const statsRes = await axiosInstance.get('/tasks/dashboard/stats', { params: statsParams });
        const statsData = statsRes.data?.data || statsRes.data;
        setTaskStats(statsData || null);

        const scopedFilters = {
          pagination: { page: 1, pageSize: 500, sortField: 'created_at', sortOrder: 'DESC' },
          filters: {}
        };

        if (rolePerms.scope === 'org') {
          if (department) {
            scopedFilters.filters.department = department;
          }
        } else if (rolePerms.scope === 'department' || rolePerms.scope === 'team') {
          scopedFilters.filters.department = user?.department;
        } else {
          scopedFilters.filters.department = user?.department;
        }
        const listRes = await axiosInstance.post('/tasks/search', scopedFilters);
        const rawList = listRes.data?.data || [];

        const fromDate = new Date(range.from);
        const toDate = new Date(range.to);
        const list = rawList.filter((t) => {
          const baseDateValue = t?.completed_date || t?.created_at || t?.start_date;
          if (!baseDateValue) return false;
          const baseDate = new Date(baseDateValue);
          if (Number.isNaN(baseDate.getTime())) return false;
          return baseDate >= fromDate && baseDate <= toDate;
        });

        const userCountsMap = {};
        const projectCountsMap = {};
        let totalDays = 0;
        let completedCount = 0;
        list.forEach(t => {
          if (Array.isArray(t.assigned_users_meta) && t.assigned_users_meta.length > 0) {
            t.assigned_users_meta.forEach((m) => {
              if (!m || m.user_id == null) return;
              const userKey = String(m.user_id);
              userCountsMap[userKey] = (userCountsMap[userKey] || 0) + 1;
            });
          } else if (Array.isArray(t.assigned_user_ids) && t.assigned_user_ids.length > 0) {
            t.assigned_user_ids.forEach((id) => {
              const userKey = String(id);
              userCountsMap[userKey] = (userCountsMap[userKey] || 0) + 1;
            });
          } else {
            const userKey = 'Unassigned';
            userCountsMap[userKey] = (userCountsMap[userKey] || 0) + 1;
          }
          const projectKey = t?.project_name || 'No Project';
          projectCountsMap[projectKey] = (projectCountsMap[projectKey] || 0) + 1;
          if (t?.start_date && t?.completed_date) {
            const start = new Date(t.start_date);
            const completed = new Date(t.completed_date);
            const diffMs = completed.getTime() - start.getTime();
            const days = diffMs / (1000 * 60 * 60 * 24);
            if (!isNaN(days) && days >= 0) {
              totalDays += days;
              completedCount += 1;
            }
          }
        });
        const users = Object.entries(userCountsMap).map(([label, count]) => ({ label, count }));
        const projects = Object.entries(projectCountsMap).map(([label, count]) => ({ label, count }));
        const avgCompletionDays = completedCount > 0 ? +(totalDays / completedCount).toFixed(2) : null;
        setTaskAggregates({ users, projects, avgCompletionDays });
      } catch (e) {
        setTaskStatsError(e.response?.data?.message || e.message || 'Failed to fetch task reports');
      } finally {
        setTaskStatsLoading(false);
      }
    };
    fetchTaskReports();
  }, [duration, selectedDepartment, rolePerms.scope, user?.department, user?.id]);

  useEffect(() => {
    const palette = (n) => {
      const base = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ];
      const colors = [];
      for (let i = 0; i < n; i++) {
        colors.push(base[i % base.length]);
      }
      return colors;
    };

    if (taskStats) {
      const statusValues = [
        statsSummary.open || 0,
        statsSummary.inProgress || 0,
        statsSummary.pendingApproval || 0,
        statsSummary.approved || 0,
        statsSummary.rejected || 0,
        statsSummary.completed || 0,
        statsSummary.closed || 0,
        statsSummary.cancelled || 0
      ];
      const completionData = {
        labels: STATUS_LABELS,
        datasets: [{
          label: 'Task Status Breakdown',
          data: statusValues,
          backgroundColor: STATUS_COLORS,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      };
      if (completionRateChartRef.current) {
        createOrUpdateDoughnutChart(
          completionRateChartRef.current.getContext('2d'),
          completionData,
          completionRateChartInstance
        );
      }
    }
    if (taskAggregates.users.length > 0 && userBarChartRef.current) {
      const labels = taskAggregates.users.map(u => u.label);
      const values = taskAggregates.users.map(u => u.count);
      const colors = palette(values.length);
      const data = {
        labels,
        datasets: [{
          label: 'Tasks by User',
          data: values,
          backgroundColor: '#17becf',
          borderColor: '#cfa717ff',
          borderWidth: 1
        }]
      };
      if (userBarChartInstance.current) {
        userBarChartInstance.current.data = data;
        userBarChartInstance.current.update();
      } else {
        userBarChartInstance.current = new Chart(userBarChartRef.current.getContext('2d'), { type: 'bar', data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } } } });
      }
    }
    if (taskAggregates.projects.length > 0 && projectBarChartRef.current) {
      const labels = taskAggregates.projects.map(p => p.label);
      const values = taskAggregates.projects.map(p => p.count);
      const data = {
        labels,
        datasets: [{
          label: 'Tasks by Project',
          data: values,
          backgroundColor: '#0686e1ff',
          borderColor: '#bfc7a1ff',
          borderWidth: 1
        }]
      };
      if (projectBarChartInstance.current) {
        projectBarChartInstance.current.data = data;
        projectBarChartInstance.current.update();
      } else {
        projectBarChartInstance.current = new Chart(
          projectBarChartRef.current.getContext('2d'),
          {
            type: 'bar',
            data,
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: {
                  beginAtZero: true
                },
                y: {
                  ticks: {
                    autoSkip: false
                  }
                }
              }
            }
          }
        );
      }
    }
    return () => {
      if (completionRateChartInstance.current) {
        completionRateChartInstance.current.destroy();
        completionRateChartInstance.current = null;
      }
      if (userBarChartInstance.current) {
        userBarChartInstance.current.destroy();
        userBarChartInstance.current = null;
      }
      if (projectBarChartInstance.current) {
        projectBarChartInstance.current.destroy();
        projectBarChartInstance.current = null;
      }
    };
  }, [taskStats, taskAggregates, statsSummary]);

  return (
    <>
      <Navbar />
      <div className="user-list-container">
        <PageHeader title="Tasks Dashboard" showBackButton={true} />
        <div className="task-dashboard-shell">
          <div className="task-dashboard-layout">
            <div className="task-dashboard-filters">
              <div className="task-filter-group">
                <span className="task-filter-label">Duration</span>
                <select
                  className="task-filter-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_month">Last Month</option>
                  <option value="last_year">Last Year</option>
                </select>
              </div>
              {rolePerms.scope === 'org' && (
                <div className="task-filter-group">
                  <span className="task-filter-label">Department</span>
                  <select
                    className="task-filter-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">All</option>
                    {Array.isArray(departments) &&
                      departments.map((d) => (
                        <option key={d} value={d}>
                          {String(d)
                            .split('_')
                            .map((w) => w[0].toUpperCase() + w.slice(1))
                            .join(' ')}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className="task-dashboard-header-bottom">
                <div className="task-dashboard-duration">
                  <span className="task-duration-pill">
                    Duration: {durationLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="task-dashboard-header">
              <div className="task-dashboard-header-bar">
                <div className="task-dashboard-header-bar-time">{formattedCurrentTime}</div>
              </div>
              <div className="task-dashboard-header-top">
                <div className="task-dashboard-welcome task-dashboard-welcome-card">
                  <div className="task-dashboard-title">
                    Welcome{" "}
                    {user?.first_name || user?.last_name
                      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                      : user?.email || "User"}
                    .
                  </div>
                  <div className="task-dashboard-tags">
                    <span className="task-badge">{`Role: ${role}`}</span>
                    <span className="task-badge">{`Scope: ${rolePerms.scope}`}</span>
                  </div>
                </div>
                <div className="task-dashboard-cards">
                  <div className="task-stat-card task-stat-card--total">
                    <div className="task-stat-label">Total Task</div>
                    <div className="task-stat-value">{statsSummary.total}</div>
                  </div>
                  <div className="task-stat-card task-stat-card--pending task-stat-card--active">
                    <div className="task-stat-label">Pending Task</div>
                    <div className="task-stat-value">{statsSummary.pending}</div>
                  </div>
                  <div className="task-stat-card task-stat-card--ended">
                    <div className="task-stat-label">Ended Tasks</div>
                    <div className="task-stat-value">
                      {statsSummary.ended}/{statsSummary.total}
                    </div>
                  </div>
                  <div className="task-stat-card task-stat-card--overdue">
                    <div className="task-stat-label">Overdue Tasks</div>
                    <div className="task-stat-value">
                      {statsSummary.overdue}/{statsSummary.total}
                    </div>
                  </div>
                  <div className="task-stat-card task-stat-card--completion">
                    <div className="task-stat-label">Completion Rate</div>
                    <div className="task-stat-value">
                      {`${Number(statsSummary.completionRate || 0).toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="task-dashboard-main">
              <div className="task-dashboard-column">
                <div className="task-dashboard-bottom-left">
                  <div className="task-card task-card--summary">
                    <div className="task-card-header">
                      <h2 className="task-card-title">Status Overview</h2>
                    </div>
                    <div className="task-status-grid">
                      <div className="task-status-card task-status-card--danger">
                        <div className="task-status-label">Open</div>
                        <div className="task-status-value">
                          {statsSummary.open}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card task-status-card--danger">
                        <div className="task-status-label">In Progress</div>
                        <div className="task-status-value">
                          {statsSummary.inProgress}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card task-status-card--priority-low">
                        <div className="task-status-label">Pending Approval</div>
                        <div className="task-status-value">
                          {statsSummary.pendingApproval}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card task-status-card--priority-medium">
                        <div className="task-status-label">Approved</div>
                        <div className="task-status-value">
                          {statsSummary.approved}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card task-status-card--priority-high">
                        <div className="task-status-label">Rejected</div>
                        <div className="task-status-value">
                          {statsSummary.rejected}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card task-status-card--priority-critical">
                        <div className="task-status-label">Completed</div>
                        <div className="task-status-value">
                          {statsSummary.completed}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card">
                        <div className="task-status-label">Closed</div>
                        <div className="task-status-value">
                          {statsSummary.closed}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card">
                        <div className="task-status-label">Cancelled</div>
                        <div className="task-status-value">
                          {statsSummary.cancelled}/{statsSummary.total}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="task-card task-card--summary">
                    <div className="task-card-header">
                      <h2 className="task-card-title">Priority Overview</h2>
                    </div>
                    <div className="task-priority-grid">
                      <div className="task-status-card">
                        <div className="task-status-label">Low</div>
                        <div className="task-status-value">
                          {prioritySummary.low}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card">
                        <div className="task-status-label">Medium</div>
                        <div className="task-status-value">
                          {prioritySummary.medium}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card">
                        <div className="task-status-label">High</div>
                        <div className="task-status-value">
                          {prioritySummary.high}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-status-card">
                        <div className="task-status-label">Critical</div>
                        <div className="task-status-value">
                          {prioritySummary.critical}/{statsSummary.total}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="task-card task-card--summary task-card--project-report">
                    <div className="task-card-header">
                      <h2 className="task-card-title">Project-wise Task Report</h2>
                      <span className="task-card-chip">
                        {duration === 'this_year' ? 'This Year' : 'Selected Range'}
                      </span>
                    </div>
                    <div className="task-card-chart task-card-chart--wide">
                      <canvas ref={projectBarChartRef}></canvas>
                    </div>
                  </div>
                </div>

              </div>

              <div className="task-dashboard-column">
                <div className="task-card task-card--summary">
                  <div className="task-card-header">
                    <h2 className="task-card-title">Task Progress</h2>
                  </div>
                  <div className="task-card-chart task-card-chart--wide">
                    <canvas ref={completionRateChartRef}></canvas>
                  </div>
                  <div className="task-progress-legend">
                    {STATUS_LABELS.map((label, index) => {
                      const colorClass = STATUS_DOT_CLASSNAMES[index] || '';
                      return (
                        <div key={label} className="task-progress-legend-item">
                          <span
                            className={`task-progress-dot ${colorClass}`}
                          />
                          <span className="task-progress-legend-label">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {taskStatsLoading && <div className="loading">Loading task progress...</div>}
                  {taskStatsError && <div className="error">{taskStatsError}</div>}
                </div>

                <div className="task-card task-card--summary">
                  <div className="task-card-header">
                    <h2 className="task-card-title">User-wise Task Report</h2>
                  </div>
                  <div className="task-card-chart task-card-chart--wide">
                    <canvas ref={userBarChartRef}></canvas>
                  </div>
                </div>
              </div>

              {taskAggregates.avgCompletionDays !== null && (
                <div className="task-card task-card--time-tracking">
                  <div className="task-card-header">
                    <h2 className="task-card-title">Time Tracking Report</h2>
                  </div>
                  <div className="task-card-body">
                    <div className="task-card-footer-text">
                      Average completion time {taskAggregates.avgCompletionDays} days
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskReports;
