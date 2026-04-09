import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const role = user?.role || 'user';
  const [duration, setDuration] = useState('this_year');
  const [viewType, setViewType] = useState('all'); // Default to 'all' for reports
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [taskStats, setTaskStats] = useState(null);
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);
  const [taskStatsError, setTaskStatsError] = useState(null);
  const [taskAggregates, setTaskAggregates] = useState({ users: [], projects: [], avgCompletionDays: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentDeptFromPath = useMemo(() => {
    const path = location.pathname || '';
    const segs = path.split('/').filter(Boolean);
    const first = segs[0] || '';
    const known = new Set([
      'program',
      'store',
      'procurements',
      'accounts_and_finance',
      'fund_raising',
      'admin',
      'it',
      'hr',
      'marketing',
      'audio_video'
    ]);
    return known.has(first) ? first : '';
  }, [location.pathname]);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, currentDeptFromPath || user?.department, user?.role),
    [permissions, user?.department, user?.role, currentDeptFromPath],
  );
  const rolePerms = useMemo(() => {
    const r = String(user?.role || '').toLowerCase();
    const isAdmin = r === 'super_admin' || r === 'admin';
    return {
      scope: taskPerms.reportScope,
      canCreate: taskPerms.canCreate,
      canAssign: taskPerms.canAssign,
      canApprove: taskPerms.canApprove,
      canEditCompleted: taskPerms.canEditCompleted,
      isAdmin
    };
  }, [taskPerms, user?.role]);

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
    const pending = sumBy(['draft', 'open', 'in_progress', 'pending_approval', 'approved', 'completed', 'rejected', 'cancelled']);
    const ended = closed;
    const completionRate = taskStats?.completion_rate || 0;
    const overdue = taskStats?.overdue_tasks || 0;
    const progressCompleted = closed;
    const progressInProgress = inProgress + pendingApproval + approved + completed;
    const progressNotStarted = open + draft;
    const active = open + inProgress + pendingApproval + approved + completed;
    const completedTotal = closed;
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
  const departmentChartRef = useRef(null);
  const departmentCanvasRef = useRef(null);
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
      // Don't fetch if user is not loaded yet
      if (!user) return;

      setTaskStatsLoading(true);
      setTaskStatsError(null);
      try {
        const range = getDateRangeForDuration(duration);

        // If we are in a specific department dashboard (e.g. /it/tasks/reports),
        // we should always filter by that department.
        // Exception: If we are in the general admin dashboard, show all departments by default.
        const isGeneralAdminDashboard = currentDeptFromPath === 'admin' && rolePerms.isAdmin;
        const department = isGeneralAdminDashboard ? (selectedDepartment || undefined) : (currentDeptFromPath || selectedDepartment || undefined);

        let statsDepartment;
        if (isGeneralAdminDashboard) {
          statsDepartment = selectedDepartment || undefined;
        } else if (currentDeptFromPath) {
          statsDepartment = currentDeptFromPath;
        } else if (rolePerms.scope === 'org') {
          statsDepartment = department;
        } else if (rolePerms.scope === 'department' || rolePerms.scope === 'team') {
          statsDepartment = user?.department;
        } else {
          statsDepartment = user?.department;
        }

        // Filtering options such as ‘Created’ and ‘Assigned’ tasks should be disabled for the Admin view
        const apiViewType = !rolePerms.isAdmin && viewType !== 'all' ? viewType : undefined;

        const statsParams = {
          start_date: range.from,
          end_date: range.to,
          department: statsDepartment,
          view_type: apiViewType
        };
        const statsRes = await axiosInstance.get('/tasks/dashboard/stats', { params: statsParams });
        const statsData = statsRes.data?.data || statsRes.data;
        setTaskStats(statsData || null);

        // Fetch user-wise and project-wise aggregates from the reports endpoint
        const reportsParams = {
          start_date: range.from,
          end_date: range.to,
          department: statsDepartment,
          view_type: apiViewType
        };
        const reportsRes = await axiosInstance.get('/tasks/reports', { params: reportsParams });
        const reportsData = reportsRes.data?.data || reportsRes.data;

        setTaskAggregates({
          users: reportsData?.users || [],
          projects: reportsData?.projects || [],
          avgCompletionDays: reportsData?.avgCompletionDays || null
        });
      } catch (e) {
        console.error('Task reports fetch error:', e);
        setTaskStatsError(e.response?.data?.message || e.message || 'Failed to fetch task reports');
      } finally {
        setTaskStatsLoading(false);
      }
    };
    fetchTaskReports();
  }, [duration, selectedDepartment, rolePerms.scope, rolePerms.isAdmin, user?.department, user?.id, currentDeptFromPath, viewType]);

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
          label: 'Task Status',
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

    if (rolePerms.isAdmin && taskStats?.department_breakdown && departmentCanvasRef.current) {
      const labels = Object.keys(taskStats.department_breakdown).map(d =>
        String(d || 'Unassigned').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')
      );
      const dataValues = Object.values(taskStats.department_breakdown);
      const data = {
        labels,
        datasets: [{
          label: 'Department-wise Task',
          data: dataValues,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#4D5360', '#C9CBCF', '#8e5ea2', '#3cba9f'
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      };
      createOrUpdateDoughnutChart(
        departmentCanvasRef.current.getContext('2d'),
        data,
        departmentChartRef
      );
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
      if (departmentChartRef.current) {
        departmentChartRef.current.destroy();
        departmentChartRef.current = null;
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
  }, [taskStats, taskAggregates, statsSummary, rolePerms.isAdmin]);

  return (
    <>
      <Navbar />
      <div className="task-report-container">
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
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_year">Last Year</option>
                </select>
              </div>

              {!rolePerms.isAdmin && (
                <div className="task-filter-group">
                  <span className="task-filter-label">Tasks</span>
                  <select
                    className="task-filter-select"
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value)}
                  >
                    <option value="all">All Tasks</option>
                    <option value="created">Created by Me</option>
                    <option value="assigned">Assigned to Me</option>
                  </select>
                </div>
              )}

              {(rolePerms.isAdmin || rolePerms.scope === 'org') && (currentDeptFromPath === 'admin' || !currentDeptFromPath) && (
                <div className="task-filter-group">
                  <span className="task-filter-label">Department</span>
                  <select
                    className="task-filter-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {Array.isArray(departments) &&
                      departments.map((d) => (
                        <option key={d} value={d}>
                          {String(d || '')
                            .split('_')
                            .filter(Boolean)
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
                    <div className="task-stat-label">Total Tasks</div>
                    <div className="task-stat-value">{statsSummary.total}</div>
                  </div>
                  <div className="task-stat-card task-stat-card--pending task-stat-card--active">
                    <div className="task-stat-label">Pending Tasks</div>
                    <div className="task-stat-value">
                      {statsSummary.pending}/{statsSummary.total}
                    </div>
                  </div>
                  <div className="task-stat-card task-stat-card--ended">
                    <div className="task-stat-label">Completed Tasks</div>
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
                  <div className="task-report-card task-report-card--summary">
                    <div className="task-report-card-header">
                      <h2 className="task-report-card-title">Status Overview</h2>
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

                  <div className="task-report-card task-report-card--summary">
                    <div className="task-report-card-header">
                      <h2 className="task-report-card-title">Priority Overview</h2>
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

                  <div className="task-report-card task-report-card--summary task-report-card--project-report">
                    <div className="task-report-card-header">
                      <h2 className="task-report-card-title">Project-wise Task Report</h2>
                      <span className="task-report-card-chip">
                        {duration === 'this_year' ? 'This Year' : 'Selected Range'}
                      </span>
                    </div>
                    <div className="task-report-card-chart task-report-card-chart--wide">
                      <canvas ref={projectBarChartRef}></canvas>
                    </div>
                  </div>
                </div>
              </div>

              <div className="task-dashboard-column">
                {rolePerms.isAdmin && (
                  <div className="task-report-card task-report-card--summary">
                    <div className="task-report-card-header">
                      <h2 className="task-report-card-title">Department-wise Task Report</h2>
                    </div>
                    <div className="task-report-card-chart task-report-card-chart--wide" style={{ minHeight: '300px' }}>
                      <canvas ref={departmentCanvasRef}></canvas>
                    </div>
                    <div className="task-progress-legend" style={{ marginTop: '1rem' }}>
                      {taskStats?.department_breakdown && Object.entries(taskStats.department_breakdown).map(([dept, count], index) => (
                        <div key={dept} className="task-progress-legend-item">
                          <span
                            className="task-progress-dot"
                            style={{
                              backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#4D5360', '#C9CBCF', '#8e5ea2', '#3cba9f'
                              ][index % 10]
                            }}
                          />
                          <span className="task-progress-legend-label">
                            {String(dept || 'Unassigned').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')}: {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="task-report-card task-report-card--summary">
                  <div className="task-report-card-header">
                    <h2 className="task-report-card-title">Task Progress</h2>
                  </div>
                  <div className="task-report-card-chart task-report-card-chart--wide">
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

                <div className="task-report-card task-report-card--summary">
                  <div className="task-report-card-header">
                    <h2 className="task-report-card-title">User-wise Task Report</h2>
                  </div>
                  <div className="task-report-card-chart task-report-card-chart--wide">
                    <canvas ref={userBarChartRef}></canvas>
                  </div>
                </div>
              </div>

              {/* {taskAggregates.avgCompletionDays !== null && (
                <div className="task-report-card task-report-card--time-tracking">
                  <div className="task-report-card-header">
                    <h2 className="task-report-card-title">Time Tracking Report</h2>
                  </div>
                  <div className="task-report-card-body">
                    <div className="task-card-footer-text">
                      Average completion time {taskAggregates.avgCompletionDays} days
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskReports;
