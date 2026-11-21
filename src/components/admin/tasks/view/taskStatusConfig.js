export const STATUS_BUTTON_CONFIG = {
  DRAFT: [
    { label: 'Start Task', action: 'START', color: 'primary' },
  ],
  OPEN: [
    { label: 'Start Task', action: 'START', color: 'primary' },
  ],
  ASSIGNED: [
    { label: 'Start Task', action: 'START', color: 'primary' },
  ],
  IN_PROGRESS: [
    { label: 'Submit for Approval', action: 'SUBMIT_APPROVAL', color: 'primary' },
    { label: 'Complete Task', action: 'COMPLETE', color: 'success' },
    { label: 'Block Task', action: 'BLOCK', color: 'danger' },
  ],
  PENDING: [],
  PENDING_APPROVAL: [
    { label: 'Approve Deliverables', action: 'APPROVE', color: 'success' },
    { label: 'Request Revisions (Reject)', action: 'REJECT', color: 'danger' },
  ],
  REJECTED: [
    { label: 'Resume Work (In Progress)', action: 'REOPEN_IN_PROGRESS', color: 'primary' },
  ],
  APPROVED: [
    { label: 'Mark Completed', action: 'COMPLETE', color: 'success' },
  ],
  COMPLETED: [
    { label: 'Close Task', action: 'CLOSE', color: 'danger' },
    { label: 'Reopen Task', action: 'REOPEN', color: 'secondary' },
  ],
  CLOSED: [
    { label: 'Reopen Task', action: 'REOPEN', color: 'primary' },
  ],
  CANCELLED: [
    { label: 'Reopen Task', action: 'REOPEN', color: 'primary' },
  ],
  FAILED: [],
  REGISTERED: [],
  BLOCKED: [
    { label: 'Unblock Task (In Progress)', action: 'REOPEN_IN_PROGRESS', color: 'primary' },
  ],
  PAUSED: [
    { label: 'Resume Work (In Progress)', action: 'REOPEN_IN_PROGRESS', color: 'primary' },
  ],
  ON_HOLD: [
    { label: 'Resume Work (In Progress)', action: 'REOPEN_IN_PROGRESS', color: 'primary' },
  ],
};

export const STATUS_TRANSITION_MAP = {
  START: 'in_progress',
  PAUSE: 'in_progress',
  COMPLETE: 'completed',
  BLOCK: 'blocked',
  REOPEN_IN_PROGRESS: 'in_progress',
  CLOSE: 'closed',
  REOPEN: 'in_progress',
  SUBMIT_APPROVAL: 'pending_approval',
  APPROVE: 'approved',
  REJECT: 'rejected',
  CANCEL: 'cancelled',
};

export const QUICK_ACTIONS = [
  { key: 'REASSIGN', label: 'Reassign task' },
  { key: 'CHANGE_DUE_DATE', label: 'Request to extend due date' },
  { key: 'CHANGE_PRIORITY', label: 'Change priority' },
  // { key: 'ESCALATE', label: 'Escalate to manager' },
  { key: 'MOVE_PROJECT', label: 'Move to another project' },
  // { key: 'ADD_TAGS', label: 'Add tags / labels' },
  { key: 'GENERATE_REPORT', label: 'Generate report' },
];

export const QUICK_ACTION_LABEL_MAP = QUICK_ACTIONS.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

const isSameDeptOrOrg = (context) => {
  const userDept = context.userDepartment;
  const taskDept = context.taskDepartment;
  const scope = context.permissions?.reportScope;
  if (!taskDept || !userDept) return true;
  if (userDept === taskDept) return true;
  if (scope === 'org' || scope === 'department' || scope === 'team') return true;
  return false;
};

const DEPARTMENT_QUICK_ACTION_RULES = {
  program: {
    allowed: [
      'REASSIGN',
      'CHANGE_DUE_DATE',
      'CHANGE_PRIORITY',
      // 'ESCALATE',
      'MOVE_PROJECT',
      // 'ADD_TAGS',
      'GENERATE_REPORT',
    ],
  },
  accounts_and_finance: {
    allowed: ['CHANGE_DUE_DATE', 'CHANGE_PRIORITY', 'GENERATE_REPORT'],
  },
};

