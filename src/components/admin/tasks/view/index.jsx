import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { splitDescriptionAndMov } from '../../../../utils/movEncoding';
import PrimaryButton from '../../../common/buttons/primary';
import TaskActionBar from './TaskActionBar';
import TimeTracker from './TimeTracker';
import ProgressUpdate from './ProgressUpdate';
import StatusUpdateModal from './StatusUpdateModal';
import QuickActionModal from './QuickActionModal';
import { STATUS_TRANSITION_MAP, QUICK_ACTION_LABEL_MAP } from './taskStatusConfig';
import '../../../../styles/variables.css';
import './index.css';

const ViewTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [task, setTask] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUsersMeta, setAssignedUsersMeta] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState({ file: null });
  const [comment, setComment] = useState({ content: '' });
  const [savingAttachment, setSavingAttachment] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [approvalState, setApprovalState] = useState(null);

  const getAttachmentHref = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    const base = axiosInstance.defaults.baseURL || '';
    const normalizedBase = base.replace(/\/$/, '');
    return `${normalizedBase}${fileUrl}`;
  };

  useEffect(() => {
    setShowFullDescription(false);
  }, [task?.id]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const t = res.data.data;
        setTask(t);
        const idsFromAssigned = Array.isArray(t.assigned_user_ids)
          ? t.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromMeta = Array.isArray(t.assigned_users_meta)
          ? t.assigned_users_meta
              .map((m) => m?.user_id)
              .filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromApprovers = Array.isArray(t.approval_required_user_ids)
          ? t.approval_required_user_ids
              .map((n) => Number(n))
              .filter((n) => Number.isInteger(n) && n > 0)
          : [];

        let approvalMetaIds = [];
        try {
          const approvalRes = await axiosInstance.get(`/tasks/${id}/approval`);
          const approvalData = approvalRes.data?.data || null;
          setApprovalState(approvalData);
          const approvalsMetaRaw = Array.isArray(approvalData?.approvals_meta)
            ? approvalData.approvals_meta
            : [];
          approvalMetaIds = approvalsMetaRaw
            .map((m) => (m && m.user_id ? Number(m.user_id) : null))
            .filter((n) => Number.isInteger(n) && n > 0);
        } catch {
          setApprovalState(null);
          approvalMetaIds = [];
        }

        const reassignmentIds = [];
        if (Array.isArray(t.activities)) {
          t.activities.forEach((a) => {
            if (!a || a.action !== 'reassigned') return;
            const details = a.details;
            if (Array.isArray(details)) {
              details.forEach((d) => {
                if (!d || d.user_id == null) return;
                const num = Number(d.user_id);
                if (Number.isInteger(num) && num > 0) {
                  reassignmentIds.push(num);
                }
              });
            } else if (details && typeof details === 'object') {
              const fromIds = Array.isArray(details.from_assigned_user_ids) ? details.from_assigned_user_ids : [];
              const toIds = Array.isArray(details.to_assigned_user_ids) ? details.to_assigned_user_ids : [];
              [...fromIds, ...toIds].forEach((idVal) => {
                const num = Number(idVal);
                if (Number.isInteger(num) && num > 0) {
                  reassignmentIds.push(num);
                }
              });
            }
          });
        }

        const uniqueIds = Array.from(
          new Set([
            ...(idsFromAssigned || []),
            ...(idsFromMeta || []),
            ...idsFromApprovers,
            ...approvalMetaIds,
            ...reassignmentIds,
          ]),
        );
        setAssignedUsersMeta(Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : []);
        if (uniqueIds.length > 0) {
          try {
            const query = uniqueIds.map((idVal) => `ids=${encodeURIComponent(idVal)}`).join('&');
            const byIds = await axiosInstance.get(`/users/by-ids${query ? `?${query}` : ''}`);
            const usersArray = Array.isArray(byIds.data) ? byIds.data : [];
            const map = {};
            usersArray.forEach((u) => {
              if (u && u.id != null) {
                map[Number(u.id)] = u;
              }
            });
            setUsersById(map);
            const assignedSet = new Set(idsFromAssigned.map((v) => Number(v)));
            setAssignedUsers(usersArray.filter((u) => assignedSet.has(Number(u.id))));
          } catch {
            setUsersById({});
            setAssignedUsers([]);
          }
        } else {
          setUsersById({});
          setAssignedUsers([]);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load task.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const capitalize = (s) => s ? s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '';
  const getDeptTasksBasePath = (dept) => {
    const map = {
      program: '/program/tasks/list',
      store: '/store/tasks/list',
      procurements: '/procurements/tasks/list',
      accounts_and_finance: '/accounts_and_finance/tasks/list',
      fund_raising: '/fund_raising/tasks/list',
      admin: '/admin/tasks/list'
    };
    return map[dept] || '/admin/tasks/list';
  };
  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';
  const formatDateOnly = (d) => d ? new Date(d).toLocaleDateString() : '-';
  const formatTaskId = (t) => {
    if (!t) return '-';
    if (t.code) return `#${t.code}`;
    const raw = t.id != null ? String(t.id) : '';
    if (!raw) return '-';
    const padded = raw.padStart(4, '0');
    return `#TASK-${padded}`;
  };

  const getDueInfo = (rawDate, statusRaw) => {
    if (!rawDate) {
      return null;
    }
    const due = new Date(rawDate);
    if (Number.isNaN(due.getTime())) {
      return null;
    }
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
        label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
        variant: 'normal',
      };
    }
    const overdueDays = Math.abs(diffDays);
    return {
      label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`,
      variant: 'danger',
    };
  };
  const getUserDisplayName = (u) => {
    if (!u) return '-';
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (full) return full;
    if (u.email) return u.email;
    if (u.id) return `User #${u.id}`;
    return '-';
  };
  const getUserNameFromId = (id) => {
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) return '-';
    const userObj = usersById[num];
    if (userObj) return getUserDisplayName(userObj);
    return `User #${num}`;
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
      closed: 'status-closed',
    };
    const cls = statusClassMap[status] || 'status-registered';
    const normalized = status ? status.replace(/_/g, ' ') : 'pending';
    const label = normalized.toUpperCase();
    return <span className={`status-badge ${cls}`}>{label}</span>;
  };

  const getTaskTypeValue = (t) => {
    if (!t) return 'one_time';
    const hasRecurrence = t.recurrence_rule || t.recurrence_next_date;
    const hasProject = t.project_id || t.project_name;
    if (hasRecurrence) return 'recurring';
    if (hasProject) return 'project_linked';
    return 'one_time';
  };
  const taskTypeValueFromBackend = String(task?.task_type || '').toLowerCase();
  const inferredTaskTypeValue = getTaskTypeValue(task);
  const taskTypeValue = taskTypeValueFromBackend || inferredTaskTypeValue;
  const isRecurringTask = taskTypeValue === 'recurring';
  const taskTypeLabel =
    taskTypeValue === 'recurring'
      ? 'Recurring Task'
      : taskTypeValue === 'project_linked'
      ? 'Project-linked Task'
      : 'One-time Task';
  const isApprovalWorkflow =
    String(task?.workflow_type || '').toLowerCase() === 'approval_required';
  const statusLower = String(task?.status || '').toLowerCase();
  const approvalRequiredIds = Array.isArray(task?.approval_required_user_ids)
    ? task.approval_required_user_ids
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];
  const approvalsMetaRaw = Array.isArray(approvalState?.approvals_meta)
    ? approvalState.approvals_meta
    : [];

  const approvalsMeta = approvalsMetaRaw;
  const currentUserId = Number(user?.id) || 0;
  const isCurrentUserApprover =
    currentUserId > 0 && approvalRequiredIds.includes(currentUserId);
  const isApproverView = isApprovalWorkflow && isCurrentUserApprover;
  const approvalRows = approvalRequiredIds.map((idVal) => {
    const meta = approvalsMeta.find(
      (m) => m && Number(m.user_id) === Number(idVal),
    );
    const decisionRaw = meta?.decision || 'pending';
    let decision = String(decisionRaw || 'pending').toLowerCase();
    if (
      isApprovalWorkflow &&
      (statusLower === 'approved' || statusLower === 'closed') &&
      (!meta || decision === 'pending')
    ) {
      decision = 'approved';
    }
    let decisionLabel = 'Pending';
    if (decision === 'approved') decisionLabel = 'Approved';
    else if (decision === 'rejected') decisionLabel = 'Rejected';
    return {
      id: idVal,
      name: getUserNameFromId(idVal),
      decision,
      decisionLabel,
    };
  });
  const hasApprovalPanel =
    isApprovalWorkflow && approvalRequiredIds && approvalRequiredIds.length > 0;
  const showCompletedDate =
    !!task?.completed_date &&
    ((!isApprovalWorkflow &&
      ['completed', 'closed', 'cancelled'].includes(statusLower)) ||
      (isApprovalWorkflow &&
        [
          'completed',
          'pending_approval',
          'approved',
          'rejected',
          'closed',
          'cancelled',
        ].includes(statusLower)));

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalAction, setStatusModalAction] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [quickActionKey, setQuickActionKey] = useState(null);
  const [currentUserHasActedOnApproval, setCurrentUserHasActedOnApproval] =
    useState(false);

  const isTaskOverdue = () => {
    if (!task || !task.due_date) return false;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return false;
    const now = new Date();
    const status = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(status)) return false;
    return now > due;
  };

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  const canApprove = taskPerms.canApprove === true;
  const canCreate = taskPerms.canCreate === true;
  const canUpdate = taskPerms.canUpdate === true;
  const canView = taskPerms.canView === true;
  const canInteractWithNotes = canUpdate || canCreate || canView;
  const canDeleteAttachment = canUpdate || canCreate;

  const primaryAssigneeName =
    assignedUsers && assignedUsers.length > 0
      ? getUserDisplayName(assignedUsers[0])
      : '';

  const isCurrentUserAssignee =
    user && assignedUsers && assignedUsers.some((u) => Number(u.id) === Number(user.id));
  const canEditMovChecklist = canView && isCurrentUserAssignee;
  const canChangeStatusInline =
    canView &&
    isCurrentUserAssignee &&
    !['pending_approval', 'completed', 'closed', 'cancelled'].includes(
      statusLower,
    );

  const handleInlineStatusChange = async (nextStatus) => {
    if (!canChangeStatusInline) return;
    const normalizedNext = String(nextStatus || '').toLowerCase();
    const current = String(task?.status || '').toLowerCase();
    if (!normalizedNext || normalizedNext === current) {
      setStatusDropdownOpen(false);
      return;
    }
    setStatusActionLoading(true);
    setError('');
    try {
      const payload = { status: normalizedNext, notes: '' };
      await axiosInstance.post(`/tasks/${id}/status-transition`, payload);
      const refreshed = await axiosInstance.get(`/tasks/${id}`);
      const updatedTask = refreshed.data?.data || null;
      if (updatedTask) {
        setTask(updatedTask);
      }
      toast.success('Status updated.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update status.';
      setError(msg);
      toast.error(msg);
    } finally {
      setStatusActionLoading(false);
      setStatusDropdownOpen(false);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setAttachment({ file: file || null });
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setComment((prev) => ({ ...prev, [name]: value }));
  };

  const addAttachment = async (e) => {
    e.preventDefault();
    setSavingAttachment(true);
    setError('');
    try {
      if (!attachment.file) {
        setSavingAttachment(false);
        setError('Please select a file to upload.');
        toast.error('Please select a file to upload.');
        return;
      }
      const formData = new FormData();
      formData.append('file', attachment.file);
      const res = await axiosInstance.post(
        `/tasks/${id}/attachments/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setTask((prev) => ({ ...prev, attachments: [...(prev.attachments || []), res.data.data] }));
      setAttachment({ file: null });
      toast.success('Attachment added.');
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to add attachment.');
      toast.error(e2.response?.data?.message || 'Failed to add attachment.');
    } finally {
      setSavingAttachment(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    setSavingComment(true);
    setError('');
    try {
      const res = await axiosInstance.post(`/tasks/${id}/comments`, comment);
      setTask((prev) => ({ ...prev, comments: [...(prev.comments || []), res.data.data] }));
      setComment({ content: '' });
      toast.success('Comment added.');
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to add comment.');
      toast.error(e2.response?.data?.message || 'Failed to add comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const handleStatusActionClick = (action) => {
    setStatusModalAction(action);
    setStatusModalOpen(true);
  };

  const handleStatusUpdated = async (updated) => {
    if (updated) {
      setTask(updated);
    } else {
      const action = statusModalAction;
      const nextStatus = STATUS_TRANSITION_MAP[action];
      if (nextStatus) {
        setTask((prev) => ({
          ...prev,
          status: nextStatus,
        }));
      }
    }
    try {
      const approvalRes = await axiosInstance.get(`/tasks/${id}/approval`);
      const approvalData = approvalRes.data?.data || null;
      setApprovalState(approvalData);
    } catch {
    }
  };

  const handleQuickAction = (key) => {
    setQuickActionKey(key);
    setQuickActionOpen(true);
  };

  const handleRemoveAttachment = async (attachmentId) => {
    if (!canDeleteAttachment) return;
    if (!window.confirm('Are you sure you want to remove this attachment?')) {
      return;
    }
    setError('');
    try {
      await axiosInstance.delete(`/tasks/${id}/attachments/${attachmentId}`);
      setTask((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter(
          (att) => att.id !== attachmentId
        ),
      }));
      toast.success('Attachment removed.');
    } catch (e2) {
      const msg =
        e2.response?.data?.message || 'Failed to remove attachment.';
      setError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (!task || !task.project_id) {
      setRelatedTasks([]);
      return;
    }
    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const payload = {
          pagination: {
            page: 1,
            pageSize: 5,
            sortField: 'created_at',
            sortOrder: 'DESC',
          },
          filters: {
            project_id: task.project_id,
          },
        };
        const res = await axiosInstance.post('/tasks/search', payload);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const filtered = list.filter(
          (t) => t && t.id !== task.id && t.project_id === task.project_id
        );
        setRelatedTasks(filtered);
      } catch {
        setRelatedTasks([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelated();
  }, [task]);

  const dependencies = Array.isArray(task?.dependencies) ? task.dependencies : [];

  const collaborationUsers = (() => {
    const map = {};
    assignedUsers.forEach((u) => {
      if (u && u.id != null) {
        map[u.id] = u;
      }
    });
    if (Array.isArray(task?.comments)) {
      task.comments.forEach((c) => {
        if (c && c.author && c.author.id != null) {
          map[c.author.id] = c.author;
        }
      });
    }
    return Object.values(map);
  })();

  const statusLabel = String(task?.status || '')
    .toUpperCase()
    .replace(/_/g, ' ');

  const inlineStatusOptions = useMemo(() => {
    const currentStatus = String(task?.status || '').toLowerCase();
    if (currentStatus === 'closed') {
      return [
        { value: 'closed', label: 'Closed' },
      ];
    }
    if (currentStatus === 'approved') {
      return [
        { value: 'approved', label: 'Approved' },
      ];
    }
    return [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ];
  }, [task?.status]);

  const dueInfo = getDueInfo(task?.due_date, task?.status);

  const reassignmentActivities = Array.isArray(task?.activities)
    ? [...task.activities]
        .filter((a) => a && a.action === 'reassigned')
        .sort((a, b) => {
          const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
          return ad - bd;
        })
    : [];

  const progressActivities = Array.isArray(task?.activities)
    ? [...task.activities]
        .filter((a) => {
          if (!a) return false;
          const action = String(a.action || '').toLowerCase();
          if (
            action === 'progress_updated' ||
            action === 'progress_update' ||
            action === 'update_progress' ||
            action.includes('progress')
          ) {
            return true;
          }
          const details =
            a && a.details && typeof a.details === 'object' ? a.details : {};
          if (details && details.progress != null) {
            return true;
          }
          const detailsText =
            typeof a.details === 'string'
              ? a.details
              : typeof details.notes === 'string'
              ? details.notes
              : '';
          if (
            detailsText &&
            detailsText.toLowerCase().includes('checklist items completed')
          ) {
            return true;
          }
          return false;
        })
        .sort((a, b) => {
          const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bd - ad;
        })
    : [];

  useEffect(() => {
    if (
      !task ||
      !user ||
      !Array.isArray(approvalState?.approvals_meta)
    ) {
      setCurrentUserHasActedOnApproval(false);
      return;
    }
    const myMeta = approvalState.approvals_meta.find(
      (m) => m && Number(m.user_id) === Number(user.id),
    );
    const decision = myMeta
      ? String(myMeta.decision || 'pending').toLowerCase()
      : 'pending';
    setCurrentUserHasActedOnApproval(
      decision === 'approved' || decision === 'rejected',
    );
  }, [task, user?.id, approvalState]);

  useEffect(() => {
    if (progressActivities.length > 0) {
      setShowProgressHistory(true);
    }
  }, [progressActivities.length]);

  const backDeptForLoading = user?.department || (task && task.department);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper task-view-wrapper">
          <PageHeader 
            title="View Task"
            showBackButton={true}
            backPath={getDeptTasksBasePath(backDeptForLoading)}
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper task-view-wrapper">
          <PageHeader 
            title="View Task"
            showBackButton={true}
            backPath={getDeptTasksBasePath(backDeptForLoading)}
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error || 'Task not found'}</div>
          </div>
        </div>
      </>
    );
  }

  const { baseDescription, movItems: movFromDescription } = splitDescriptionAndMov(
    task?.description || '',
  );
  const rawDescription = String(baseDescription || '').trim();
  const movLinesFromField = Array.isArray(task?.mov_items)
    ? task.mov_items
        .map((text) => String(text || '').trim())
        .filter((text) => text.length > 0)
    : [];
  const movLines =
    movLinesFromField.length > 0
      ? movLinesFromField
      : movFromDescription && movFromDescription.length > 0
      ? movFromDescription
      : [];
  const shouldTruncateDescription = rawDescription.length > 200;
  const descriptionMidpoint = shouldTruncateDescription
    ? Math.floor(rawDescription.length / 2)
    : rawDescription.length;
  const descriptionFirstHalf = rawDescription.slice(0, descriptionMidpoint);
  const descriptionSecondHalf = rawDescription.slice(descriptionMidpoint);

  return (
    <>
      <Navbar />
      <div className="view-wrapper task-view-wrapper">
        <PageHeader 
          title="Task Details"
          showBackButton={true}
          backPath={getDeptTasksBasePath(user?.department || task?.department)}
          showEdit={taskPerms.canUpdate === true}
          editPath={`/admin/tasks/update/${task.id}`}
        />
        <div className="view-content2">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="task-receipt-page">
            <div className="receipt-container">
              <div className="receipt-header">
                <div className="receipt-title">
                  <div className="receipt-logo">📋</div>
                  <div>
                    <h1>{task.title || 'Task Title'}</h1>
                  </div>
                </div>
                <div className="task-id">{formatTaskId(task)}</div>
              </div>

              <div className="status-banner">
                <div className="status-banner-main">
                  <strong>Task Status:</strong>
                  {canChangeStatusInline ? (
                    <div className="status-dropdown">
                      <button
                        type="button"
                        className="status-dropdown-toggle"
                        onClick={() => setStatusDropdownOpen((prev) => !prev)}
                        disabled={statusActionLoading}
                      >
                        <span className="status-dropdown-label">{statusLabel}</span>
                        <span className="status-dropdown-arrow">▾</span>
                      </button>
                      {statusDropdownOpen && (
                        <div className="status-dropdown-menu">
                          {inlineStatusOptions.map((opt) => {
                            const isActive =
                              String(task.status || '').toLowerCase() === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                className={`status-dropdown-item${
                                  isActive ? ' status-dropdown-item--active' : ''
                                }`}
                                onClick={() => handleInlineStatusChange(opt.value)}
                                disabled={statusActionLoading}
                              >
                                <span
                                  className={`status-dropdown-check${
                                    isActive ? ' status-dropdown-check--checked' : ''
                                  }`}
                                />
                                <span className="status-dropdown-item-label">
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="receipt-status-badge">{statusLabel}</span>
                  )}
                </div>
              </div>

              <div className="receipt-body">
                {isTaskOverdue() && (
                  <div className="overdue-reminder">
                    <div className="overdue-reminder-icon">!</div>
                    <div className="overdue-reminder-content">
                      <div className="overdue-reminder-title">Task is overdue</div>
                      <div className="overdue-reminder-text">
                        {primaryAssigneeName
                          ? `Hi ${primaryAssigneeName}, this task is now overdue. Please review and complete it as soon as possible.`
                          : 'This task is now overdue. Please review and complete it as soon as possible.'}
                      </div>
                    </div>
                  </div>
                )}

                <TaskActionBar
                  taskId={task.id}
                  currentStatus={task.status}
                  permissions={taskPerms}
                  userDepartment={user?.department}
                  taskDepartment={task.department}
                  workflowType={task.workflow_type}
                  userRole={user?.role}
                  isAssignee={isCurrentUserAssignee}
                  currentUserId={user?.id}
                  approvalRequiredUserIds={task.approval_required_user_ids}
                  approvalsMeta={approvalState?.approvals_meta}
                  currentUserHasActedOnApproval={currentUserHasActedOnApproval}
                  onStatusAction={handleStatusActionClick}
                  onQuickAction={handleQuickAction}
                  disabled={statusActionLoading}
                  align="top"
                />
                <div className="view-section">
                  <h3 className="view-section-title">Description</h3>
                  <div className="view-grid">
                    <div className="view-item task-description-item">
                      {rawDescription ? (
                        <span className="view-item-value task-description-text">
                          {shouldTruncateDescription ? (
                            showFullDescription ? (
                              <>
                                {rawDescription}{' '}
                                <button
                                  type="button"
                                  className="task-description-read-more"
                                  onClick={() => setShowFullDescription(false)}
                                >
                                  View Less
                                </button>
                              </>
                            ) : (
                              <>
                                {descriptionFirstHalf}
                                {descriptionSecondHalf && '... '}
                                {descriptionSecondHalf && (
                                  <button
                                    type="button"
                                    className="task-description-read-more"
                                    onClick={() => setShowFullDescription(true)}
                                  >
                                    Read More
                                  </button>
                                )}
                              </>
                            )
                          ) : (
                            rawDescription
                          )}
                        </span>
                      ) : (
                        <span className="view-item-value task-description-text">-</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="view-section">
                  <h3 className="view-section-title">
                    {isApproverView
                      ? 'Progress & Means of Verification'
                      : 'Check the box to update progress'}
                  </h3>
                    <div className="view-grid task-progress-layout">
                    <div className="view-item task-progress-item">
                      {movLines.length > 0 ? (
                        <ProgressUpdate
                          taskId={task.id}
                          currentProgress={task.progress || 0}
                          movLines={movLines}
                          canEdit={canEditMovChecklist}
                          onUpdate={(progress, notes, updatedTask) => {
                            if (updatedTask) {
                              setTask(updatedTask);
                            } else {
                              setTask((prev) => ({
                                ...prev,
                                progress,
                                last_progress_notes: notes,
                              }));
                            }
                            setShowProgressHistory(true);
                          }}
                        />
                      ) : (
                        <div className="task-progress-empty">
                          No Means of Verification (MOV) checklist items have been defined for this
                          task.
                        </div>
                      )}
                    </div>
                    {(showProgressHistory || progressActivities.length > 0) && (
                      <div className="view-item">
                        <div className="task-progress-history">
                          <div className="task-progress-history-title">
                            Progress history
                          </div>
                          {progressActivities.length > 0 ? (
                            <ul className="task-progress-history-list">
                              {progressActivities.map((a) => {
                                const when =
                                  a && a.created_at
                                    ? formatDateOnly(a.created_at)
                                    : '';
                                const details =
                                  a && a.details && typeof a.details === 'object'
                                    ? a.details
                                    : {};
                                const value =
                                  details && details.progress != null
                                    ? `${details.progress}%`
                                    : '';
                                const notes =
                                  details && typeof details.notes === 'string'
                                    ? details.notes
                                    : '';
                                const performer =
                                  a && a.performed_by ? a.performed_by : null;
                                const author =
                                  (performer &&
                                    (performer.name ||
                                      performer.full_name ||
                                      performer.username ||
                                      performer.email)) ||
                                  'System';
                                return (
                                  <li
                                    key={a.id}
                                    className="task-progress-history-item"
                                  >
                                    <div className="task-progress-history-header">
                                      <span className="task-progress-history-author">
                                        {author}
                                      </span>
                                      <span className="task-progress-history-date">
                                        {when}
                                      </span>
                                    </div>
                                    <div className="task-progress-history-body">
                                      {value && (
                                        <span className="task-progress-history-progress">
                                          {value}
                                        </span>
                                      )}
                                      {notes && (
                                        <span className="task-progress-history-notes">
                                          {notes}
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="task-progress-history-empty">
                              No progress history yet.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="view-layout">
                  <div className="view-layout-main">
                    <div
                      className={`view-section view-section--timeline${
                        isApproverView ? ' view-section--approver-secondary' : ''
                      }`}
                    >
                      <h3 className="view-section-title">Task Information</h3>
                      <div className="view-grid">
                        {/* <div className="view-item">
                          <span className="view-item-label">Task ID</span>
                          <span className="view-item-value">{formatTaskId(task)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Title</span>
                          <span className="view-item-value">{task.title}</span>
                        </div>*/}
                        <div className="view-item">
                          <span className="view-item-label">Status</span>
                          <span className="view-item-value">{getStatusBadge(task.status)}</span>
                        </div> 
                        <div className="view-item">
                          <span className="view-item-label">Priority</span>
                          <span className="view-item-value">
                            <span className={`priority-badge priority-badge--${String(task.priority || '').toLowerCase() || 'low'}`}>
                              {capitalize(task.priority)}
                            </span>
                          </span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Task Type</span>
                          <span className="view-item-value">{taskTypeLabel}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Workflow</span>
                          <span className="view-item-value">{capitalize(task.workflow_type)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Created By</span>
                          <span className="view-item-value">{getUserDisplayName(task.created_by)}</span>
                        </div>
                        {/* <div className="view-item">
                          <span className="view-item-label">Department</span>
                          <span className="view-item-value">{capitalize(task.department)}</span>
                        </div> 
                        <div className="view-item">
                          <span className="view-item-label">Reported To</span>
                          <span className="view-item-value">{getUserDisplayName(task.reported_by)}</span>
                        </div>*/}
                        <div className="view-item">
                          <span className="view-item-label">Project Name</span>
                          <span className="view-item-value">{task.project_name || '-'}</span>
                        </div>
                        {isApprovalWorkflow &&
                          ['approved', 'rejected'].includes(String(task?.status || '').toLowerCase()) &&
                          task?.approved_by && (
                            <div className="view-item">
                              <span className="view-item-label">
                                {String(task?.status || '').toLowerCase() === 'rejected' ? 'Rejected By' : 'Approved By'}
                              </span>
                              <span className="view-item-value">{getUserDisplayName(task.approved_by)}</span>
                            </div>
                          )}
                      </div>
                    </div>

                    <div
                      className={`view-section${
                        isApproverView ? ' view-section--approver-secondary' : ''
                      }`}
                    >
                      <h3 className="view-section-title">Timeline</h3>
                      <div className="view-grid-2">
                        <div className="view-item">
                          <span className="view-item-label">Start Date</span>
                          <span className="view-item-value">{formatDateOnly(task.start_date)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Due Date</span>
                          <span className="view-item-value">
                            {formatDateOnly(task.due_date)}
                            {dueInfo && (
                              <span
                                className={`task-due-badge task-due-badge--${dueInfo.variant}`}
                              >
                                {dueInfo.label}
                              </span>
                            )}
                          </span>
                        </div>
                        {showCompletedDate && (
                          <div className="view-item">
                            <span className="view-item-label">Completed Date</span>
                            <span className="view-item-value">
                              {formatDateOnly(task.completed_date)}
                            </span>
                          </div>
                        )}
                        {isRecurringTask && (
                          <>
                            <div className="view-item">
                              <span className="view-item-label">Recurrence Rule</span>
                              <span className="view-item-value">{task.recurrence_rule || '-'}</span>
                            </div>
                            <div className="view-item">
                              <span className="view-item-label">Next Recurrence</span>
                              <span className="view-item-value">{formatDateOnly(task.recurrence_next_date)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!isApproverView && dependencies.length > 0 && (
                      <div className="view-section">
                        <h3 className="view-section-title">Dependencies</h3>
                        <div className="view-grid">
                          <div className="view-item">
                            <ul className="dependencies-list">
                              {dependencies.map((dep) => {
                                const key = dep.id || dep.task_id || dep;
                                const title = dep.title || dep.name || `Task #${key}`;
                                const depStatusLabel = dep.status ? capitalize(dep.status) : '';
                                return (
                                  <li key={key} className="dependencies-item">
                                    <span className="dependencies-title">{title}</span>
                                    {depStatusLabel && (
                                      <span className="dependencies-status">
                                        {depStatusLabel}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="view-section">
                      <h3 className="view-section-title">Team & Assignment</h3>
                      <div className="team-assignment">
                        <div className="team-assignment-main">
                          <span className="team-assignment-label">Assigned:</span>
                          {assignedUsers && assignedUsers.length > 0 ? (
                            <div className="team-assignment-pill-list">
                              {assignedUsers.map((u) => {
                                const meta = assignedUsersMeta.find(
                                  (m) => m?.user_id === u.id,
                                );
                                const deptLabel = meta?.department
                                  ? meta.department
                                      .split('_')
                                      .map((w) =>
                                        w ? w[0].toUpperCase() + w.slice(1) : '',
                                      )
                                      .join(' ')
                                  : '';
                                const nameLabel = getUserDisplayName(u);
                                const fullLabel = deptLabel
                                  ? `${nameLabel} - ${deptLabel}`
                                  : nameLabel;
                                const initials = (() => {
                                  const full = nameLabel || '';
                                  const parts = full.split(' ').filter(Boolean);
                                  if (parts.length === 0) return '';
                                  if (parts.length === 1) {
                                    return parts[0][0].toUpperCase();
                                  }
                                  return `${parts[0][0]}${
                                    parts[parts.length - 1][0]
                                  }`.toUpperCase();
                                })();
                                return (
                                  <div
                                    key={u.id}
                                    className="team-assignment-pill-row"
                                  >
                                    <div className="team-assignment-avatar">
                                      <span className="team-assignment-avatar-initial">
                                        {initials}
                                      </span>
                                    </div>
                                    <span className="team-assignment-pill">
                                      {fullLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="person-badge">-</span>
                          )}
                        </div>
                        <div className="team-assignment-meta">
                          <div className="collaboration-summary">
                            <span className="collaboration-count">
                              {collaborationUsers.length}
                            </span>
                            <span className="collaboration-label">
                              {collaborationUsers.length === 1
                                ? 'Person involved'
                                : 'People involved'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {hasApprovalPanel && (
                      <div
                        className={`view-section${
                          isApproverView ? ' view-section--approver-primary' : ''
                        }`}
                      >
                        <h3 className="view-section-title">Approval</h3>
                        <div className="view-grid">
                          <div className="view-item">
                            <span className="view-item-label">Approvers</span>
                            <span className="view-item-value">
                              <ul className="approval-list">
                                {approvalRows.map((row) => (
                                  <li key={row.id} className="approval-list-item">
                                    <span className="approval-list-name">
                                      {row.name}
                                    </span>
                                    <span
                                      className={`approval-status-badge approval-status-badge--${row.decision}`}
                                    >
                                      {row.decisionLabel}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {!isApproverView && reassignmentActivities.length > 0 && (
                      <div className="view-section">
                        <h3 className="view-section-title">Reassignment History</h3>
                        <div className="reassignment-list">
                          {reassignmentActivities.map((act, index) => {
                            const rawDetails = act.details;
                            let fromItems = [];
                            let toItems = [];

                            if (Array.isArray(rawDetails)) {
                              fromItems = rawDetails.filter((d) => d && d.type === 'from');
                              toItems = rawDetails.filter((d) => d && d.type === 'to');
                            } else if (rawDetails && typeof rawDetails === 'object') {
                              const fromIds = Array.isArray(rawDetails.from_assigned_user_ids)
                                ? rawDetails.from_assigned_user_ids
                                : [];
                              const fromMeta = Array.isArray(rawDetails.from_assigned_users_meta)
                                ? rawDetails.from_assigned_users_meta
                                : [];
                              const toIds = Array.isArray(rawDetails.to_assigned_user_ids)
                                ? rawDetails.to_assigned_user_ids
                                : [];
                              const toMeta = Array.isArray(rawDetails.to_assigned_users_meta)
                                ? rawDetails.to_assigned_users_meta
                                : [];

                              fromItems = fromIds.map((fromId) => {
                                const meta = fromMeta.find((m) => m && Number(m.user_id) === Number(fromId));
                                return {
                                  type: 'from',
                                  user_id: fromId,
                                  department: meta?.department || null,
                                };
                              });

                              toItems = toIds.map((toId) => {
                                const meta = toMeta.find((m) => m && Number(m.user_id) === Number(toId));
                                return {
                                  type: 'to',
                                  user_id: toId,
                                  department: meta?.department || null,
                                };
                              });
                            }

                            const formatDept = (dept) => {
                              if (!dept) return '';
                              return String(dept)
                                .split('_')
                                .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
                                .join(' ');
                            };

                            const fromLabel =
                              fromItems.length > 0
                                ? fromItems
                                    .map((i) => {
                                      const deptLabel = formatDept(i.department);
                                      const nameLabel = getUserNameFromId(i.user_id);
                                      return `${nameLabel}${deptLabel ? ` • ${deptLabel}` : ''}`;
                                    })
                                    .join(', ')
                                : '-';

                            const toLabel =
                              toItems.length > 0
                                ? toItems
                                    .map((i) => {
                                      const deptLabel = formatDept(i.department);
                                      const nameLabel = getUserNameFromId(i.user_id);
                                      return `${nameLabel}${deptLabel ? ` • ${deptLabel}` : ''}`;
                                    })
                                    .join(', ')
                                : '-';

                            const performer = act && act.performed_by ? act.performed_by : null;
                            const byLabel =
                              (performer &&
                                (performer.name ||
                                  performer.full_name ||
                                  performer.username ||
                                  performer.email)) ||
                              '-';

                            const when = act.created_at ? formatDateOnly(act.created_at) : '-';

                            return (
                              <div key={act.id || index} className="reassignment-row">
                                <div className="reassignment-timestamp">
                                  {when}
                                </div>
                                <div className="reassignment-details">
                                  <div className="reassignment-line">
                                    <span className="reassignment-label">From:</span>
                                    <span className="reassignment-value">{fromLabel}</span>
                                  </div>
                                  <div className="reassignment-line">
                                    <span className="reassignment-label">To:</span>
                                    <span className="reassignment-value">{toLabel}</span>
                                  </div>
                                  <div className="reassignment-line">
                                    <span className="reassignment-label">By:</span>
                                    <span className="reassignment-value">{byLabel}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="view-layout-side">
                    {!isApproverView && (
                      <TimeTracker taskId={task.id} taskStatus={task.status} />
                    )}

                    <div className="task-notes-panel">
                      <div
                        className={`view-section${
                          isApproverView ? ' view-section--approver-primary' : ''
                        }`}
                      >
                        <h3 className="view-section-title">
                          {isApproverView ? 'Attachments' : 'Attachments'}
                        </h3>
                        <div className="view-grid">
                          <div className="view-item task-attachments-item">
                            <ul className="attachments-list">
                              {(task.attachments || []).map((a) => {
                                const rawType = a.file_type || '';
                                const shortType = rawType.includes('/')
                                  ? rawType.split('/')[1]
                                  : rawType;
                                const shortUpper = shortType
                                  ? shortType.toUpperCase()
                                  : 'FILE';
                                return (
                                  <li key={a.id} className="attachments-item">
                                    <div className="attachment-main">
                                      <div className="attachment-header">
                                        <div className="attachment-icon">
                                          {shortUpper}
                                        </div>
                                        <div className="attachment-text">
                                          <div className="attachment-name">
                                            {a.file_name}
                                          </div>
                                          <div className="attachment-type">
                                            {rawType}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="attachment-actions">
                                        <a
                                          href={getAttachmentHref(a.file_url)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="attachment-open-button"
                                        >
                                          View
                                        </a>
                                        {canDeleteAttachment && (
                                          <button
                                            type="button"
                                            className="attachment-remove-button"
                                            onClick={() => handleRemoveAttachment(a.id)}
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                              {(!task.attachments || task.attachments.length === 0) && <li>No attachments</li>}
                            </ul>
                          </div>
                        </div>
                        {!isApproverView && (
                          <form onSubmit={addAttachment} className="task-attachments-form">
                            <div className="form-grid-3">
                              <div className="form-group">
                                <label className="form-label">File</label>
                                <input
                                  type="file"
                                  onChange={handleAttachmentChange}
                                  disabled={!canInteractWithNotes || savingAttachment}
                                />
                              </div>
                            </div>
                            <div className="form-actions">
                              <PrimaryButton
                                type="submit"
                                disabled={savingAttachment || !canInteractWithNotes}
                                loading={savingAttachment}
                                loadingText="Adding..."
                              >
                                Upload Attachment
                              </PrimaryButton>
                            </div>
                          </form>
                        )}
                      </div>

                      <div
                        className={`view-section task-comments-panel${
                          isApproverView ? ' view-section--approver-secondary' : ''
                        }`}
                      >
                        <h3 className="view-section-title">
                          {isApproverView ? 'Comments & Activity' : 'Comments & Activity'}
                        </h3>
                        <div className="view-grid">
                          <div className="view-item task-comments-item">
                            <ul className="comments-list">
                              {(task.comments || []).map((c) => {
                                const hasAuthor = !!c.author;
                                const authorName = hasAuthor ? getUserDisplayName(c.author) : 'System';
                                const initial = authorName && authorName !== 'System' ? authorName.charAt(0).toUpperCase() : 'S';
                                const commentTypeClass = hasAuthor ? 'comment-item--user' : 'comment-item--system';
                                return (
                                  <li key={c.id} className={`comment-item ${commentTypeClass}`}>
                                    <div className="comment-avatar">
                                      <span className="comment-avatar-initial">
                                        {initial}
                                      </span>
                                    </div>
                                    <div className="comment-body">
                                      <div className="comment-header">
                                        <span className="comment-author">
                                          {authorName}
                                        </span>
                                        <span className="comment-date">
                                          {formatDateOnly(c.created_at)}
                                        </span>
                                      </div>
                                      <div className="comment-content">
                                        {c.content}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                              {(!task.comments || task.comments.length === 0) && <li>No comments</li>}
                            </ul>
                          </div>
                        </div>
                        {!isApproverView && (
                          <form onSubmit={addComment} className="task-comments-form">
                            <FormTextarea
                              name="content"
                              label="Add Comment"
                              value={comment.content}
                              onChange={handleCommentChange}
                              required
                              disabled={!canInteractWithNotes}
                            />
                            <div className="form-actions">
                              <PrimaryButton
                                type="submit"
                                disabled={savingComment || !canInteractWithNotes}
                                loading={savingComment}
                                loadingText="Posting..."
                              >
                                Post Comment
                              </PrimaryButton>
                            </div>
                          </form>
                        )}
                      </div>

                      {!isApproverView && (relatedLoading || relatedTasks.length > 0) && (
                        <div className="view-section">
                          <h3 className="view-section-title">Related tasks</h3>
                          <div className="view-grid">
                            <div className="view-item">
                              {relatedLoading && (
                                <div className="status-message">
                                  Loading related tasks...
                                </div>
                              )}
                              {!relatedLoading && relatedTasks.length > 0 && (
                                <ul className="related-tasks-list">
                                  {relatedTasks.map((t) => (
                                    <li
                                      key={t.id}
                                      className="related-task-item"
                                      onClick={() =>
                                        navigate(`/admin/tasks/view/${t.id}`)
                                      }
                                    >
                                      <div className="related-task-main">
                                        <div className="related-task-title">
                                          {t.title}
                                        </div>
                                        <div className="related-task-meta">
                                          <span className="related-task-status">
                                            {getStatusBadge(t.status)}
                                          </span>
                                          <span className="related-task-dept">
                                            {capitalize(t.department)}
                                          </span>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {!relatedLoading && relatedTasks.length === 0 && (
                                <div className="status-message">
                                  No related tasks
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="receipt-footer">
                  <div>MTJ Foundation • Task Management System</div>
                  <div className="metadata">
                    <span>Task ID: {formatTaskId(task)}</span>
                    <span>Department: {capitalize(task.department)}</span>
                    <span>
                      Last updated:{' '}
                      {formatDate(task.updated_at || task.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <StatusUpdateModal
            isOpen={statusModalOpen}
            taskId={task.id}
            action={statusModalAction}
            onClose={() => {
              setStatusModalOpen(false);
              setStatusModalAction(null);
            }}
            onUpdated={(updated) => {
              if (
                statusModalAction === 'APPROVE' ||
                statusModalAction === 'REJECT'
              ) {
                setCurrentUserHasActedOnApproval(true);
              }
              handleStatusUpdated(updated);
              setStatusActionLoading(false);
            }}
          />

          <QuickActionModal
            isOpen={quickActionOpen}
            taskId={task.id}
            actionKey={quickActionKey}
            userDepartment={user?.department}
            onClose={() => {
              setQuickActionOpen(false);
              setQuickActionKey(null);
            }}
            onCompleted={(actionKey, updatedTask) => {
              if (updatedTask) {
                setTask(updatedTask);
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ViewTask;
