import React, { useMemo, useState } from 'react';
import {
  STATUS_BUTTON_CONFIG,
  QUICK_ACTIONS,
  isStatusActionAvailable,
  isQuickActionAvailable,
} from './taskStatusConfig';

const TaskActionBar = ({
  taskId,
  currentStatus,
  permissions,
  userDepartment,
  taskDepartment,
  workflowType,
  onStatusAction,
  onQuickAction,
  disabled,
  align = 'top',
  userRole,
  isAssignee,
  currentUserId,
  createdByUserId,
  reportedById,
  reportedByIds,
  approvalRequiredUserIds,
  approvalsMeta,
  currentUserHasActedOnApproval,
  approvalLoading = false,
}) => {
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  // Multi-manager support: resolve all reporting manager IDs from reportedByIds array or legacy reportedById
  const effectiveReporterIds = useMemo(() => {
    if (Array.isArray(reportedByIds) && reportedByIds.length > 0) {
      return reportedByIds.map(Number).filter((v) => Number.isFinite(v) && v > 0);
    }
    if (reportedById != null && Number(reportedById) > 0) {
      return [Number(reportedById)];
    }
    return [];
  }, [reportedById, reportedByIds]);

  const canApprove = permissions?.canApprove;
  const normalizedStatus = useMemo(
    () => String(currentStatus || '').toUpperCase(),
    [currentStatus],
  );

  const normalizedWorkflow = useMemo(
    () => String(workflowType || '').toUpperCase(),
    [workflowType],
  );

  const availabilityContext = useMemo(
    () => ({
      permissions,
      userDepartment,
      taskDepartment,
      userRole,
      isAssignee,
      workflowType: normalizedWorkflow,
      currentStatus: normalizedStatus,
      currentUserId,
      createdByUserId,
      reportedById,
      reportedByIds: effectiveReporterIds,
      approvalRequiredUserIds,
      approvalsMeta,
      currentUserHasActedOnApproval,
    }),
    [
      permissions,
      userDepartment,
      taskDepartment,
      userRole,
      isAssignee,
      normalizedWorkflow,
      normalizedStatus,
      currentUserId,
      createdByUserId,
      reportedById,
      effectiveReporterIds,
      approvalRequiredUserIds,
      approvalsMeta,
      currentUserHasActedOnApproval,
    ],
  );

  const availableButtons = useMemo(() => {
    const isApprovalWorkflow =
      normalizedWorkflow === 'APPROVAL_REQUIRED' ||
      normalizedWorkflow === 'APPROVAL_BASED';

    // Don't show approval buttons while approval data is loading ONLY if it's pending approval
    if (approvalLoading && isApprovalWorkflow && normalizedStatus === 'PENDING_APPROVAL') {
      return [];
    }
    const rawRole = String(userRole || '').toLowerCase();
    const isAdminRole = rawRole === 'super_admin' || rawRole === 'admin';
    const isAssigneeUser = isAssignee === true;
    const taskApproverIds = Array.isArray(approvalRequiredUserIds)
      ? approvalRequiredUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
      : [];
    const metaApproverIds = Array.isArray(approvalsMeta)
      ? approvalsMeta.map((m) => Number(m?.user_id)).filter((v) => Number.isFinite(v) && v > 0)
      : [];
    const approverIds = Array.from(new Set([...taskApproverIds, ...metaApproverIds]));
    const isConfiguredApprover = currentUserId != null && approverIds.includes(Number(currentUserId));

    let baseButtons = [];

    if (['DRAFT', 'OPEN', 'ASSIGNED'].includes(normalizedStatus)) {
      baseButtons = [
        // { label: 'Start Task (In Progress)', action: 'START', color: 'primary' },
      ];
    } else if (normalizedStatus === 'IN_PROGRESS') {
      if (isApprovalWorkflow) {
        baseButtons = [
          { label: 'Submit for Approval', action: 'SUBMIT_APPROVAL', color: 'primary' },
          { label: 'Block Task', action: 'BLOCK', color: 'danger' },
        ];
      } else {
        baseButtons = [
          { label: 'Complete Task', action: 'COMPLETE', color: 'success' },
          { label: 'Block Task', action: 'BLOCK', color: 'danger' },
        ];
      }
    } else if (normalizedStatus === 'PENDING_APPROVAL') {
      baseButtons = [
        { label: 'Approve Deliverables', action: 'APPROVE', color: 'success' },
        { label: 'Request Revisions (Reject)', action: 'REJECT', color: 'danger' },
      ];
    } else if (normalizedStatus === 'APPROVED') {
      // Approved task moves to Completed
      baseButtons = [
        { label: 'Mark Completed', action: 'COMPLETE', color: 'success' },
      ];
    } else if (normalizedStatus === 'REJECTED') {
      // Return rejected task to In Progress
      baseButtons = [
        { label: 'Resume Work (In Progress)', action: 'REOPEN_IN_PROGRESS', color: 'primary' },
      ];
    } else if (normalizedStatus === 'COMPLETED') {
      baseButtons = [
        { label: 'Close Task', action: 'CLOSE', color: 'danger' },
        { label: 'Reopen Task', action: 'REOPEN', color: 'secondary' },
      ];
    } else if (normalizedStatus === 'CLOSED') {
      baseButtons = [
        { label: 'Reopen Task', action: 'REOPEN', color: 'primary' },
      ];
    } else if (normalizedStatus === 'BLOCKED') {
      baseButtons = [
        { label: 'Unblock Task (In Progress)', action: 'REOPEN_IN_PROGRESS', color: 'primary' },
      ];
    }

    if (normalizedStatus === 'PENDING_APPROVAL') {
      const isCreator = currentUserId != null && createdByUserId != null && Number(currentUserId) === Number(createdByUserId);
      const isReporter = currentUserId != null && effectiveReporterIds.includes(Number(currentUserId));
      const canActOnApproval = isConfiguredApprover || isAdminRole || (approverIds.length === 0 && (isCreator || isReporter));
      if (!canActOnApproval) {
        return [];
      }
    }

    return baseButtons.filter((btn) =>
      isStatusActionAvailable(btn.action, availabilityContext),
    );
  }, [
    normalizedStatus,
    normalizedWorkflow,
    canApprove,
    availabilityContext,
    approvalLoading,
    currentUserId,
    createdByUserId,
    effectiveReporterIds,
    approvalRequiredUserIds,
    approvalsMeta,
    userRole,
    isAssignee,
  ]);

  const visibleQuickActions = useMemo(
    () => {
      const result = QUICK_ACTIONS.filter((item) => {
        const allowed = isQuickActionAvailable(item.key, availabilityContext);
        return allowed;
      });
      return result;
    },
    [availabilityContext],
  );

  const reassignLabel = useMemo(() => {
    const cfg = QUICK_ACTIONS.find((q) => q.key === 'REASSIGN');
    return cfg ? cfg.label : 'Reassign task';
  }, []);

  const disabledReassignTooltip = useMemo(() => {
    const perms = availabilityContext.permissions || {};
    const sameDept =
      availabilityContext.userDepartment &&
      availabilityContext.taskDepartment &&
      String(availabilityContext.userDepartment) ===
        String(availabilityContext.taskDepartment);
    const statusLower = String(currentStatus || '').toLowerCase();
    const allowedStatuses = [
      'draft',
      'open',
      'in_progress',
      'in progress',
      'rejected',
    ];
    const isStatusAllowed = allowedStatuses.includes(statusLower);
    const hasReassignAction = QUICK_ACTIONS.some(
      (q) => q.key === 'REASSIGN',
    );
    const reassignVisible = visibleQuickActions.some(
      (q) => q.key === 'REASSIGN',
    );
    if (
      hasReassignAction &&
      !reassignVisible &&
      perms.canAssign &&
      sameDept &&
      !isStatusAllowed
    ) {
      return 'Reassign is only available when status is Draft, Open, In Progress, or Rejected.';
    }
    return '';
  }, [availabilityContext, currentStatus, visibleQuickActions]);

  const handleStatusClick = (action) => {
    console.log('TaskActionBar handleStatusClick called with action:', action);
    console.log('disabled:', disabled);
    console.log('onStatusAction:', onStatusAction);
    if (disabled || !onStatusAction) return;
    onStatusAction(action);
    setIsQuickOpen(false);
    setIsFabMenuOpen(false);
  };

  const handleQuickClick = (key) => {
    console.log('TaskActionBar handleQuickClick called with key:', key);
    console.log('disabled:', disabled);
    console.log('onQuickAction:', onQuickAction);
    if (disabled) return;
    if (onQuickAction) {
      onQuickAction(key);
    }
    setIsQuickOpen(false);
    setIsFabMenuOpen(false);
  };

  // console.log('TaskActionBar debug info:', {
  //   availableButtons,
  //   visibleQuickActions,
  //   approvalLoading,
  //   normalizedStatus,
  //   normalizedWorkflow,
  //   availabilityContext,
  //   permissions,
  //   userRole,
  //   isAssignee
  // });

  const containerClass =
    align === 'bottom'
      ? 'task-action-bar-container task-action-bar-container--bottom'
      : 'task-action-bar-container';

  return (
    <div className={containerClass}>
      <div className="task-action-bar">
        <div className="task-action-bar-primary">
          {availableButtons.map((btn) => (
            <button
              key={btn.action}
              type="button"
              className={`task-action-button task-action-button--${btn.color}`}
              onClick={() => handleStatusClick(btn.action)}
              disabled={disabled}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="tv2-more">
          <button
            type="button"
            className="tv2-btn tv2-btn--ghost"
            onClick={() => setIsQuickOpen((prev) => !prev)}
            disabled={disabled}
            aria-haspopup="true"
            aria-expanded={isQuickOpen}
          >
            Quick Actions
          </button>
          {isQuickOpen && (
            <div className="task-action-quick-menu">
              {visibleQuickActions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="tv2-more-item"
                  onClick={() => handleQuickClick(item.key)}
                  disabled={disabled}
                >
                  {item.label}
                </button>
              ))}
              {disabledReassignTooltip && (
                <button
                  type="button"
                  className="task-action-quick-item"
                  disabled
                  title={disabledReassignTooltip}
                >
                  {reassignLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="task-action-fab"
        aria-label="Task actions"
        onClick={() => setIsFabMenuOpen((prev) => !prev)}
        disabled={disabled}
      >
        ⋮
      </button>

      {isFabMenuOpen && (
        <div className="task-action-fab-menu">
          <div className="task-action-fab-section">
            {availableButtons.map((btn) => (
              <button
                key={btn.action}
                type="button"
                className={`task-action-button task-action-button--${btn.color}`}
                onClick={() => handleStatusClick(btn.action)}
                disabled={disabled}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="task-action-fab-section">
            {visibleQuickActions.map((item) => (
              <button
                key={item.key}
                type="button"
                className="tv2-more-item"
                onClick={() => handleQuickClick(item.key)}
                disabled={disabled}
              >
                {item.label}
              </button>
            ))}
            {disabledReassignTooltip && (
              <button
                type="button"
                className="tv2-more-item"
                disabled
                title={disabledReassignTooltip}
              >
                {reassignLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskActionBar;