const applyDepartmentQuickRules = (key, context, baseAllowed) => {
  if (!baseAllowed) return false;
  if (key === 'CHANGE_DUE_DATE') return true;
  const dept = context.taskDepartment || context.userDepartment;
  if (!dept) return baseAllowed;
  const rules = DEPARTMENT_QUICK_ACTION_RULES[dept];
  if (!rules) return baseAllowed;
  if (rules.allowed && !rules.allowed.includes(key)) {
    return false;
  }
  if (rules.blocked && rules.blocked.includes(key)) {
    return false;
  }
  return baseAllowed;
};

export const isStatusActionAvailable = (action, context) => {
  const perms = context.permissions || {};
  const role = String(context.userRole || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isAdminRole = isSuperAdmin || role === 'admin';
  const isAssignee = context.isAssignee === true;
  const sameDeptOrOrg = isSameDeptOrOrg(context);
  const workflowRaw = String(context.workflowType || '').toUpperCase();
  const isApprovalWorkflow =
    workflowRaw === 'APPROVAL_REQUIRED' || workflowRaw === 'APPROVAL_BASED';
  const currentStatusRaw = String(context.currentStatus || '').toLowerCase();
  const approverIdsRaw = context.approvalRequiredUserIds;
  const approverIds = Array.isArray(approverIdsRaw)
    ? approverIdsRaw
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0)
    : [];
  const approvalsMetaRaw = context.approvalsMeta;
  const approvalsMeta = Array.isArray(approvalsMetaRaw)
    ? approvalsMetaRaw
    : [];
  const metaApproverIds = approvalsMeta
    .map((m) => (m && m.user_id ? Number(m.user_id) : null))
    .filter((v) => Number.isFinite(v) && v > 0);
  const effectiveApproverIds = Array.from(
    new Set([...approverIds, ...metaApproverIds]),
  );
  const currentUserIdNum =
    context.currentUserId != null ? Number(context.currentUserId) : null;
  const isConfiguredApprover =
    currentUserIdNum != null && effectiveApproverIds.length > 0
      ? effectiveApproverIds.includes(currentUserIdNum)
      : false;
  const hasActedOnApproval =
    context.currentUserHasActedOnApproval === true;
  const currentApprovalMeta =
    currentUserIdNum != null
      ? approvalsMeta.find(
          (m) => m && Number(m.user_id) === Number(currentUserIdNum),
        )
      : null;
  const currentDecision = currentApprovalMeta
    ? String(currentApprovalMeta.decision || 'pending').toLowerCase()
    : 'pending';
  const allApprovalsCompleted =
    effectiveApproverIds.length > 0 &&
    effectiveApproverIds.every((idVal) => {
      const meta = approvalsMeta.find(
        (m) => m && Number(m.user_id) === Number(idVal),
      );
      if (!meta) return false;
      const decision = String(meta.decision || 'pending').toLowerCase();
      return decision === 'approved' || decision === 'rejected';
    });
  const createdByUid =
    context.createdByUserId != null
      ? Number(context.createdByUserId)
      : (context.task?.created_by_id != null
          ? Number(context.task.created_by_id)
          : (context.task?.created_by?.id != null
              ? Number(context.task.created_by?.id)
              : null));
  const currentUid =
    context.currentUserId != null ? Number(context.currentUserId) : null;
  const isCreator =
    currentUid != null &&
    createdByUid != null &&
    currentUid === createdByUid;
  const reporterIds = Array.isArray(context.reportedByIds)
    ? context.reportedByIds.map(Number).filter((v) => Number.isFinite(v) && v > 0)
    : (context.reportedById != null ? [Number(context.reportedById)] : []);
  const isReporter =
    currentUid != null &&
    reporterIds.includes(currentUid);
  const isManagement = isCreator || isReporter || isAdminRole;

  switch (action) {
    case 'START':
      return isAssignee || isSuperAdmin;
    case 'PAUSE':
    case 'BLOCK':
      return (isAssignee || isSuperAdmin) && currentStatusRaw === 'in_progress';
    case 'REOPEN_IN_PROGRESS':
      return (isAssignee || isSuperAdmin) && (['blocked', 'rejected', 'paused', 'on_hold', 'hold'].includes(currentStatusRaw));
    case 'REOPEN':
      // Only the Task Creator (or Super Admin) can reopen completed, closed, or cancelled tasks
      return (isCreator || isSuperAdmin) && (currentStatusRaw === 'completed' || currentStatusRaw === 'closed' || currentStatusRaw === 'cancelled');
    case 'COMPLETE':
      if (isApprovalWorkflow) {
        // In approval workflow, only an APPROVED task moves to COMPLETED by Assignee (or Super Admin)
        return (isAssignee || isSuperAdmin) && currentStatusRaw === 'approved';
      }
      return (isAssignee || isSuperAdmin) && currentStatusRaw === 'in_progress';
    case 'CLOSE':
      // Only COMPLETED tasks can be formally closed by the Task Creator (or Super Admin)
      return (isCreator || isSuperAdmin) && currentStatusRaw === 'completed';
    case 'CANCEL':
      return isManagement && !['completed', 'closed', 'cancelled'].includes(currentStatusRaw) && sameDeptOrOrg;
    case 'SUBMIT_APPROVAL':
      return (isAssignee || isSuperAdmin) && isApprovalWorkflow && (currentStatusRaw === 'in_progress' || currentStatusRaw === 'in progress');
    case 'APPROVE':
    case 'REJECT':
      if (currentStatusRaw !== 'pending_approval') {
        return false;
      }
      if (effectiveApproverIds.length > 0) {
        if (!isConfiguredApprover && !isSuperAdmin) return false;
      } else {
        if (!isManagement) return false;
      }
      if (hasActedOnApproval) return false;
      if (currentDecision === 'approved' || currentDecision === 'rejected') {
        return false;
      }
      return true;
    default:
      return true;
  }
};

