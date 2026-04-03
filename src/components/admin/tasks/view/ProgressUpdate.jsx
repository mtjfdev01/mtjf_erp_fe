import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';

const ProgressUpdate = ({
  taskId,
  currentProgress,
  movLines,
  onUpdate,
  canEdit = true,
  currentUser,
  progressActivities = [],
}) => {
  const isStructured = useMemo(() => {
    return (
      Array.isArray(movLines) &&
      movLines.length > 0 &&
      typeof movLines[0] === 'object' &&
      movLines[0] !== null &&
      'text' in movLines[0]
    );
  }, [movLines]);

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(
    Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getItemCompletedBy = useCallback((targetProgress) => {
    if (!Array.isArray(progressActivities) || progressActivities.length === 0) return null;
    const activity = progressActivities.find(a => {
      if (!a || !a.details) return false;
      return Number(a.details.progress) === targetProgress;
    });
    return activity?.performed_by?.id || null;
  }, [progressActivities]);

  useEffect(() => {
    if (isStructured) {
      setItems(movLines);
      setProgress(
        Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
      );
      return;
    }

    const lines = Array.isArray(movLines)
      ? movLines
          .map((line) => String(line || '').trim())
          .filter((line) => line.length > 0)
      : [];
    const total = lines.length;
    if (total === 0) {
      setItems([]);
      setProgress(
        Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
      );
      return;
    }
    const numericProgress = Number(currentProgress) || 0;
    const completedCount = Math.max(
      0,
      Math.min(total, Math.round((numericProgress / 100) * total)),
    );
    const nextItems = lines.map((text, index) => {
      const completed = index < completedCount;
      let completed_by_id = null;
      if (completed) {
        const targetProgress = Math.round(((index + 1) / total) * 100);
        completed_by_id = getItemCompletedBy(targetProgress);
      }
      return {
        text,
        completed,
        completed_by_id,
      };
    });
    setItems(nextItems);
    const nextProgress =
      total > 0 ? Math.round((completedCount / total) * 100) : 0;
    setProgress(nextProgress);
  }, [movLines, isStructured, currentProgress, getItemCompletedBy]);

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const progressBucket =
    clampedProgress === 0
      ? 'task-progress-bar-fill--0'
      : clampedProgress <= 25
      ? 'task-progress-bar-fill--25'
      : clampedProgress <= 50
      ? 'task-progress-bar-fill--50'
      : clampedProgress <= 75
      ? 'task-progress-bar-fill--75'
      : 'task-progress-bar-fill--100';

  const completedCount = isStructured
    ? items.filter((item) => item.checked).length
    : items.filter((item) => item.completed).length;
  const totalCount = items.length;

  const handleToggle = async (index) => {
    if (!taskId || !items.length || loading || !canEdit) return;

    const item = items[index];

    // RESTRICTION: Once checked, other assignees cannot check or uncheck it.
    const isChecked = isStructured ? item.checked : item.completed;
    const checkedById = isStructured ? item.checked_by_id : item.completed_by_id;

    if (isChecked && checkedById && Number(checkedById) !== Number(currentUser?.id)) {
      toast.error('You cannot modify an MOV item checked by another user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isStructured) {
        const nextChecked = !item.checked;
        const res = await axiosInstance.patch(
          `/tasks/${taskId}/mov/${index}`,
          { checked: nextChecked },
        );
        const updatedTask = res.data?.data;
        if (updatedTask) {
          setItems(updatedTask.mov_checklist);
          setProgress(updatedTask.progress);
          if (onUpdate) {
            onUpdate(
              updatedTask.progress,
              `Toggled MOV: ${item.text}`,
              updatedTask,
            );
          }
        }
      } else {
        const nextItems = items.map((item, i) =>
          i === index ? { ...item, completed: !item.completed } : item,
        );
        const total = nextItems.length;
        const completed = nextItems.filter((item) => item.completed).length;
        const nextProgress =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        const note = `Complete: ${completed} of ${total} checklist items completed.`;
        const payload = {
          progress: nextProgress,
          notes: note,
        };
        const res = await axiosInstance.put(
          `/tasks/${taskId}/progress`,
          payload,
        );
        setItems(nextItems);
        setProgress(nextProgress);
        if (onUpdate) {
          const data = res.data?.data;
          onUpdate(data?.progress || nextProgress, note, data);
        }
      }
      toast.success('Progress updated');
    } catch (e2) {
      const msg = e2.response?.data?.message || 'Failed to update progress.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="task-progress">
      <div className="task-progress-header">
        <div className="task-progress-main">
          <div className="task-progress-label">Task Verification Checklist</div>
          <div className="task-progress-value">
            <span className="task-progress-percentage">{clampedProgress}%</span>
            <span className="task-progress-separator">·</span>
            <span>
              {completedCount}/{totalCount} completed
            </span>
          </div>
        </div>
        <div className="task-progress-bar">
          <div className={`task-progress-bar-fill ${progressBucket}`} />
        </div>
      </div>
      {error && <div className="task-progress-error">{error}</div>}
      <ul className="mov-checklist-list">
        {items.map((item, index) => {
          const isChecked = isStructured ? item.checked : item.completed;
          const checkedById = isStructured ? item.checked_by_id : item.completed_by_id;
          const isCheckedByOther = isChecked && checkedById && Number(checkedById) !== Number(currentUser?.id);
          const isDisabled = loading || !canEdit || isCheckedByOther;

          return (
            <li key={`${item.text}-${index}`} className="mov-checklist-item">
              <button
                type="button"
                className={`mov-checklist-button${
                  isChecked ? ' mov-checklist-button--checked' : ''
                }${!canEdit || isCheckedByOther ? ' mov-checklist-button--readonly' : ''}`}
                onClick={() => handleToggle(index)}
                disabled={isDisabled}
                title={isCheckedByOther ? 'Checked by another user' : ''}
              >
                <span className="mov-checklist-checkbox">
                  {isChecked ? '✓' : ''}
                </span>
                <span className="mov-checklist-label">{item.text}</span>
                {isChecked && checkedById && (
                  <span
                    className="mov-checklist-info"
                    style={{
                      fontSize: '10px',
                      marginLeft: 'auto',
                      opacity: 0.7,
                    }}
                  >
                    {Number(checkedById) === Number(currentUser?.id)
                      ? '(You)'
                      : `(Assignee)`}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProgressUpdate;
