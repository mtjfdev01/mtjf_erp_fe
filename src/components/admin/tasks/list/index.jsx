import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiThumbsUp, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Pagination from '../../../common/Pagination';
import DataFilters from '../../../common/DataFilters';
import ActionMenu from '../../../common/ActionMenu';
import SearchButton from '../../../common/filters/SearchButton';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import '../../../../styles/components.css';
import './index.css';

const TasksList = () => {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
    priority: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [myApprovals, setMyApprovals] = useState([]);

  const currentUserId = user?.id ? Number(user.id) : null;

  const debouncedSearch = useMemo(() => {
    let timeout;
    const fn = (value) => {
      if (timeout) clearTimeout(timeout);
      setIsSearchPending(true);
      timeout = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value }));
        setIsSearchPending(false);
      }, 600);
    };
    fn.cancel = () => timeout && clearTimeout(timeout);
    return fn;
  }, []);

  const handleSearchInputChange = useCallback((value) => {
    setSearchInput(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.department, filters.status, filters.priority]);

  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const filterConfig = [
    { key: 'search', type: 'text', placeholder: isSearchPending ? 'Searching...' : 'Search tasks...', value: searchInput, width: '250px' },
    {
      key: 'department',
      type: 'select',
      placeholder: 'All Departments',
      value: filters.department,
      label: 'Department',
      options: [
        'store',
        'procurements',
        'accounts_and_finance',
        'program',
        'it',
        'marketing',
        'audio_video',
        'fund_raising',
        'admin'
      ].map((dept) => ({ value: dept, label: dept.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }))
    },
    {
      key: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      value: filters.status,
      label: 'Status',
      options: [
        'draft',
        'open',
        'in_progress',
        'pending_approval',
        'approved',
        'rejected',
        'completed',
        'closed',
        'cancelled'
      ].map((s) => ({ value: s, label: s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }))
    },
    {
      key: 'priority',
      type: 'select',
      placeholder: 'All Priorities',
      value: filters.priority,
      label: 'Priority',
      options: ['low', 'medium', 'high', 'critical'].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))
    }
  ];

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  const currentDeptFromPath = useMemo(() => {
    const path = location.pathname || '';
    const segs = path.split('/').filter(Boolean);
    const first = segs[0] || '';
    const known = new Set(['program','store','procurements','accounts_and_finance','fund_raising','admin']);
    return known.has(first) ? first : '';
  }, [location.pathname]);

  const hoverText = (action) => {
    if (action === 'create' && !taskPerms.canCreate) return 'You do not have permission to create tasks';
    if (action === 'view' && !taskPerms.canView) return 'You do not have permission to view tasks';
    if (action === 'update' && !taskPerms.canUpdate) return 'You do not have permission to edit tasks';
    if (action === 'delete' && !taskPerms.canDelete) return 'You do not have permission to delete tasks';
    if (action === 'assign' && !taskPerms.canAssign) return 'You do not have permission to assign tasks';
    if (action === 'approve' && !taskPerms.canApprove) return 'You do not have permission to approve tasks';
    if (action === 'complete' && !taskPerms.canComplete) return 'You do not have permission to complete tasks';
    if (action === 'edit_completed' && !taskPerms.canEditCompleted) return 'You do not have permission to edit completed tasks';
    return action === 'create' ? 'Add new' : '';
  };

  const multiSelectParams = useMemo(() => ({ active: true }), []);

  const isTaskAssignedToCurrentUser = useCallback(
    (task) => {
      if (!currentUserId || !task) return false;
      const ids = Array.isArray(task.assigned_user_ids) ? task.assigned_user_ids : [];
      const metaIds = Array.isArray(task.assigned_users_meta)
        ? task.assigned_users_meta.map((m) => m?.user_id)
        : [];
      const allIds = [...ids, ...metaIds]
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0);
      return allIds.includes(currentUserId);
    },
    [currentUserId]
  );

  const myTasks = useMemo(
    () => tasks.filter((t) => isTaskAssignedToCurrentUser(t)),
    [tasks, isTaskAssignedToCurrentUser]
  );

  const otherTasks = useMemo(
    () => {
      if (!currentUserId) return tasks;
      return tasks.filter((t) => !isTaskAssignedToCurrentUser(t));
    },
    [tasks, isTaskAssignedToCurrentUser, currentUserId]
  );

  useEffect(() => {
    if (!currentUserId) {
      setMyApprovals([]);
      return;
    }
    let cancelled = false;
    const fetchApprovals = async () => {
      try {
        const res = await axiosInstance.get('/tasks/approvals/my');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) {
          setMyApprovals(data);
        }
      } catch {
        if (!cancelled) {
          setMyApprovals([]);
        }
      }
    };
    fetchApprovals();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const approvalRequestsForUser = useMemo(() => {
    if (!currentUserId) return [];
    if (!Array.isArray(myApprovals) || myApprovals.length === 0) return [];
    
    const results = [];
    myApprovals.forEach((approval) => {
      const taskIdNum = Number(approval.task_id);
      if (!Number.isInteger(taskIdNum)) {
        return;
      }
      // Use the task object attached directly to the approval record
      const task = approval.task;
      if (!task) {
        return;
      }
      const workflow = String(task.workflow_type || '').toLowerCase();
      if (workflow !== 'approval_required') {
        return;
      }
      const approverIds = Array.isArray(approval.approval_required_user_ids)
        ? approval.approval_required_user_ids
            .map((v) => Number(v))
            .filter((v) => Number.isInteger(v) && v > 0)
        : [];
      if (approverIds.length > 0 && !approverIds.includes(currentUserId)) {
        return;
      }
      const approvalsMeta = Array.isArray(approval.approvals_meta)
        ? approval.approvals_meta
        : [];
      const myMeta = approvalsMeta.find(
        (m) => m && Number(m.user_id) === Number(currentUserId),
      );
      const myDecision = myMeta
        ? String(myMeta.decision || 'pending').toLowerCase()
        : 'pending';
      const statusLower = String(approval.approval_status || '').toLowerCase();
      if (
        statusLower !== 'pending_approval' &&
        !(statusLower === 'rejected' && myDecision === 'pending')
      ) {
        return;
      }
      if (myDecision !== 'pending') {
        return;
      }
      results.push(task);
    });
    return results;
  }, [myApprovals, tasks, currentUserId]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const scopedFilters = { ...filters };
        const hasUserDeptFilter = !!scopedFilters.department;
        if (!hasUserDeptFilter) {
          if (taskPerms.reportScope === 'org') {
          } else if (currentDeptFromPath) {
            scopedFilters.department = currentDeptFromPath;
          } else if (taskPerms.reportScope === 'department' || taskPerms.reportScope === 'team') {
            scopedFilters.department = user?.department || '';
          }
        }
        const payload = {
          pagination: { page: currentPage, pageSize, sortField, sortOrder },
          filters: scopedFilters
        };
        const res = await axiosInstance.post('/tasks/search', payload);
        const list = res.data.data || [];
        setTasks(list);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [currentPage, pageSize, sortField, sortOrder, filters, taskPerms.reportScope, user?.department, currentDeptFromPath]);

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      handleSearchInputChange(value);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };
  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({ search: '', department: '', status: '', priority: '' });
    setCurrentPage(1);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');
  const capitalize = (s) => s ? s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  const getDueInfo = (rawDate, statusRaw) => {
    if (!rawDate) return null;
    const due = new Date(rawDate);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    const status = String(statusRaw || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(status)) {
      return null;
    }
    if (diffDays === 0) {
      return { label: 'Due today', variant: 'warning' };
    }
    if (diffDays > 0) {
      return {
        label: `In ${diffDays} d`,
        variant: 'normal',
      };
    }
    const overdueDays = Math.abs(diffDays);
    return {
      label: `-${overdueDays} d`,
      variant: 'danger',
    };
  };

  const getStatusBadge = (statusRaw) => {
    const status = String(statusRaw || '').toLowerCase();
    const statusClassMap = {
      pending: 'status-pending',
      pending_approval: 'status-pink',
      draft: 'status-pending',
      failed: 'status-failed',
      rejected: 'status-failed',
      completed: 'status-completed',
      approved: 'status-approved',
      registered: 'status-registered',
      open: 'status-registered',
      in_progress: 'status-pending',
      cancelled: 'status-failed',
      closed: 'status-closed'
    };
    const cls = statusClassMap[status] || 'status-registered';
    const label = capitalize(status) || 'Pending';
    return <span className={`status-badge ${cls}`}>{label}</span>;
  };

  const renderAssignees = (t) => {
    const ids = Array.isArray(t.assigned_user_ids) ? t.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0) : [];
    const metaIds = Array.isArray(t.assigned_users_meta)
      ? t.assigned_users_meta
          .map((m) => m?.user_id)
          .filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const uniqueIds = Array.from(new Set([...(ids || []), ...(metaIds || [])]));
    if (uniqueIds.length === 0) {
      return <span className="person-badge">-</span>;
    }
    if (uniqueIds.length === 1) {
      return (
        <span
          className="person-badge"
          title="Click to view assignees"
          onClick={(e) => handleAssigneeClick(e, t)}
        >
          Single User
        </span>
      );
    }
    return (
      <span
        className="person-badge"
        title="Click to view assignees"
        onClick={(e) => handleAssigneeClick(e, t)}
      >
        Multiple Users
      </span>
    );
  };

  const [openAssigneeTaskId, setOpenAssigneeTaskId] = useState(null);
  const [assigneeDetailsCache, setAssigneeDetailsCache] = useState({});
  const [reassignTask, setReassignTask] = useState(null);
  const [reassignUsers, setReassignUsers] = useState([]);
  const [reassignSaving, setReassignSaving] = useState(false);
  const [reassignError, setReassignError] = useState('');

  useEffect(() => {
    const close = () => setOpenAssigneeTaskId(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleAssigneeClick = async (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    const idsFromAssigned = Array.isArray(task.assigned_user_ids)
      ? task.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const idsFromMeta = Array.isArray(task.assigned_users_meta)
      ? task.assigned_users_meta.map((m) => m?.user_id).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const uniqueIds = Array.from(new Set([...(idsFromAssigned || []), ...(idsFromMeta || [])]));
    if (uniqueIds.length === 0) {
      setOpenAssigneeTaskId(task.id);
      setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: [] }));
      return;
    }
    if (!assigneeDetailsCache[task.id]) {
      try {
        const query = uniqueIds.map((id) => `ids=${encodeURIComponent(id)}`).join('&');
        const byIds = await axiosInstance.get(`/users/by-ids${query ? `?${query}` : ''}`);
        const users = Array.isArray(byIds.data) ? byIds.data : [];
        const deptMap = {};
        if (Array.isArray(task.assigned_users_meta)) {
          task.assigned_users_meta.forEach((m) => { if (m?.user_id) deptMap[m.user_id] = m.department; });
        }
        const details = users.map((u) => ({
          id: u.id,
          name: (`${u.first_name || ''} ${u.last_name || ''}`).trim() || u.email || `User #${u.id}`,
          department: deptMap[u.id] || ''
        }));
        setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: details }));
      } catch {
        setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: [] }));
      }
    }
    setOpenAssigneeTaskId(task.id);
  };

  const handleOpenReassign = (task) => {
    setReassignTask(task);
    setReassignUsers([]);
    setReassignError('');
  };

  const handleCloseReassign = () => {
    if (reassignSaving) return;
    setReassignTask(null);
    setReassignUsers([]);
    setReassignError('');
  };

  const handleReassignSubmit = async () => {
    if (!reassignTask) return;
    if (!Array.isArray(reassignUsers) || reassignUsers.length === 0) {
      setReassignError('Please select at least one user');
      return;
    }
    const ids = reassignUsers
      .map((u) => Number(u.id))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) {
      setReassignError('Please select at least one valid user');
      return;
    }
    const meta = reassignUsers.map((u) => ({
      user_id: Number(u.id),
      department: u.department || user?.department || '',
    }));
    const primary = reassignUsers[0];
    const name =
      (`${primary.first_name || ''} ${primary.last_name || ''}`).trim() ||
      primary.email ||
      `User #${primary.id}`;
    setReassignSaving(true);
    setReassignError('');
    try {
      const res = await axiosInstance.post(`/tasks/${reassignTask.id}/reassign`, {
        assignee_name: name,
        assigned_users: ids,
        assigned_users_meta: meta,
      });
      const updated = res.data?.data || null;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      }
      toast.success('Task reassigned.');
      setReassignTask(null);
      setReassignUsers([]);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to reassign task.';
      setReassignError(msg);
      toast.error(msg);
    } finally {
      setReassignSaving(false);
    }
  };

  const deleteTask = async (task) => {
    const ok = window.confirm('Delete this task?');
    if (!ok) return;
    try {
      await axiosInstance.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTotalItems((prev) => Math.max(prev - 1, 0));
      toast.success('Task deleted.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete task.');
    }
  };

  const getActionMenuItems = (task) => {
    const status = String(task.status).toLowerCase();
    const canView = taskPerms.canView === true;
    return [
      {
        icon: <FiEye />,
        label: 'View',
        color: '#45cc49ff',
        onClick: () => navigate(`/admin/tasks/view/${task.id}`),
        visible: true,
        disabled: !canView,
        title: !canView ? hoverText('view') : 'View'
      },
      {
        icon: <FiEdit2 />,
        label: 'Edit',
        color: '#1e92f1ff',
        onClick: () => navigate(`/admin/tasks/update/${task.id}`),
        visible: true,
        disabled: (status === 'completed' && !taskPerms.canEditCompleted) || !taskPerms.canUpdate,
        title: !taskPerms.canUpdate ? hoverText('update') : (status === 'completed' && !taskPerms.canEditCompleted ? hoverText('edit_completed') : 'Edit')
      },
      {
        icon: <FiUserCheck />,
        label: 'Reassign',
        color: '#8b5cf6',
        onClick: () => handleOpenReassign(task),
        visible: taskPerms.canAssign === true,
        disabled: !taskPerms.canAssign,
        title: taskPerms.canAssign ? 'Reassign' : hoverText('assign'),
      },
      {
        icon: <FiTrash2 />,
        label: 'Delete',
        color: '#f4291bff',
        onClick: () => deleteTask(task),
        visible: true,
        disabled: !taskPerms.canDelete,
        title: !taskPerms.canDelete ? hoverText('delete') : 'Delete'
      }
    ];
  };

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const isSelected = (id) => selectedTaskIds.includes(id);
  const toggleSelected = (id) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const clearSelection = () => setSelectedTaskIds([]);

  const handleSelectAll = (group) => {
    const ids = group.map((t) => t.id);
    const allSelected = ids.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleQuickStatusChange = async (task, nextStatus) => {
    const canUpdate = taskPerms.canUpdate === true;
    const isAssignee = isTaskAssignedToCurrentUser(task);
    const canChangeAsAssignee =
      isAssignee && (taskPerms.canUpdate === true || taskPerms.canView === true);
    if (!canUpdate && !canChangeAsAssignee) {
      toast.error(hoverText('update') || 'You do not have permission to update tasks');
      return;
    }
    setStatusUpdatingId(task.id);
    try {
      const payload = { status: nextStatus, notes: '' };
      const res = await axiosInstance.post(
        `/tasks/${task.id}/status-transition`,
        payload
      );
      const updated = res.data?.data || null;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: nextStatus,
                }
              : t
          )
        );
      }
      toast.success('Status updated.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleBulkStatusChange = async (nextStatus) => {
    if (!selectedTaskIds.length) return;
    if (!window.confirm(`Change status of ${selectedTaskIds.length} task(s)?`)) {
      return;
    }
    const canUpdate = taskPerms.canUpdate === true;
    if (!canUpdate) {
      toast.error(hoverText('update'));
      return;
    }
    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedTaskIds.map((id) =>
          axiosInstance
            .post(`/tasks/${id}/status-transition`, { status: nextStatus, notes: '' })
            .catch(() => null)
        )
      );
      setTasks((prev) =>
        prev.map((t) =>
          selectedTaskIds.includes(t.id)
            ? {
                ...t,
                status: nextStatus,
              }
            : t
        )
      );
      toast.success('Statuses updated.');
      clearSelection();
    } catch {
      toast.error('Failed to update some tasks.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'department', label: 'Department' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'created_at', label: 'Created' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Tasks"
            showBackButton={false}
          />
          <div className="list-content">
            <div className="status-message">Loading tasks...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Tasks"
          showBackButton={false}
          showAdd={true}
          addPath="/admin/tasks/add"
          addDisabled={!taskPerms.canCreate}
          addTitle={hoverText('create')}
        />
        <div className="list-content">
          <div className="tasks-list-filters-row">
            <DataFilters
              filters={filterConfig}
              onFilterChange={handleFilterChange}
              className="tasks-list-filters"
            />
            <SearchButton
              onClick={clearAllFilters}
              text="Clear"
              showIcon={false}
              className="secondary"
              disabled={loading}
            />
          </div>
          {approvalRequestsForUser.length > 0 && (
            <div className="tasks-approval-banner">
              <div className="tasks-approval-pill">
                <div className="tasks-approval-header">
                  <span className="tasks-approval-label">Approval requests</span>
                  <span className="tasks-approval-count">
                    {approvalRequestsForUser.length === 1
                      ? '1 task pending your approval'
                      : `${approvalRequestsForUser.length} tasks pending your approval`}
                  </span>
                </div>
                <ul className="tasks-approval-list">
                  {approvalRequestsForUser.map((t) => (
                    <li
                      key={t.id}
                      className="tasks-approval-item"
                      onClick={() => navigate(`/admin/tasks/view/${t.id}`)}
                    >
                      <div className="tasks-approval-item-main">
                        <span className="tasks-approval-title">
                          {t.title || `Task #${t.id}`}
                        </span>
                        {(t.priority || t.due_date) && (
                          <span className="tasks-approval-sub">
                            {t.priority ? capitalize(t.priority) : null}
                            {t.priority && t.due_date ? ' • ' : ''}
                            {t.due_date ? `Due ${formatDate(t.due_date)}` : null}
                          </span>
                        )}
                      </div>
                      <span className="tasks-approval-meta">View</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {selectedTaskIds.length > 0 && (
            <div className="tasks-bulk-bar">
              <div className="tasks-bulk-count">
                {selectedTaskIds.length} selected
              </div>
              <div className="tasks-bulk-actions">
                <button
                  type="button"
                  className="tasks-bulk-button"
                  disabled={bulkUpdating}
                  onClick={() => handleBulkStatusChange('completed')}
                >
                  Mark completed
                </button>
                <button
                  type="button"
                  className="tasks-bulk-button"
                  disabled={bulkUpdating}
                  onClick={() => handleBulkStatusChange('open')}
                >
                  Reopen
                </button>
                <button
                  type="button"
                  className="tasks-bulk-clear"
                  disabled={bulkUpdating}
                  onClick={clearSelection}
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        myTasks.length + otherTasks.length > 0 &&
                        selectedTaskIds.length === [...myTasks, ...otherTasks].length
                      }
                      onChange={() => handleSelectAll([...myTasks, ...otherTasks])}
                    />
                  </th>
                  <th>Task Title</th>
                  <th className="hide-on-mobile">Department</th>
                  <th>Assignees</th>
                  <th className="hide-on-mobile">Priority</th>
                  <th className="hide-on-mobile">Status</th>
                  <th className="hide-on-mobile">Start Date</th>
                  <th className="hide-on-mobile">Due Date</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.length > 0 && (
                  <>
                    <tr className="tasks-group-row">
                      <td colSpan={8}>
                        <span className="tasks-group-label tasks-group-label--mine">
                          Tasks assigned to you
                        </span>
                      </td>
                    </tr>
                    {myTasks.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected(t.id)}
                            onChange={() => toggleSelected(t.id)}
                          />
                        </td>
                        <td>{t.title}</td>
                        <td className="hide-on-mobile">{capitalize(t.department)}</td>
                        <td>
                          <div
                            className="tasks-assignee-trigger"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderAssignees(t)}
                            {openAssigneeTaskId === t.id && (
                              <div
                                className="tasks-assignee-popover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(assigneeDetailsCache[t.id] || []).length === 0 ? (
                                  <div className="tasks-assignee-empty">No assignees</div>
                                ) : (
                                  <ul className="tasks-assignee-list">
                                    {assigneeDetailsCache[t.id].map((d) => (
                                      <li key={d.id} className="tasks-assignee-list-item">
                                        <span className="tasks-assignee-name">{d.name}</span>
                                        {d.department && (
                                          <span className="tasks-assignee-department">
                                            {' '}
                                            • {d.department.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hide-on-mobile">{capitalize(t.priority)}</td>
                        <td className="hide-on-mobile">
                          <div className="tasks-status-cell">
                            {getStatusBadge(t.status)}
                            {taskPerms.canUpdate && (
                              <div className="tasks-quick-status">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) return;
                                    handleQuickStatusChange(t, value);
                                  }}
                                  disabled={statusUpdatingId === t.id}
                                >
                                  <option value="">Quick status...</option>
                                  <option value="in_progress">Start</option>
                                  <option value="completed">Complete</option>
                                  <option value="open">Reopen</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hide-on-mobile">{formatDate(t.start_date)}</td>
                        <td className="hide-on-mobile">
                          <div className="tasks-due-cell">
                            <div>{formatDate(t.due_date)}</div>
                            {getDueInfo(t.due_date, t.status) && (
                              <span
                                className={`task-due-badge task-due-badge--${
                                  getDueInfo(t.due_date, t.status).variant
                                }`}
                              >
                                {getDueInfo(t.due_date, t.status).label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <ActionMenu actions={getActionMenuItems(t)} />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                {otherTasks.length > 0 && (
                  <>
                    {myTasks.length > 0 && (
                      <tr className="tasks-group-row">
                        <td colSpan={8}>
                          <span className="tasks-group-label tasks-group-label--other">
                            Other tasks
                          </span>
                        </td>
                      </tr>
                    )}
                    {otherTasks.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected(t.id)}
                            onChange={() => toggleSelected(t.id)}
                          />
                        </td>
                        <td>{t.title}</td>
                        <td className="hide-on-mobile">{capitalize(t.department)}</td>
                        <td>
                          <div
                            className="tasks-assignee-trigger"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderAssignees(t)}
                            {openAssigneeTaskId === t.id && (
                              <div
                                className="tasks-assignee-popover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(assigneeDetailsCache[t.id] || []).length === 0 ? (
                                  <div className="tasks-assignee-empty">No assignees</div>
                                ) : (
                                  <ul className="tasks-assignee-list">
                                    {assigneeDetailsCache[t.id].map((d) => (
                                      <li key={d.id} className="tasks-assignee-list-item">
                                        <span className="tasks-assignee-name">{d.name}</span>
                                        {d.department && (
                                          <span className="tasks-assignee-department">
                                            {' '}
                                            • {d.department.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hide-on-mobile">{capitalize(t.priority)}</td>
                        <td className="hide-on-mobile">
                          <div className="tasks-status-cell">
                            {getStatusBadge(t.status)}
                            {taskPerms.canUpdate && (
                              <div className="tasks-quick-status">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) return;
                                    handleQuickStatusChange(t, value);
                                  }}
                                  disabled={statusUpdatingId === t.id}
                                >
                                  <option value="">Quick status...</option>
                                  <option value="in_progress">Start</option>
                                  <option value="completed">Complete</option>
                                  <option value="open">Reopen</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hide-on-mobile">{formatDate(t.start_date)}</td>
                        <td className="hide-on-mobile">
                          <div className="tasks-due-cell">
                            <div>{formatDate(t.due_date)}</div>
                            {getDueInfo(t.due_date, t.status) && (
                              <span
                                className={`task-due-badge task-due-badge--${
                                  getDueInfo(t.due_date, t.status).variant
                                }`}
                              >
                                {getDueInfo(t.due_date, t.status).label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <ActionMenu actions={getActionMenuItems(t)} />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          {reassignTask && (
            <div className="custom-modal-overlay">
              <div className="custom-modal-content reassign-modal reassign-modal-content">
                <div className="reassign-modal-header">
                  <div>
                    <h2 className="reassign-modal-title">Reassign Task</h2>
                    <p className="reassign-modal-subtitle">
                      Select one or more users to assign this task to.
                    </p>
                  </div>
                  <button className="custom-modal-close" onClick={handleCloseReassign}>
                    &times;
                  </button>
                </div>
                <div className="reassign-modal-body">
                  <div className="reassign-field-group">
                    <div className="reassign-field-label">Assign Users</div>
                  <SearchableMultiSelect
                    label=""
                    apiEndpoint="/users/options"
                    apiParams={multiSelectParams}
                    onSelect={(users) => setReassignUsers(users)}
                    onClear={() => setReassignUsers([])}
                    value={reassignUsers}
                    displayKey="first_name"
                    valueKey="id"
                    allowResearch={true}
                    debounceDelay={500}
                    minSearchLength={2}
                    disabled={reassignSaving}
                    renderOption={(userOption) => (
                      <div className="reassign-user-option">
                        <div className="reassign-user-name">
                          {userOption.first_name} {userOption.last_name}
                        </div>
                        <div className="reassign-user-email">
                          {userOption.email}
                        </div>
                        {userOption.department && (
                          <div className="reassign-user-meta">
                            {userOption.department} • {userOption.role || 'User'}
                          </div>
                        )}
                      </div>
                    )}
                  />
                  {reassignUsers.length > 0 && (
                    <div className="reassign-selection-hint">
                      {'\u2713'} {reassignUsers.length}{' '}
                      {reassignUsers.length === 1 ? 'user selected' : 'users selected'}
                    </div>
                  )}
                </div>
                {reassignError && (
                  <div className="status-message status-message--error reassign-error">
                    {reassignError}
                  </div>
                )}
                </div>
                <div className="reassign-modal-footer">
                  <button
                    type="button"
                    className="secondary-button reassign-modal-cancel"
                    onClick={handleCloseReassign}
                    disabled={reassignSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="reassign-modal-confirm"
                    onClick={handleReassignSubmit}
                    disabled={reassignSaving}
                  >
                    {reassignSaving ? 'Reassigning...' : 'Confirm Reassign'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {tasks.length === 0 && !error && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiThumbsUp />
              </div>
              <div className="empty-state-text">No tasks found</div>
              <div className="empty-state-subtext">
                Adjust filters or create a new task to get started.
              </div>
            </div>
          )}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
              onSortChange={(f, o) => { setSortField(f); setSortOrder(o); setCurrentPage(1); }}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TasksList;
