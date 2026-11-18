import React, { useState } from 'react';
import PrimaryButton from '../../../common/buttons/primary';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import { STATUS_TRANSITION_MAP } from './taskStatusConfig';

const StatusUpdateModal = ({
  isOpen,
  taskId,
  action,
  onClose,
  onUpdated,
}) => {
  console.log('StatusUpdateModal props:', { isOpen, taskId, action });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !action) {
    return null;
  }

  const labelMap = {
    START: 'Start Task',
    PAUSE: 'Pause Task',
    BLOCK: 'Block Task',
    REOPEN: 'Reopen Task',
    REOPEN_IN_PROGRESS: 'Resume Work (In Progress)',
    CLOSE: 'Close Task',
    SUBMIT_APPROVAL: 'Submit for Approval',
    APPROVE: 'Approve Deliverables',
    REJECT: 'Request Revisions (Reject)',
    CANCEL: 'Cancel Task',
    COMPLETE: 'Mark Task Completed',
  };

  const title = labelMap[action] || 'Update Status';
  const requiresNote =
    action === 'REJECT' ||
    action === 'BLOCK' ||
    action === 'REOPEN' ||
    action === 'CANCEL';

  const showNoteField =
    requiresNote ||
    action === 'APPROVE' ||
    action === 'SUBMIT_APPROVAL' ||
    action === 'REOPEN_IN_PROGRESS' ||
    action === 'CLOSE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskId) return;
    const trimmedNotes = notes.trim();
    if (requiresNote && !trimmedNotes) {
      toast.error(`A mandatory reason is required for ${title.toLowerCase()}.`);
      return;
    }
    setLoading(true);
    try {
      if (action === 'APPROVE' || action === 'REJECT') {
        const approve = action === 'APPROVE';
        const res = await axiosInstance.post(
          `/tasks/${taskId}/approve`,
          {
            approve,
            note: trimmedNotes,
            reason: trimmedNotes,
          },
        );
        if (onUpdated) {
          onUpdated(res.data?.data || null);
        }
        toast.success(approve ? 'Task deliverables approved' : 'Task rejected. Sent for revisions.');
      } else {
        const status = STATUS_TRANSITION_MAP[action];
        if (!status) {
          toast.error('Unsupported status action.');
          return;
        }
        const res = await axiosInstance.post(`/tasks/${taskId}/status-transition`, {
          status,
          notes: trimmedNotes,
          reason: trimmedNotes,
        });
        if (onUpdated) {
          onUpdated(res.data?.data || null);
        }
        toast.success('Task status updated');
      }
      setNotes('');
      onClose();
    } catch (e2) {
      const responseData = e2.response?.data;
      const responseMessage = responseData?.message;
      const incompleteCount = responseData?.incomplete_assignee_count
        || responseMessage?.incomplete_assignee_count;
      const confirmationCode = responseData?.code || responseMessage?.code;
      if (
        action === 'COMPLETE' &&
        confirmationCode === 'INCOMPLETE_MOV_CONFIRMATION_REQUIRED'
      ) {
        const count = Number(incompleteCount) || 0;
        const confirmed = window.confirm(
          `${count} assignees still have incomplete MOVs. Do you want to mark this task as Completed anyway?`,
        );
        if (confirmed) {
          try {
            const res = await axiosInstance.post(`/tasks/${taskId}/status-transition`, {
              status: 'completed',
              notes: trimmedNotes,
              reason: trimmedNotes,
              force_complete: true,
            });
            onUpdated?.(res.data?.data || null);
            toast.success('Task marked as completed');
            setNotes('');
            onClose();
          } catch (forceError) {
            toast.error(forceError.response?.data?.message || 'Failed to complete task.');
          }
        }
        return;
      }
      const msg =
        responseMessage ||
        'Failed to update status.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-modal-backdrop" role="dialog" aria-modal="true">
      <div className="status-modal">
        <div className="status-modal-header">
          <h3 className="status-modal-title">
            {title}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="status-modal-body">
            <p className="status-modal-text">
              {action === 'REJECT' && 'Reject deliverables and request corrections from assignee. The task will return to In Progress.'}
              {action === 'BLOCK' && 'Mark this task as blocked. Work will pause until unblocked.'}
              {action === 'REOPEN' && 'Reopen this task and return it to In Progress.'}
              {action === 'APPROVE' && 'Approve deliverables. The task can then move to Completed.'}
              {action === 'SUBMIT_APPROVAL' && 'Submit deliverables for formal review and sign-off.'}
              {action === 'CLOSE' && 'Formally close and archive this completed task.'}
              {!['REJECT', 'BLOCK', 'REOPEN', 'APPROVE', 'SUBMIT_APPROVAL', 'CLOSE'].includes(action) && 'This will update the task status. Do you want to continue?'}
            </p>
            {showNoteField && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  {requiresNote ? (
                    <>
                      Mandatory Reason <span style={{ color: '#ef4444' }}>*</span>
                    </>
                  ) : (
                    'Note / Comments (Optional)'
                  )}
                </label>
                <textarea
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    requiresNote
                      ? 'Please enter a clear explanation for this action...'
                      : 'Add an optional note for this action...'
                  }
                  rows={3}
                  disabled={loading}
                  autoFocus={requiresNote}
                />
              </div>
            )}
          </div>
          <div className="status-modal-footer">
            <button
              type="button"
              className="task-status-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <PrimaryButton
              style={{ color: '#ffffff' }}
              type="submit"
              disabled={loading || (requiresNote && !notes.trim())}
              loading={loading}
              loadingText="Saving..."
            >
              Confirm
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
