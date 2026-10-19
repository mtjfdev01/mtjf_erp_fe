import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import MentionCommentInput from './MentionCommentInput';
import TaskDueRemindersPanel from './TaskDueRemindersPanel';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import { splitDescriptionAndMov } from '../../../../utils/movEncoding';
import PrimaryButton from '../../../common/buttons/primary';
import TaskActionBar from './TaskActionBar';
import TimeTracker from './TimeTracker';
import ProgressUpdate from './ProgressUpdate';
import StatusUpdateModal from './StatusUpdateModal';
import QuickActionModal from './QuickActionModal';
import {
  STATUS_TRANSITION_MAP,
  QUICK_ACTION_LABEL_MAP,
  QUICK_ACTIONS,
  isQuickActionAvailable,
} from './taskStatusConfig';
import '../../../../styles/variables.css';
import './index.css';
import './TaskViewModal.css';
import { FaExclamationTriangle } from 'react-icons/fa';
import {
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiFlag,
  FiPaperclip,
  FiRepeat,
  FiUserPlus,
  FiX,
} from 'react-icons/fi';
import TaskActivityTimeline from './TaskActivityTimeline';
import './taskViewV2.css';

const QUICK_ACTION_ICON_MAP = {
  REASSIGN: FiUserPlus,
  CHANGE_DUE_DATE: FiCalendar,
  CHANGE_PRIORITY: FiFlag,
  MOVE_PROJECT: FiRepeat,
  GENERATE_REPORT: FiFileText,
};

// Stepper shown in the header. Only open / in_progress / completed can be set inline.
const STANDARD_STEP_DEFS = [
  { key: 'open', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'closed', label: 'Closed' },
];