export const isQuickActionAvailable = (key, context) => {
  const perms = context.permissions || {};
  const sameDeptOrOrg = isSameDeptOrOrg(context);
  const statusRaw = String(context.currentStatus || '').toLowerCase();
  const isAssignee = context.isAssignee === true;
  const role = String(context.userRole || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isAdminRole = isSuperAdmin || role === 'admin';
  const currentUid = context.currentUserId != null ? Number(context.currentUserId) : null;
  const createdByUid =
    context.createdByUserId != null
      ? Number(context.createdByUserId)
      : (context.task?.created_by_id != null
          ? Number(context.task.created_by_id)
          : null);
  const isCreator = currentUid != null && createdByUid != null && currentUid === createdByUid;

  const canReassignForStatus = (() => {
    if (!statusRaw) return false;
    if (
      [
        'draft',
        'open',
        'in_progress',
        'in progress',
        'rejected',
      ].includes(statusRaw)
    ) {
      return true;
    }
    return false;
  })();
  let baseAllowed = true;
  switch (key) {
    case 'REASSIGN':
      baseAllowed = perms.canAssign && sameDeptOrOrg && canReassignForStatus;
      break;
    case 'CHANGE_DUE_DATE':
      // Only the assignee can request a deadline extension; the assigner/creator reviews it.
      baseAllowed =
        isAssignee &&
        !['completed', 'closed', 'cancelled'].includes(statusRaw);
      break;
    case 'CHANGE_PRIORITY':
    case 'MOVE_PROJECT':
      baseAllowed = perms.canUpdate && sameDeptOrOrg;
      break;
    case 'ESCALATE':
      baseAllowed = perms.canUpdate || perms.canComplete;
      break;
    case 'ADD_TAGS':
      baseAllowed = perms.canUpdate || perms.canCreate;
      break;
    case 'GENERATE_REPORT':
      baseAllowed = perms.canView;
      break;
    default:
      baseAllowed = true;
      break;
  }
  return applyDepartmentQuickRules(key, context, baseAllowed);
};

