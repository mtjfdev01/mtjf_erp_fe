import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';

const ProgressUpdate = ({
  taskId,
  currentProgress,
  movLines,
  onUpdate,
  canEdit = true,
}) => {
  const normalizedLines = useMemo(() => {
    if (!Array.isArray(movLines)) return [];
    return movLines
      .map((line) => String(line || '').trim())
      .filter((line) => line.length > 0);
  }, [movLines]);

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(
    Number.isFinite(Number(currentProgress)) ? Number(currentProgress) : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const lines = normalizedLines;
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
    const nextItems = lines.map((text, index) => ({
      text,
      completed: index < completedCount,
    }));
    setItems(nextItems);
    const nextProgress =
      total > 0 ? Math.round((completedCount / total) * 100) : 0;
    setProgress(nextProgress);
  }, [normalizedLines]);

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

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  const handleToggle = async (index) => {
    if (!taskId || !items.length || loading || !canEdit) return;
    const nextItems = items.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item,
    );
    const total = nextItems.length;
    const completed = nextItems.filter((item) => item.completed).length;
    const nextProgress =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    setLoading(true);
    setError('');
    try {
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
        if (data) {
          onUpdate(data.progress, note, data);
        } else {
          onUpdate(nextProgress, note);
        }
      }
      toast.success('Progress updated');
    } catch (e2) {
      const msg =
        e2.response?.data?.message || 'Failed to update progress.';
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
          <div className="task-progress-label">
            Task Verification Checklist
          </div>
          <div className="task-progress-value">
            <span className="task-progress-percentage">
              {clampedProgress}%
            </span>
            <span className="task-progress-separator">
              ·
            </span>
            <span>
              {completedCount}/{totalCount} completed
            </span>
          </div>
        </div>
        <div className="task-progress-bar">
          <div className={`task-progress-bar-fill ${progressBucket}`} />
        </div>
      </div>
      {error && (
        <div className="task-progress-error">
          {error}
        </div>
      )}
      <ul className="mov-checklist-list">
        {items.map((item, index) => (
          <li key={`${item.text}-${index}`} className="mov-checklist-item">
            <button
              type="button"
              className={`mov-checklist-button${
                item.completed ? ' mov-checklist-button--checked' : ''
              }${!canEdit ? ' mov-checklist-button--readonly' : ''}`}
              onClick={() => handleToggle(index)}
              disabled={loading || !canEdit}
            >
              <span className="mov-checklist-checkbox">
                {item.completed ? '✓' : ''}
              </span>
              <span className="mov-checklist-label">
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProgressUpdate;