const APPROVAL_STEP_DEFS = [
  { key: 'open', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending_approval', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'closed', label: 'Closed' },
];

const getStepIndex = (statusLowerVal, isApprovalWorkflow) => {
  switch (statusLowerVal) {
    case 'in_progress':
      return 1;
    case 'completed':
      return 2;
    case 'pending_approval':
      return isApprovalWorkflow ? 3 : 2;
    case 'approved':
      return isApprovalWorkflow ? 4 : 2;
    case 'rejected':
      return isApprovalWorkflow ? 3 : 2;
    case 'closed':
      return isApprovalWorkflow ? 5 : 3;
    default:
      return 0;
  }
};

const DESCRIPTION_LIMIT = 150;

const ViewTask = ({
  taskId: taskIdProp,
  isModal = false,
  onClose,
  onTaskUpdated,
  onOpenRelatedTask,
} = {}) => {
  const { id: routeId } = useParams();
  const id = taskIdProp ?? routeId;
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [task, setTask] = useState(null);

  const [assignedUsersMeta, setAssignedUsersMeta] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [usersFetchInProgress, setUsersFetchInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState({ file: null, name: '' });
  const [comment, setComment] = useState({ content: '', mentioned_user_ids: [] });
  const [commentFormKey, setCommentFormKey] = useState(0);
  const [savingAttachment, setSavingAttachment] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [approvalState, setApprovalState] = useState(null);
  const [approvalLoaded, setApprovalLoaded] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [showMovCompletionPrompt, setShowMovCompletionPrompt] = useState(false);
  const [commentsTab, setCommentsTab] = useState('comments');
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(null);
  // New view state (UI only)
  const [activeTab, setActiveTab] = useState('overview');
  const [dropActive, setDropActive] = useState(false);

  const getAttachmentHref = (urlStr) => {
    if (!urlStr) return '#';
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }
    const base = axiosInstance.defaults.baseURL || '';
    const normalizedBase = base.replace(/\/$/, '');
    return `${normalizedBase}${urlStr}`;
  };

  useEffect(() => {
    setShowFullDescription(false);
  }, [task?.id]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const t = res.data.data;
        if (!cancelled) {
          setTask(t);
          setAssignedUsersMeta(Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : []);
          // If it's not an approval workflow, immediately set approval loading to false
          const isApproval = String(t.workflow_type).toLowerCase() === 'approval_required';
          if (!isApproval) {
            setApprovalLoading(false);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'Failed to load task.');
          setApprovalLoading(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!task || String(task.task_type || '').toLowerCase() !== 'recurring') {
      return undefined;
    }

    let cancelled = false;
    const refreshRecurringTask = async () => {
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        if (!cancelled && res.data?.data) {
          const updatedTask = res.data.data;
          setTask(updatedTask);
          setAssignedUsersMeta(
            Array.isArray(updatedTask.assigned_users_meta)
              ? updatedTask.assigned_users_meta
              : [],
          );
        }
      } catch {
        // Keep the current view if a background refresh fails.
      }
    };
    const timer = window.setInterval(refreshRecurringTask, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, task?.id, task?.task_type]);

  // Optimized user resolution - CONDITIONAL API CALL
  // The /users/by-ids API is ONLY called when:
  // 1. Task has assigned users (assigned_user_ids)
  // 2. Approval data is loaded AND task has approvers
  // 3. Task has reassignment activities

  useEffect(() => {
    if (!task) return;

    const resolveUsers = async () => {
      // Collect all user IDs that need to be resolved
      const idsFromAssigned = Array.isArray(task.assigned_user_ids)
        ? task.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
        : [];
      const idsFromMeta = Array.isArray(task.assigned_users_meta)
        ? task.assigned_users_meta
          .map((m) => m?.user_id)
          .filter((n) => Number.isInteger(n) && n > 0)
        : [];

      const idsFromApprovers = Array.isArray(task.approval_required_user_ids)
        ? task.approval_required_user_ids
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n > 0)
        : [];

      const approvalsMetaRaw = Array.isArray(approvalState?.approvals_meta)
        ? approvalState.approvals_meta
        : [];
      const approvalMetaIds = approvalsMetaRaw
        .map((m) => (m && m.user_id ? Number(m.user_id) : null))
        .filter((n) => Number.isInteger(n) && n > 0);

      // Only include reassignment IDs if there are activities
      const reassignmentIds = [];
      if (Array.isArray(task.activities) && task.activities.length > 0) {
        task.activities.forEach((a) => {
          if (!a || a.action !== 'reassigned') return;
          const details = a.details;
          if (Array.isArray(details)) {
            details.forEach((d) => {
              if (!d || d.user_id == null) return;
              const num = Number(d.user_id);
              if (Number.isInteger(num) && num > 0) reassignmentIds.push(num);
            });
          } else if (details && typeof details === 'object') {
            const fromIds = Array.isArray(details.from_assigned_user_ids) ? details.from_assigned_user_ids : [];
            const toIds = Array.isArray(details.to_assigned_user_ids) ? details.to_assigned_user_ids : [];
            [...fromIds, ...toIds].forEach((idVal) => {
              const num = Number(idVal);
              if (Number.isInteger(num) && num > 0) reassignmentIds.push(num);
            });
          }
        });
      }

      const reportedIds = Array.isArray(task.reported_to_ids)
        ? task.reported_to_ids.map((idVal) => Number(idVal)).filter((n) => Number.isInteger(n) && n > 0)
        : Array.isArray(task.reported_to)
          ? task.reported_to.map((idVal) => Number(idVal)).filter((n) => Number.isInteger(n) && n > 0)
          : (task.reported_to_id ? [Number(task.reported_to_id)] : []);

      const allNeededIds = Array.from(
        new Set([
          ...idsFromAssigned,
          ...idsFromMeta,
          ...idsFromApprovers,
          ...approvalMetaIds,
          ...reassignmentIds,
          ...reportedIds,
        ]),
      ).filter((n) => n != null && Number.isInteger(n) && n > 0);

      // Always refresh user records so department changes are reflected immediately.
      if (allNeededIds.length > 0 && !usersFetchInProgress) {
        setUsersFetchInProgress(true);
        try {
          const query = allNeededIds.map((idVal) => `ids=${encodeURIComponent(idVal)}`).join('&');
          const res = await axiosInstance.get(`/users/by-ids?${query}`);
          const usersArray = Array.isArray(res.data) ? res.data : [];
          setUsersById(prev => {
            const next = { ...prev };
            usersArray.forEach(u => {
              if (u && u.id) next[Number(u.id)] = u;
            });
            return next;
          });
        } catch (err) {
          console.error('Failed to resolve users', err);
        } finally {
          setUsersFetchInProgress(false);
        }
      }
    };

    resolveUsers();
  }, [task?.id, approvalState]); // Only re-run when task ID changes or approval state is loaded

  // Lazy load approval data only when needed (with force option)
  const loadApprovalData = useCallback(async (force = false) => {
    if (!force && (approvalLoaded || approvalLoading)) return;

    setApprovalLoading(true);
    try {
      const approvalRes = await axiosInstance.get(`/tasks/${id}/approval`);
      setApprovalState(approvalRes.data?.data || null);
      setApprovalLoaded(true);
    } catch {
      setApprovalState(null);
      setApprovalLoaded(true);
    } finally {
      setApprovalLoading(false);
    }
  }, [id, approvalLoading]);

  const assignedUsers = useMemo(() => {
    if (!task || !Array.isArray(task.assigned_user_ids)) return [];
    return task.assigned_user_ids
      .map(id => usersById[Number(id)])
      .filter(Boolean);
  }, [task?.assigned_user_ids, usersById]);

  const capitalize = (s) => {
    if (!s) return '';
    return String(s).split('_').map(w => w[0] ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  };
  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

  const parseAsLocal = (dateInput) => {
    if (!dateInput) return new Date(NaN);
    if (dateInput instanceof Date) return new Date(dateInput);

    // If it's a date string from backend (YYYY-MM-DD), parse as local midnight
    if (typeof dateInput === 'string' && dateInput.includes('-') && !dateInput.includes('T') && !dateInput.includes(':')) {
      const [year, month, day] = dateInput.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateInput);
  };

  const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    // Use string parsing to avoid timezone shift for "YYYY-MM-DD" dates
    const d = parseAsLocal(date);
    if (Number.isNaN(d.getTime())) return 'N/A';

    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // "5 Oct, 1:00 AM"
  const formatDayTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day} ${month}, ${time}`;
  };

  const getInitials = (nameLabel) => {
    const parts = String(nameLabel || '').split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const formatTaskId = (t) => {
    if (!t) return '-';
    if (t.code) return `#${t.code}`;
    const rawId = t.id != null ? String(t.id) : '';
    if (!rawId) return '-';
    const padded = rawId.padStart(4, '0');
    return `#ID-${padded}`;
  };

  const formatTimeShort = (totalSeconds) => {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const getDueInfo = (rawDate, statusRaw) => {
    if (!rawDate) return null;
    const dueObj = parseAsLocal(rawDate);
    if (Number.isNaN(dueObj.getTime())) return null;
    const now = new Date();
    const sLower = String(statusRaw || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(sLower)) return null;

    // A task becomes overdue ONLY after 12:00 PM (noon) on the due date.
    const dueNoon = new Date(dueObj);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(dueObj);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    if (now > dueNoon) {
      const diffMs = startOfNowDay.getTime() - startOfDueDay.getTime();
      const overdueDays = Math.round(diffMs / 86400000);

      if (overdueDays === 0) {
        return { label: 'Overdue today', variant: 'warning' };
      }
      return { label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`, variant: 'danger' };
    } else {
      const diffMs = startOfDueDay.getTime() - startOfNowDay.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      if (diffDays === 0) {
        return { label: 'Due today', variant: 'warning' };
      }
      return { label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, variant: 'normal' };
    }
  };

  const taskRouteBase = useMemo(() => tasksBasePath(), []);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const handleBack = useCallback(() => {
    if (isModal && onClose) {
      onClose();
      return;
    }
    navigate(-1);
  }, [navigate, isModal, onClose]);
  const getUserDisplayName = (u) => {
    if (!u) return '-';
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (full) return full;
    if (u.email) return u.email;
    if (u.id) return `User #${u.id}`;
    return '-';
  };
  const getUserNameFromId = (idVal) => {
    const num = Number(idVal);
    if (!Number.isFinite(num) || num <= 0) return '-';
    const userObj = usersById[num];
    if (userObj) return getUserDisplayName(userObj);
    return `User #${num}`;
  };
  const getStatusBadge = (sVal) => {
    const statusStr = String(sVal || '').toLowerCase();
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
    const cls = statusClassMap[statusStr] || 'status-registered';
    const normalized = statusStr ? statusStr.replace(/_/g, ' ') : 'pending';
    const label = normalized.toUpperCase();
    return <span className={`task-view-status-badge ${cls}`}>{label}</span>;
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
  const taskTypeValueFinal = taskTypeValueFromBackend || inferredTaskTypeValue;
  const isRecurringTask = taskTypeValueFinal === 'recurring';
  const taskTypeShortLabel =
    taskTypeValueFinal === 'recurring'
      ? 'Recurring'
      : taskTypeValueFinal === 'project_linked'
        ? 'Project-linked'
        : 'One-time';

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

  // Auto-load approval data whenever task is loaded and workflow is approval_required
  useEffect(() => {
    if (task) {
      const isApproval = String(task.workflow_type).toLowerCase() === 'approval_required';
      if (isApproval) {
        loadApprovalData(true);
      } else {
        setApprovalLoading(false);
      }
    }
  }, [task?.id]);

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
  const [quickActionsDropdownOpen, setQuickActionsDropdownOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [quickActionKey, setQuickActionKey] = useState(null);
  const [currentUserHasActedOnApproval, setCurrentUserHasActedOnApproval] =
    useState(false);

  const isTaskOverdueAfterToday = () => {
    if (!task || !task.due_date) return false;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return false;
    const now = new Date();
    const statusVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(statusVal)) return false;

    // Red banner should only appear AFTER the due date (next day onwards)
    const startOfNextDay = new Date(dueVal);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    startOfNextDay.setHours(0, 0, 0, 0);

    return now.getTime() >= startOfNextDay.getTime();
  };

  const isTaskOverdueToday = () => {
    if (!task || !task.due_date) return false;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return false;
    const now = new Date();
    const statusVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(statusVal)) return false;

    // Amber warning if it's past 12 PM on the due date today.
    const dueNoon = new Date(dueVal);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(dueVal);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    return (
      startOfDueDay.getTime() === startOfNowDay.getTime() &&
      now.getTime() > dueNoon.getTime()
    );
  };

  const isTaskDueTodayBeforeNoon = () => {
    if (!task || !task.due_date) return false;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return false;
    const now = new Date();
    const statusVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(statusVal)) return false;

    const dueNoon = new Date(dueVal);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(dueVal);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    return (
      startOfDueDay.getTime() === startOfNowDay.getTime() &&
      now.getTime() <= dueNoon.getTime()
    );
  };

  const getOverdueDays = () => {
    if (!task?.due_date) return 0;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return 0;
    const startOfDueDay = new Date(dueVal);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date();
    startOfNowDay.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((startOfNowDay.getTime() - startOfDueDay.getTime()) / 86400000));
  };

  // Escalation activity (if the backend logged one) — used for the header card and the feed.
  const escalationActivity = useMemo(() => {
    if (!task || !Array.isArray(task.activities)) return null;
    const matches = task.activities.filter((a) => {
      const action = String(a?.action || '').toLowerCase();
      return action.includes('escalat') || action.includes('overdue');
    });
    if (matches.length === 0) return null;
    return matches.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    )[0];
  }, [task?.activities]);

  const canApprove = taskPerms.canApprove === true;

  const renderRecurrenceInfo = () => {
    if (task?.task_type !== 'recurring' || !task?.recurrence_rule) return null;

    const info = task.recurrence_info;
    if (!info) return null;

    const { upcomingDates, lastDate, remainingCount } = info;
    const rule = task.recurrence_rule;

    return (
      <div className="recurrence-card-container">
        <div className="recurrence-card">
          <div className="recurrence-card-body">
            <div className="recurrence-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </div>
            <div className="recurrence-content">
              <div className="recurrence-main-info">
                <h4 className="recurrence-title-text">
                  Recurring Task <span className="recurrence-dot-separator"></span><strong>{rule}</strong>
                </h4>
                <div className="recurrence-status-row">
                  {task.recurrence_end_type === 'on_date' && (
                    <span className="recurrence-end-info">
                      Ends on <strong>{formatDateOnly(lastDate)}</strong>
                    </span>
                  )}
                  {task.recurrence_end_type === 'after_occurrences' && (
                    <span className="recurrence-end-info">
                      Ends after <strong>{task.recurrence_end_occurrences}</strong> total occurrences
                    </span>
                  )}
                  {task.recurrence_end_type === 'never' && (
                    <span className="recurrence-end-info">
                      Repeats Indefinitely
                    </span>
                  )}
                  {remainingCount !== null && (
                    <span className="recurrence-count-badge">
                      {remainingCount} Remaining
                    </span>
                  )}
                </div>
              </div>

              {upcomingDates && upcomingDates.length > 0 && (
                <div className="recurrence-upcoming">
                  <span className="upcoming-title">Upcoming Dates</span>
                  <div className="upcoming-pills">
                    {upcomingDates.map((d, i) => (
                      <span key={i} className="upcoming-pill">
                        {formatDateOnly(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const canCreate = taskPerms.canCreate === true;
  const canUpdate = taskPerms.canUpdate === true;

  const isCurrentUserAssignee = useMemo(() => {
    if (!user || !task) return false;
    const assignedIds = Array.isArray(task.assigned_user_ids)
      ? task.assigned_user_ids
      : [];
    const metaIds = Array.isArray(task.assigned_users_meta)
      ? task.assigned_users_meta.map((m) => Number(m?.user_id)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const allIds = [...assignedIds, ...metaIds].map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
    return allIds.includes(Number(user.id));
  }, [user, task]);

  const canEditTaskByCurrentUser =
    canUpdate && !(isCurrentUserAssignee && Number(task?.created_by_id) !== Number(user?.id));
  const canView = taskPerms.canView === true;
  const canInteractWithNotes = canUpdate || canCreate || canView;
  const hasAttachmentDeletePermission = canUpdate || canCreate;

  const primaryAssigneeName =
    assignedUsers && assignedUsers.length > 0
      ? getUserDisplayName(assignedUsers[0])
      : '';

  const reminderAssigneeName = useMemo(() => {
    if (!assignedUsers || assignedUsers.length === 0) return '';
    if (assignedUsers.length === 1) {
      return getUserDisplayName(assignedUsers[0]);
    }
    if (isCurrentUserAssignee) {
      const currentAssignee = assignedUsers.find(
        (u) => u && Number(u.id) === Number(user?.id),
      );
      return getUserDisplayName(currentAssignee || assignedUsers[0]);
    }
    return getUserDisplayName(assignedUsers[0]);
  }, [assignedUsers, isCurrentUserAssignee, user?.id]);

  const isCurrentUserCreator = useMemo(() => {
    if (!user || !task) return false;
    return Number(task.created_by_id) === Number(user.id);
  }, [user, task]);

  const canDeleteAttachment = (attachment) => {
    if (!hasAttachmentDeletePermission) return false;
    const taskCreatorId = Number(task?.created_by_id);
    const uploadedById = Number(
      attachment?.uploaded_by?.id ?? attachment?.uploaded_by_id ?? attachment?.uploaded_by,
    );
    return !(
      isCurrentUserAssignee &&
      !isCurrentUserCreator &&
      uploadedById === taskCreatorId
    );
  };

  const assignmentUsersForDisplay = assignedUsers || [];

  const reportingManagersForDisplay = useMemo(() => {
    if (!task) return [];
    if (Array.isArray(task.reported_to_users) && task.reported_to_users.length > 0) {
      return task.reported_to_users;
    }
    const reporterIds = Array.isArray(task.reported_to_ids) && task.reported_to_ids.length > 0
      ? task.reported_to_ids
      : Array.isArray(task.reported_to) && task.reported_to.length > 0
        ? task.reported_to
        : task.reported_to_id
          ? [task.reported_to_id]
          : [];

    if (reporterIds.length > 0) {
      return reporterIds.map((idVal) => {
        const id = Number(idVal);
        return (
          usersById[id] || {
            id,
            first_name: `User #${id}`,
            department: '',
          }
        );
      });
    }
    if (task.reported_to && typeof task.reported_to === 'object') {
      return [task.reported_to];
    }
    return [];
  }, [task, usersById]);

  const canEditMovChecklist = useMemo(() => {
    if (!task || !user) return false;

    // Check if task is in a terminal or approval state where MOV cannot be edited
    // MOV editing is blocked when task is:
    // - Completed/Closed/Cancelled/Rejected (terminal states)
    // - Pending Approval/Approved (approval workflow states, should be read-only)
    const sVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled', 'rejected', 'pending_approval', 'approved'].includes(sVal)) return false;

    const isTaskCreator = Number(task.created_by_id) === Number(user?.id);

    // Check if user is assignee
    const isAssignee =
      Array.isArray(task.assigned_user_ids) &&
      task.assigned_user_ids.some(id => Number(id) === Number(user?.id));
    const isSuperAdmin = String(user?.role || '').toLowerCase() === 'super_admin';
    const canInteract = taskPerms?.canView === true || isSuperAdmin;

    // Creators can see all MOVs, but can interact only when also assigned.
    if (isTaskCreator) return isAssignee && canInteract;

    // Other users can interact only with their assigned MOVs.
    return isAssignee && canInteract;
  }, [task, user, taskPerms]);

  const canChangeStatusInline = useMemo(() => {
    if (!task || !user || !isCurrentUserAssignee) return false;
    const sVal = String(task.status || '').toLowerCase();
    return !['pending_approval', 'completed', 'closed', 'cancelled'].includes(sVal);
  }, [task, user, isCurrentUserAssignee]);

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
        onTaskUpdated?.(updatedTask);
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
    // Pre-fill the required name with the file name so uploading is one click.
    setAttachment((prev) => ({
      ...prev,
      file: file || null,
      name: prev.name || (file ? file.name : ''),
    }));
  };

  const handleAttachmentDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
    if (!canInteractWithNotes || savingAttachment) return;
    const file = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (!file) return;
    setAttachment((prev) => ({ ...prev, file, name: prev.name || file.name }));
  };

  const handleAttachmentNameChange = (e) => {
    setAttachment((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setComment((prev) => ({ ...prev, [name]: value }));
  };

  const handleMentionedUsersChange = (mentionedUserIds) => {
    setComment((prev) => ({ ...prev, mentioned_user_ids: mentionedUserIds }));
  };

  const addAttachment = async (e) => {
    e.preventDefault();
    setSavingAttachment(true);
    setError('');
    try {
      const trimmedName = String(attachment.name || '').trim();
      if (!trimmedName) {
        setSavingAttachment(false);
        setError('Attachment name is required.');
        toast.error('Attachment name is required.');
        return;
      }
      if (!attachment.file) {
        setSavingAttachment(false);
        setError('Please select a file to upload.');
        toast.error('Please select a file to upload.');
        return;
      }
      const formData = new FormData();
      formData.append('file', attachment.file);
      formData.append('description', trimmedName);
      formData.append('name', trimmedName);
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
      setAttachment({ file: null, name: '' });
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
      const res = await axiosInstance.post(`/tasks/${id}/comments`, {
        content: comment.content,
        mentioned_user_ids: comment.mentioned_user_ids || [],
      });
      setTask((prev) => ({ ...prev, comments: [...(prev.comments || []), res.data.data] }));
      setComment({ content: '', mentioned_user_ids: [] });
      setCommentFormKey((k) => k + 1);
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
    let latestTask = updated && Array.isArray(updated.activities) ? updated : null;
    if (latestTask) {
      setTask(latestTask);
    } else {
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const fullTask = res.data?.data;
        if (fullTask) {
          setTask(fullTask);
          latestTask = fullTask;
        }
      } catch (e) {
        console.error('Failed to re-fetch task after status update', e);
        if (updated) {
          setTask(updated);
          latestTask = updated;
        } else {
          const action = statusModalAction;
          const nextStatus = STATUS_TRANSITION_MAP[action];
          if (nextStatus) {
            setTask((prev) => {
              const next = { ...prev, status: nextStatus };
              latestTask = next;
              return next;
            });
          }
        }
      }
    }
    if (statusModalAction === 'APPROVE' || statusModalAction === 'REJECT' || statusModalAction === 'SUBMIT_APPROVAL') {
      if (statusModalAction === 'APPROVE' || statusModalAction === 'REJECT') {
        setCurrentUserHasActedOnApproval(true);
      }
      setApprovalLoaded(false);
      await loadApprovalData(true);
    }
    if (onTaskUpdated && latestTask) {
      onTaskUpdated(latestTask);
    }
  };

  const handleQuickAction = (key) => {
    setQuickActionsDropdownOpen(false);
    setQuickActionKey(key);
    setQuickActionOpen(true);
  };

  const handleRemoveAttachment = async (attachmentId) => {
    const targetAttachment = (task?.attachments || []).find(
      (item) => Number(item.id) === Number(attachmentId),
    );
    if (!canDeleteAttachment(targetAttachment)) return;
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

  const allAttachments = useMemo(() => task?.attachments || [], [task?.attachments]);

  const initialAttachments = useMemo(() => {
    return allAttachments.filter((a) => a.is_initial === true);
  }, [allAttachments]);

  const activityAttachments = useMemo(() => {
    return allAttachments.filter((a) => a.is_initial !== true);
  }, [allAttachments]);

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

  const availableQuickActions = useMemo(() => {
    if (!task || approvalLoading) return [];

    const availabilityContext = {
      permissions: taskPerms,
      userDepartment: user?.department,
      taskDepartment: task?.department,
      userRole: user?.role,
      isAssignee: isCurrentUserAssignee,
      workflowType: String(task?.workflow_type || '').toUpperCase(),
      currentStatus: String(task?.status || '').toLowerCase(),
      currentUserId: user?.id,
      createdByUserId: task?.created_by_id,
      reportedById: task?.reported_to_id,
      reportedByIds: task?.reported_to_ids || task?.reported_to,
      approvalRequiredUserIds: task?.approval_required_user_ids,
      approvalsMeta: approvalState?.approvals_meta,
      currentUserHasActedOnApproval,
    };

    return QUICK_ACTIONS.filter((q) =>
      isQuickActionAvailable(q.key, availabilityContext),
    ).map((q) => q.key);
  }, [
    task,
    approvalLoading,
    taskPerms,
    user?.department,
    user?.role,
    user?.id,
    isCurrentUserAssignee,
    approvalState?.approvals_meta,
    currentUserHasActedOnApproval,
  ]);

  const dueInfo = getDueInfo(task?.due_date, task?.status);

  const reassignmentActivities = useMemo(() => {
    if (!task || !Array.isArray(task.activities)) return [];
    return [...task.activities]
      .filter((a) => a && a.action === 'reassigned')
      .sort((a, b) => {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ad - bd;
      });
  }, [task?.activities]);

  const progressActivities = useMemo(() => {
    if (!task || !Array.isArray(task.activities)) return [];

    const currentTaskProgress = Number(task.progress) || 0;

    // 1. Filter and identify progress-related activities
    const progressRelated = task.activities.filter((a) => {
      if (!a) return false;
      const actionStr = String(a.action || '').toLowerCase();
      const detailObj = a.details && typeof a.details === 'object' ? a.details : {};

      const isProgressAction =
        actionStr === 'progress_updated' ||
        actionStr === 'progress_update' ||
        actionStr === 'update_progress' ||
        actionStr.includes('progress');

      const hasProgressValue = detailObj && detailObj.progress != null;
      const notesMatch = typeof detailObj.notes === 'string' &&
        detailObj.notes.toLowerCase().includes('checklist items completed');

      return isProgressAction || hasProgressValue || notesMatch;
    });

    // 2. Apply business rules:
    const uniqueProgressMap = new Map();
    const resets = [];

    progressRelated.forEach((a) => {
      const detailObj = a.details || {};
      const progValue = Number(detailObj.progress);
      const isReset = String(detailObj.notes || '').toLowerCase().includes('reset');

      if (isReset) {
        resets.push(a);
        return;
      }

      // Rule: Hide entries higher than current progress
      if (progValue > currentTaskProgress) return;

      // Rule: Keep only the latest entry for this progress level
      const existing = uniqueProgressMap.get(progValue);
      if (!existing || (Number(a.id) > Number(existing.id))) {
        uniqueProgressMap.set(progValue, a);
      }
    });

    const listToReturn = [...Array.from(uniqueProgressMap.values()), ...resets];

    // 3. Sort by ID descending (latest first)
    return listToReturn.sort((a, b) => {
      const aid = Number(a.id) || 0;
      const bid = Number(b.id) || 0;
      return bid - aid;
    });
  }, [task?.activities, task?.progress]);

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

  useEffect(() => {
    if (!task?.id) {
      setTotalTimeSeconds(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/tasks/${task.id}/work-history`);
        if (!cancelled) {
          setTotalTimeSeconds(Number(res.data?.data?.total_seconds) || 0);
        }
      } catch {
        if (!cancelled) setTotalTimeSeconds(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task?.id]);

  const primaryAssigneeChip = useMemo(() => {
    if (!assignedUsers?.length) return null;
    const u = assignedUsers[0];
    const meta = assignedUsersMeta.find((m) => m?.user_id === u.id);
    const deptLabel = meta?.department
      ? meta.department
          .split('_')
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
          .join(' ')
      : '';
    const nameLabel = getUserDisplayName(u);
    const parts = nameLabel.split(' ').filter(Boolean);
    const initials =
      parts.length === 0
        ? '?'
        : parts.length === 1
          ? parts[0][0].toUpperCase()
          : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return {
      label: deptLabel ? `${nameLabel} — ${deptLabel}` : nameLabel,
      initials,
    };
  }, [assignedUsers, assignedUsersMeta]);

  // Merged feed for the Activity section: comments + "created" + "overdue escalated"
  const feedItems = useMemo(() => {
    if (!task) return [];
    const items = [];

    (task.comments || []).forEach((c) => {
      const hasAuthor = !!c.author;
      items.push({
        key: `comment-${c.id}`,
        kind: hasAuthor ? 'comment' : 'system',
        date: c.created_at,
        author: hasAuthor ? getUserDisplayName(c.author) : 'System',
        text: c.content,
      });
    });

    if (isTaskOverdueAfterToday()) {
      const detailsObj =
        escalationActivity?.details && typeof escalationActivity.details === 'object'
          ? escalationActivity.details
          : {};
      const sub =
        (typeof detailsObj.notes === 'string' && detailsObj.notes) ||
        (typeof detailsObj.message === 'string' && detailsObj.message) ||
        '';
      items.push({
        key: 'overdue',
        kind: 'overdue',
        date: escalationActivity?.created_at || task.due_date,
        title: escalationActivity ? 'Overdue escalated' : 'Marked overdue',
        sub,
      });
    }

    items.push({
      key: 'created',
      kind: 'created',
      date: task.created_at,
      author: getUserDisplayName(task.created_by),
      assignees: (assignedUsers || []).map((u) => getUserDisplayName(u)).join(', '),
    });

    return items.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  }, [task, assignedUsers, escalationActivity]);

  const backDeptForLoading = user?.department || (task && task.department);

  if (!task && !loading) {
    const notFoundContent = (
      <div className={isModal ? 'task-view-wrapper' : 'view-wrapper task-view-wrapper'}>
        {isModal ? (
          <div className="task-view-modal-header">
            <h2 className="task-view-modal-header-title">View Task</h2>
            <button type="button" className="task-view-modal-close" onClick={handleBack} aria-label="Close">
              ×
            </button>
          </div>
        ) : (
          <PageHeader
            title="View Task"
            showBackButton={true}
            onBackClick={handleBack}
          />
        )}
        <div className="view-content">
          <div className="status-message status-message--error">{error || 'Task not found'}</div>
        </div>
      </div>
    );
    return (
      <>
        {!isModal && <Navbar />}
        {notFoundContent}
      </>
    );
  }

  if (loading && !task) {
    return <Loader loading={loading} />;
  }

  const { baseDescription, movItems: movFromDescription } = splitDescriptionAndMov(
    task?.description || '',
  );
  const rawDescription = String(baseDescription || '').trim();
  const movLinesFromField = Array.isArray(task?.mov_items)
    ? task.mov_items
      .map((t) => String(t || '').trim())
      .filter((t) => t.length > 0)
    : [];
  const movLines =
    movLinesFromField.length > 0
      ? movLinesFromField
      : movFromDescription && movFromDescription.length > 0
        ? movFromDescription
        : [];
  const movChecklistLines = movLines.map((text, index) => {
    const movIndex = Array.isArray(task?.mov_item_indices)
      ? task.mov_item_indices[index]
      : index;
    return {
    text,
    mov_index: movIndex,
    assigned_user_id:
      Array.isArray(task?.mov_assignments)
        ? task.mov_assignments.find((item) => Number(item.mov_index) === Number(movIndex))?.user_id ?? null
        : null,
    };
  });
  const hasMovItems = movLines.length > 0 || Number(task?.mov_item_count) > 0;
  const shouldTruncateDescription = rawDescription.length > DESCRIPTION_LIMIT;

  // ---- Derived values for the new layout ----
  const stepDefinitions = isApprovalWorkflow ? APPROVAL_STEP_DEFS : STANDARD_STEP_DEFS;
  const stepIdx = getStepIndex(statusLower, isApprovalWorkflow);
  const showExtraStatusChip = ['pending_approval', 'approved', 'rejected', 'cancelled'].includes(statusLower);
  const showStartWork = canChangeStatusInline && stepIdx === 0;
  const canRequestNewDate = availableQuickActions.includes('CHANGE_DUE_DATE');
  const moreQuickActions = availableQuickActions.filter((k) => k !== 'CHANGE_DUE_DATE');

  const overdueAfterToday = isTaskOverdueAfterToday();
  const overdueToday = isTaskOverdueToday();
  const dueTodayBeforeNoon = isTaskDueTodayBeforeNoon();
  const overdueDays = getOverdueDays();
  const reminderHint = isCurrentUserAssignee
    ? 'Please review and complete it as soon as possible.'
    : 'Please follow up with the assignee.';

  const movTotal = movChecklistLines.length;
  const movDone = Math.min(
    movTotal,
    Math.round(((Number(task.progress) || 0) / 100) * movTotal),
  );

  const attachmentCount = allAttachments.length;
  const activityCount = (task.activities || []).length + (task.comments || []).length;
  const myDisplayName = getUserDisplayName(user);

  const showChecklist = activeTab === 'overview' || activeTab === 'checklist';
  const showFiles = activeTab === 'overview' || activeTab === 'files';
  const showActivity = activeTab === 'overview' || activeTab === 'activity';
  const showExtras = activeTab === 'overview';

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'checklist', label: `Checklist ${movDone}/${movTotal}` },
    { key: 'files', label: `Files ${attachmentCount}` },
    { key: 'activity', label: `Activity ${activityCount}` },
  ];

  const renderFileRow = (a, isInitial) => {
    const rawType = a.file_type || '';
    const shortType = rawType.includes('/') ? rawType.split('/')[1] : rawType;
    const shortUpper = shortType ? shortType.toUpperCase().slice(0, 4) : 'FILE';
    const displayName = a.description || a.file_name;
    return (
      <li key={a.id} className="tv2-file">
        <div className="tv2-file-main">
          <div className="tv2-file-icon">{shortUpper}</div>
          <div className="tv2-file-text">
            <div className="tv2-file-name">{displayName}</div>
            <div className="tv2-file-meta">
              {isInitial ? 'Initial attachment' : 'Activity attachment'}
              {a.description && a.file_name && a.description !== a.file_name
                ? ` · ${a.file_name}`
                : ''}
            </div>
          </div>
        </div>
        <div className="tv2-file-actions">
          <a
            href={getAttachmentHref(a.file_url)}
            target="_blank"
            rel="noreferrer"
            className="tv2-file-view"
          >
            View
          </a>
          {canDeleteAttachment(a) && (
            <button
              type="button"
              className="tv2-file-remove"
              onClick={() => handleRemoveAttachment(a.id)}
              aria-label="Remove attachment"
            >
              ×
            </button>
          )}
        </div>
      </li>
    );
  };

  const formatDept = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  return (
    <>
      {!isModal && <Navbar />}
      <Loader loading={loading} />
      <div className={isModal ? 'task-view-wrapper' : 'view-wrapper task-view-wrapper'}>
        {!loading && task && (
          <div className="view-content2">
            {error && <div className="status-message status-message--error">{error}</div>}

            <div className="tv2">
              {/* ============================== HEADER ============================== */}
              <header className="tv2-header">
                <div className="tv2-crumb">
                  <button type="button" onClick={handleBack}>
                    <FiArrowLeft aria-hidden="true" /> Back
                  </button>
                  <strong>{formatTaskId(task).replace(/^#/, '')}</strong>
                </div>

                <div className="tv2-header-main">
                  <div className="tv2-header-title">
                    <h1 className="tv2-title">{task.title || 'Task Title'}</h1>
                    <div className="tv2-chips">
                      <span className={`tv2-chip tv2-chip--priority-${String(task.priority || 'medium').toLowerCase()}`}>
                        {capitalize(task.priority || 'medium')} priority
                      </span>
                      {task.department && (
                        <span className="tv2-chip">{capitalize(task.department)} Department</span>
                      )}
                      <span className="tv2-chip">{taskTypeShortLabel}</span>
                      <span className="tv2-chip">
                        {capitalize(task.workflow_type || 'standard')} workflow
                      </span>
                    </div>
                  </div>

                  {overdueAfterToday ? (
                    <div className="tv2-alert" role="status">
                      <div className="tv2-alert-big">{overdueDays}</div>
                      <div className="tv2-alert-text">
                        <span className="tv2-alert-label">
                          {overdueDays === 1 ? 'day overdue' : 'days overdue'}
                        </span>
                        <span className="tv2-alert-sub">
                          Due {formatDateOnly(task.due_date)}
                          {escalationActivity?.created_at
                            ? ` · escalated ${new Date(escalationActivity.created_at).getDate()} ${new Date(escalationActivity.created_at).toLocaleString('en-GB', { month: 'short' })}`
                            : ''}
                        </span>
                      </div>
                    </div>
                  ) : overdueToday ? (
                    <div className="tv2-alert tv2-alert--warning" role="status">
                      <div className="tv2-alert-big"><FaExclamationTriangle aria-hidden="true" /></div>
                      <div className="tv2-alert-text">
                        <span className="tv2-alert-label">Overdue today</span>
                        <span className="tv2-alert-sub">
                          This task became overdue at 12:00 PM. {reminderHint}
                        </span>
                      </div>
                    </div>
                  ) : dueTodayBeforeNoon ? (
                    <div className="tv2-alert tv2-alert--warning" role="status">
                      <div className="tv2-alert-big"><FaExclamationTriangle aria-hidden="true" /></div>
                      <div className="tv2-alert-text">
                        <span className="tv2-alert-label">Due today</span>
                        <span className="tv2-alert-sub">{reminderHint}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="tv2-header-bar">
                  <ol className="tv2-stepper" aria-label="Task status">
                    {stepDefinitions.map((step, idx) => {
                      const isActive = idx === stepIdx;
                      const isDone = idx < stepIdx;
                      const clickable =
                        canChangeStatusInline &&
                        !isActive &&
                        inlineStatusOptions.some((o) => o.value === step.key);
                      return (
                        <li
                          key={step.key}
                          className={`tv2-step${isActive ? ' tv2-step--active' : ''}${isDone ? ' tv2-step--done' : ''}`}
                        >
                          <button
                            type="button"
                            className="tv2-step-btn"
                            data-clickable={clickable ? 'true' : 'false'}
                            disabled={!clickable || statusActionLoading}
                            aria-current={isActive ? 'step' : undefined}
                            onClick={() => clickable && handleInlineStatusChange(step.key)}
                          >
                            <span className="tv2-step-num">{idx + 1}</span>
                            {step.label}
                          </button>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="tv2-actions">
                    {/* {canRequestNewDate && (
                      <button
                        type="button"
                        className="tv2-btn tv2-btn--ghost"
                        onClick={() => handleQuickAction('CHANGE_DUE_DATE')}
                      >
                        Request new date
                      </button>
                    )} */}
                    {showStartWork && (
                      <button
                        type="button"
                        className="tv2-btn tv2-btn--light"
                        disabled={statusActionLoading}
                        onClick={() => handleInlineStatusChange('in_progress')}
                      >
                        <span aria-hidden="true">▸</span> Start work
                      </button>
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
                      createdByUserId={task.created_by_id}
                      reportedById={task.reported_to_id}
                      reportedByIds={task.reported_to_ids || task.reported_to}
                      approvalRequiredUserIds={task.approval_required_user_ids}
                      approvalsMeta={approvalState?.approvals_meta}
                      currentUserHasActedOnApproval={currentUserHasActedOnApproval}
                      approvalLoading={approvalLoading}
                      onStatusAction={handleStatusActionClick}
                      onQuickAction={handleQuickAction}
                      disabled={statusActionLoading}
                      align="top"
                    />
                    {isModal && (
                      <button type="button" className="tv2-icon-btn" onClick={handleBack} aria-label="Close">
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* ================================ TABS ================================ */}
              <nav className="tv2-tabs" role="tablist" aria-label="Task sections">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.key}
                    className={`tv2-tab${activeTab === t.key ? ' tv2-tab--active' : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              {/* ================================ BODY ================================ */}
              <div className="tv2-body">
                <div className="tv2-main">
                  {/* ---- Brief ---- */}
                  {activeTab === 'overview' && (
                    <section>
                      <span className="tv2-label">Brief</span>
                      <p className="tv2-brief">
                        {rawDescription ? (
                          shouldTruncateDescription && !showFullDescription ? (
                            <>
                              {rawDescription.slice(0, DESCRIPTION_LIMIT).trimEnd()}…{' '}
                              <button
                                type="button"
                                className="tv2-link-btn"
                                onClick={() => setShowFullDescription(true)}
                              >
                                Show more
                              </button>
                            </>
                          ) : (
                            <>
                              {rawDescription}
                              {shouldTruncateDescription && (
                                <>
                                  {' '}
                                  <button
                                    type="button"
                                    className="tv2-link-btn"
                                    onClick={() => setShowFullDescription(false)}
                                  >
                                    Show less
                                  </button>
                                </>
                              )}
                            </>
                          )
                        ) : (
                          '—'
                        )}
                      </p>
                    </section>
                  )}

                  {/* ---- Done when (existing ProgressUpdate / MOV checklist) ---- */}
                  {showChecklist && (
                    <section className="tv2-done">
                      <div className="tv2-done-head">
                        <h3 className="tv2-done-title">
                          {isApproverView ? 'Progress & verification' : 'Done when…'}
                        </h3>
                        <span className="tv2-done-count">
                          {movDone} / {movTotal}
                        </span>
                      </div>
                      {movChecklistLines.length > 0 ? (
                        <ProgressUpdate
                          taskId={task.id}
                          currentProgress={task.progress || 0}
                          lastProgressNotes={task.last_progress_notes}
                          movLines={movChecklistLines}
                          assignedUsers={assignedUsers}
                          isTaskCreator={isCurrentUserCreator}
                          canEdit={canEditMovChecklist}
                          currentUser={user}
                          progressActivities={task.activities || []}
                          taskStatus={task.status}
                          onShowMovCompletionPrompt={() => setShowMovCompletionPrompt(true)}
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
                        <div className="tv2-done-empty">
                          {hasMovItems
                            ? 'No MOV items are assigned to your user.'
                            : 'No Means of Verification (MOV) checklist items have been defined for this task.'}
                        </div>
                      )}
                      {movChecklistLines.length > 0 && (
                        <p className="tv2-done-note">
                          “Mark complete” unlocks when every condition is ticked.
                        </p>
                      )}
                    </section>
                  )}

                  {/* ---- Files ---- */}
                  {showFiles && (
                    <section>
                      {attachmentCount > 0 && (
                        <ul className="tv2-file-list">
                          {initialAttachments.map((a) => renderFileRow(a, true))}
                          {activityAttachments.map((a) => renderFileRow(a, false))}
                        </ul>
                      )}

                      {!isApproverView && (
                        <form
                          onSubmit={addAttachment}
                          className={`tv2-dropzone${dropActive ? ' tv2-dropzone--active' : ''}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropActive(true);
                          }}
                          onDragLeave={() => setDropActive(false)}
                          onDrop={handleAttachmentDrop}
                        >
                          <FiPaperclip aria-hidden="true" />
                          <input
                            key={attachment.file ? 'has-file' : 'no-file'}
                            id="tv2-file-input"
                            type="file"
                            className="tv2-sr-only"
                            onChange={handleAttachmentChange}
                            disabled={!canInteractWithNotes || savingAttachment}
                          />
                          {attachment.file ? (
                            <div className="tv2-upload-row">
                              <input
                                type="text"
                                className="tv2-input"
                                value={attachment.name}
                                onChange={handleAttachmentNameChange}
                                placeholder="Attachment name (e.g. Progress photo)"
                                disabled={!canInteractWithNotes || savingAttachment}
                                required
                                aria-label="Attachment name"
                              />
                              <button
                                type="submit"
                                className="tv2-btn tv2-btn--primary"
                                disabled={savingAttachment || !canInteractWithNotes}
                              >
                                {savingAttachment ? 'Adding...' : 'Upload'}
                              </button>
                              <button
                                type="button"
                                className="tv2-btn tv2-btn--plain"
                                disabled={savingAttachment}
                                onClick={() => setAttachment({ file: null, name: '' })}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span>
                              {attachmentCount === 0 ? 'No files yet. ' : ''}
                              Drop progress photos or signed forms, or{' '}
                              <label htmlFor="tv2-file-input" className="tv2-browse">
                                browse
                              </label>
                            </span>
                          )}
                        </form>
                      )}
                    </section>
                  )}

                  {/* ---- Activity ---- */}
                  {showActivity && (
                    <section>
                      <span className="tv2-label">Activity</span>

                      {!isApproverView && (
                        <form onSubmit={addComment} className="tv2-composer">
                          <span className="tv2-avatar">{getInitials(myDisplayName)}</span>
                          <div className="tv2-composer-box">
                            <MentionCommentInput
                              key={commentFormKey}
                              name="content"
                              value={comment.content}
                              mentionedUserIds={comment.mentioned_user_ids}
                              onChange={handleCommentChange}
                              onMentionedUsersChange={handleMentionedUsersChange}
                              disabled={!canInteractWithNotes}
                              placeholder="Post an update… @ to notify"
                            />
                            <button
                              type="submit"
                              className="tv2-post-btn"
                              disabled={savingComment || !canInteractWithNotes}
                            >
                              {savingComment ? 'Posting…' : 'Post'}
                            </button>
                          </div>
                        </form>
                      )}

                      {feedItems.length === 0 ? (
                        <div className="tv2-empty">No activity yet</div>
                      ) : (
                        <ul className="tv2-feed">
                          {feedItems.map((item) => (
                            <li key={item.key} className="tv2-feed-item">
                              <span
                                className={`tv2-feed-dot${
                                  item.kind === 'overdue'
                                    ? ' tv2-feed-dot--danger'
                                    : item.kind === 'system'
                                      ? ' tv2-feed-dot--muted'
                                      : ''
                                }`}
                              />
                              {item.kind === 'overdue' && (
                                <>
                                  <div>
                                    <strong>{item.title}</strong> · System · {formatDateOnly(item.date)}
                                  </div>
                                  {item.sub && <div className="tv2-feed-sub">{item.sub}</div>}
                                </>
                              )}
                              {item.kind === 'created' && (
                                <div>
                                  <strong>{item.author}</strong> created this task
                                  {item.assignees ? ` for ${item.assignees}` : ''} · {formatDateOnly(item.date)}
                                </div>
                              )}
                              {(item.kind === 'comment' || item.kind === 'system') && (
                                <>
                                  <div>
                                    <strong>{item.author}</strong> · {formatDateOnly(item.date)}
                                  </div>
                                  <div className="tv2-feed-text">{item.text}</div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Full audit timeline — still gated by the same permission as before. */}
                      {activeTab === 'activity' && taskPerms.canViewProgressHistory && (
                        <div style={{ marginTop: 20 }}>
                          <TaskActivityTimeline activities={task.activities || []} />
                        </div>
                      )}
                    </section>
                  )}

                  {/* ---- Extras (overview only) ---- */}
                  {showExtras && renderRecurrenceInfo()}

                  {showExtras && hasApprovalPanel && (
                    <section className="tv2-card">
                      <span className="tv2-label">Approval</span>
                      <ul className="tv2-approvers">
                        {approvalRows.map((row) => (
                          <li key={row.id} className="tv2-row">
                            <span>{row.name}</span>
                            <span className={`tv2-pill tv2-pill--${row.decision}`}>
                              {row.decisionLabel}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {showExtras && !isApproverView && dependencies.length > 0 && (
                    <section className="tv2-card">
                      <span className="tv2-label">Dependencies</span>
                      <ul className="tv2-deps">
                        {dependencies.map((dep) => {
                          const key = dep.id || dep.task_id || dep;
                          const title = dep.title || dep.name || `Task #${key}`;
                          const depStatusLabel = dep.status ? capitalize(dep.status) : '';
                          return (
                            <li key={key} className="tv2-row">
                              <span>{title}</span>
                              {depStatusLabel && <span className="tv2-pill">{depStatusLabel}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {showExtras && !isApproverView && reassignmentActivities.length > 0 && (
                    <section className="tv2-card">
                      <span className="tv2-label">Reassignment history</span>
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
                              <div className="reassignment-timestamp">{when}</div>
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
                    </section>
                  )}

                  {showExtras && !isApproverView && (relatedLoading || relatedTasks.length > 0) && (
                    <section className="tv2-card">
                      <span className="tv2-label">Related tasks</span>
                      {relatedLoading && <div className="tv2-empty">Loading related tasks...</div>}
                      {!relatedLoading && relatedTasks.length > 0 && (
                        <ul className="tv2-related">
                          {relatedTasks.map((t) => (
                            <li
                              key={t.id}
                              className="tv2-row tv2-row--click"
                              onClick={() => {
                                if (isModal && onOpenRelatedTask) {
                                  onOpenRelatedTask(t.id);
                                  return;
                                }
                                navigate(`${taskRouteBase}/view/${t.id}`);
                              }}
                            >
                              <span>{t.title}</span>
                              <span className="tv2-pill">{capitalize(t.status)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  )}
                </div>

                {/* ============================ SIDE RAIL ============================ */}
                <aside className="tv2-side">
                  <div className="tv2-card">
                    <div className="tv2-people">
                      {assignmentUsersForDisplay.length > 0 ? (
                        assignmentUsersForDisplay.map((u) => (
                          <div key={u.id} className="tv2-person">
                            <span className="tv2-avatar tv2-avatar--lg">
                              {getInitials(getUserDisplayName(u))}
                            </span>
                            <span className="tv2-person-text">
                              <span className="tv2-person-role">Assignee</span>
                              <span className="tv2-person-name">{getUserDisplayName(u)}</span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="tv2-person">
                          <span className="tv2-avatar tv2-avatar--lg">?</span>
                          <span className="tv2-person-text">
                            <span className="tv2-person-role">Assignee</span>
                            <span className="tv2-person-name">—</span>
                          </span>
                        </div>
                      )}
                      <div className="tv2-person">
                        <span className="tv2-avatar tv2-avatar--lg tv2-avatar--mint">
                          {getInitials(getUserDisplayName(task.created_by))}
                        </span>
                        <span className="tv2-person-text">
                          <span className="tv2-person-role">Created by</span>
                          <span className="tv2-person-name">{getUserDisplayName(task.created_by)}</span>
                        </span>
                      </div>
                      {/* {reportingManagersForDisplay.map((m) => (
                        <div key={m.id || m.user_id} className="tv2-person">
                          <span className="tv2-avatar tv2-avatar--lg">
                            {getInitials(getUserDisplayName(m))}
                          </span>
                          <span className="tv2-person-text">
                            <span className="tv2-person-role">Reporting Manager</span>
                            <span className="tv2-person-name">{getUserDisplayName(m)}</span>
                          </span>
                        </div>
                      ))} */}
                    </div>

                    <dl className="tv2-meta">
                      <dt>Project</dt>
                      <dd className={task.project_name ? '' : 'is-muted'}>{task.project_name || '—'}</dd>
                      <dt>Start Date</dt>
                      <dd className={task.start_date ? '' : 'is-muted'}>
                        {task.start_date ? formatDateOnly(task.start_date) : 'Not set'}
                      </dd>
                      <dt>Due Date</dt>
                      <dd className={overdueAfterToday ? 'is-danger' : ''}>{formatDateOnly(task.due_date)}</dd>
                      <dt>Created Date</dt>
                      <dd>{formatDateOnly(task.created_at)}</dd>
                      <dt>Updated Date</dt>
                      <dd>{formatDayTime(task.updated_at || task.created_at)}</dd>
                      {showCompletedDate && (
                        <>
                          <dt>Completed Date</dt>
                          <dd>{formatDateOnly(task.completed_date)}</dd>
                        </>
                      )}
                      {isApprovalWorkflow &&
                        ['approved', 'rejected'].includes(statusLower) &&
                        task?.approved_by && (
                          <>
                            <dt>{statusLower === 'rejected' ? 'Rejected by' : 'Approved by'}</dt>
                            <dd>{getUserDisplayName(task.approved_by)}</dd>
                          </>
                        )}
                      {isRecurringTask && (
                        <>
                          <dt>Repeats</dt>
                          <dd>
                            {task.recurrence_rule
                              ? task.recurrence_rule.includes(' days')
                                ? `Every ${task.recurrence_rule}`
                                : task.recurrence_rule[0].toUpperCase() + task.recurrence_rule.slice(1)
                              : '—'}
                          </dd>
                          <dt>Next</dt>
                          <dd>{formatDateOnly(task.recurrence_next_date)}</dd>
                        </>
                      )}
                    </dl>
                  </div>

                  {!isApproverView && (
                    <div className="tv2-time">
                      <div className="tv2-time-head">
                        <span className="tv2-label">Time logged</span>
                        {totalTimeSeconds > 0 && (
                          <span className="tv2-time-total">Total {formatTimeShort(totalTimeSeconds)}</span>
                        )}
                      </div>
                      <TimeTracker taskId={task.id} taskStatus={task.status} />
                    </div>
                  )}

                  <div className="tv2-card tv2-reminder">
                    <TaskDueRemindersPanel
                      taskId={task.id}
                      dueDate={task.due_date}
                      isAssignee={isCurrentUserAssignee}
                      disabled={!canInteractWithNotes}
                    />
                  </div>
                </aside>
              </div>

              <div className="tv2-footer">
                <span>MTJ Foundation • Task Management System</span>
                <span>Department: {capitalize(task.department)}</span>
                <span>Last updated: {formatDate(task.updated_at || task.created_at)}</span>
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

            {/* MOV Completion Prompt */}
            {showMovCompletionPrompt && (
              <div className="status-modal-backdrop" role="dialog" aria-modal="true">
                <div className="status-modal">
                  <div className="status-modal-header">
                    <h3 className="status-modal-title">All MOV Items Completed</h3>
                  </div>
                  <div className="status-modal-body">
                    <p className="status-modal-text">
                      All MOV items are completed. Do you want to change the task status to Completed?
                    </p>
                  </div>
                  <div className="status-modal-footer">
                    <button
                      type="button"
                      className="task-status-modal-cancel"
                      onClick={() => setShowMovCompletionPrompt(false)}
                    >
                      No
                    </button>
                    <PrimaryButton
                      style={{ color: '#ffffff' }}
                      type="button"
                      onClick={async () => {
                        // Change task status to Completed
                        try {
                          const payload = { status: 'completed', notes: 'All MOV items completed' };
                          await axiosInstance.post(`/tasks/${task.id}/status-transition`, payload);
                          const refreshed = await axiosInstance.get(`/tasks/${task.id}`);
                          const updatedTask = refreshed.data?.data || null;
                          if (updatedTask) {
                            setTask(updatedTask);
                          }
                          toast.success('Task marked as Completed');
                          setShowMovCompletionPrompt(false);

                          // If task is approval-based, show Submit for Approval modal
                          if (String(task.workflow_type).toLowerCase() === 'approval_required') {
                            setStatusModalAction('SUBMIT_APPROVAL');
                            setStatusModalOpen(true);
                          }
                        } catch (e) {
                          const msg = e.response?.data?.message || 'Failed to update status.';
                          setError(msg);
                          toast.error(msg);
                        }
                      }}
                    >
                      Yes
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}

            <QuickActionModal
              isOpen={quickActionOpen}
              taskId={task.id}
              actionKey={quickActionKey}
              userDepartment={user?.department}
              taskRouteBase={taskRouteBase}
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
        )}
      </div>
    </>
  );
};

export default ViewTask;
