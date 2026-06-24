import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import PrimaryButton from '../../../common/buttons/primary';
import FormSelect from '../../../common/FormSelect';
import FormInput from '../../../common/FormInput';
import './TaskDueRemindersPanel.css';

const OFFSET_PRESETS = [
  { value: '0', label: 'Due day (0 days before)' },
  { value: '1', label: '1 day before due' },
  { value: '2', label: '2 days before due' },
  { value: '3', label: '3 days before due' },
  { value: '7', label: '7 days before due' },
  { value: '14', label: '14 days before due' },
  { value: 'custom', label: 'Custom days…' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const label =
    hour === 0
      ? '12:00 AM'
      : hour < 12
        ? `${hour}:00 AM`
        : hour === 12
          ? '12:00 PM'
          : `${hour - 12}:00 PM`;
  return { value: String(hour), label };
});

const formatRemindDate = (value) => {
  if (!value) return '—';
  const str = String(value).slice(0, 10);
  const [y, m, d] = str.split('-');
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
};

const offsetLabel = (days) => {
  const n = Number(days);
  if (n === 0) return 'due day';
  if (n === 1) return '1 day before due';
  return `${n} days before due`;
};

const TaskDueRemindersPanel = ({ taskId, dueDate, isAssignee, disabled }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offsetPreset, setOffsetPreset] = useState('1');
  const [customOffsetDays, setCustomOffsetDays] = useState('');
  const [remindAtHour, setRemindAtHour] = useState('10');

  const hasDueDate = Boolean(dueDate);

  const loadReminders = useCallback(async () => {
    if (!taskId || !isAssignee) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tasks/${taskId}/due-reminders`);
      setReminders(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [taskId, isAssignee]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const resolvedOffsetDays = useMemo(() => {
    if (offsetPreset === 'custom') {
      const n = parseInt(customOffsetDays, 10);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }
    return parseInt(offsetPreset, 10);
  }, [offsetPreset, customOffsetDays]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!hasDueDate) {
      toast.error('Set a due date on this task first.');
      return;
    }
    if (resolvedOffsetDays === null) {
      toast.error('Enter a valid number of days (0 or more).');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post(`/tasks/${taskId}/due-reminders`, {
        offset_days: resolvedOffsetDays,
        remind_at_hour: parseInt(remindAtHour, 10),
      });
      toast.success('Reminder added.');
      setOffsetPreset('1');
      setCustomOffsetDays('');
      await loadReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reminderId) => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}/due-reminders/${reminderId}`);
      toast.success('Reminder removed.');
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove reminder');
    }
  };

  if (!isAssignee) {
    return null;
  }

  return (
    <div className="view-section task-due-reminders-panel">
      <h3 className="view-section-title">
        <span>⏰</span> Due date email reminders
      </h3>
      <p className="task-due-reminders-note">
        Emails are sent on the scheduled day and hour (<strong>Asia/Karachi</strong>).
        Each reminder is sent once, then removed.
      </p>

      {!hasDueDate && (
        <div className="task-due-reminders-empty">
          Add a due date to this task before setting reminders.
        </div>
      )}

      {hasDueDate && (
        <form onSubmit={handleAdd} className="task-due-reminders-form">
          <div className="task-due-reminders-form-row">
            <FormSelect
              label="When"
              name="offset_preset"
              value={offsetPreset}
              onChange={(e) => setOffsetPreset(e.target.value)}
              options={OFFSET_PRESETS}
              disabled={disabled || saving}
            />
            {offsetPreset === 'custom' && (
              <FormInput
                label="Days before due"
                name="custom_offset_days"
                type="number"
                min={0}
                value={customOffsetDays}
                onChange={(e) => setCustomOffsetDays(e.target.value)}
                disabled={disabled || saving}
                placeholder="e.g. 5"
              />
            )}
            <FormSelect
              label="Time (PKT)"
              name="remind_at_hour"
              value={remindAtHour}
              onChange={(e) => setRemindAtHour(e.target.value)}
              options={HOUR_OPTIONS}
              disabled={disabled || saving}
            />
          </div>
          <div className="form-actions">
            <PrimaryButton
              type="submit"
              disabled={disabled || saving || !hasDueDate}
              loading={saving}
              loadingText="Adding..."
            >
              Add reminder
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="task-due-reminders-list-wrap">
        {loading && <p className="task-due-reminders-muted">Loading reminders…</p>}
        {!loading && reminders.length === 0 && (
          <p className="task-due-reminders-muted">No reminders scheduled yet.</p>
        )}
        {!loading && reminders.length > 0 && (
          <ul className="task-due-reminders-list">
            {reminders.map((r) => {
              const hourOpt = HOUR_OPTIONS.find(
                (o) => o.value === String(r.remind_at_hour),
              );
              return (
                <li key={r.id} className="task-due-reminder-item">
                  <div className="task-due-reminder-item__main">
                    <span className="task-due-reminder-item__when">
                      {formatRemindDate(r.remind_on_date)} at{' '}
                      {hourOpt?.label || `${r.remind_at_hour}:00`}
                    </span>
                    <span className="task-due-reminder-item__meta">
                      {offsetLabel(r.offset_days)}
                    </span>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      className="task-due-reminder-item__remove"
                      onClick={() => handleDelete(r.id)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskDueRemindersPanel;
