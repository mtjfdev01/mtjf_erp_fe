import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import PrimaryButton from '../../../common/buttons/primary';
import FormInput from '../../../common/FormInput';
import './TaskDueRemindersPanel.css';

const formatRemindDate = (value) => {
  if (!value) return '—';
  const str = String(value).slice(0, 10);
  const [y, m, d] = str.split('-');
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
};

const formatHourLabel = (hour) => {
  const h = Number(hour);
  if (!Number.isFinite(h)) return '—';
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
};

const parseTimeHour = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const [hourPart] = timeValue.split(':');
  const hour = parseInt(hourPart, 10);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return hour;
};

const defaultRemindDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const TaskDueRemindersPanel = ({ taskId, dueDate, isAssignee, disabled }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [remindOnDate, setRemindOnDate] = useState(defaultRemindDate);
  const [remindAtTime, setRemindAtTime] = useState('10:00');

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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!hasDueDate) {
      toast.error('Set a due date on this task first.');
      return;
    }
    if (!remindOnDate) {
      toast.error('Select a reminder date.');
      return;
    }
    const hour = parseTimeHour(remindAtTime);
    if (hour === null) {
      toast.error('Select a valid reminder time.');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post(`/tasks/${taskId}/due-reminders`, {
        remind_on_date: remindOnDate,
        remind_at_hour: hour,
      });
      toast.success('Reminder added.');
      setRemindOnDate(defaultRemindDate());
      setRemindAtTime('10:00');
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
    <section className="task-due-reminders-panel task-due-reminders-panel--card">
      <h3 className="task-due-reminders-panel__title">Email reminder (PKT)</h3>

      {!hasDueDate && (
        <div className="task-due-reminders-panel__empty">
          Add a due date to this task before setting reminders.
        </div>
      )}

      {hasDueDate && (
        <form onSubmit={handleAdd} className="task-due-reminders-panel__form">
          <div className="task-due-reminders-panel__fields">
            <FormInput
              label=""
              name="remind_on_date"
              type="date"
              value={remindOnDate}
              onChange={(e) => setRemindOnDate(e.target.value)}
              disabled={disabled || saving}
              aria-label="Reminder date"
              required
            />
            <FormInput
              label=""
              name="remind_at_time"
              type="time"
              value={remindAtTime}
              onChange={(e) => setRemindAtTime(e.target.value)}
              disabled={disabled || saving}
              aria-label="Reminder time (PKT)"
              required
            />
          </div>
          <div className="task-due-reminders-panel__actions">
            <PrimaryButton
              className="task-due-reminders-panel__submit"
              type="submit"
              disabled={disabled || saving || !hasDueDate}
              loading={saving}
              loadingText="Adding..."
            >
              Set reminder
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="task-due-reminders-panel__list-wrap">
        {loading && <p className="task-due-reminders-panel__muted">Loading reminders…</p>}
        {!loading && reminders.length > 0 && (
          <ul className="task-due-reminders-panel__list">
            {reminders.map((r) => (
              <li key={r.id} className="task-due-reminders-panel__item">
                <div className="task-due-reminders-panel__item-main">
                  <span className="task-due-reminders-panel__item-when">
                    {formatRemindDate(r.remind_on_date)} at{' '}
                    {formatHourLabel(r.remind_at_hour)}
                  </span>
                  <span className="task-due-reminders-panel__item-meta">
                    Scheduled email reminder
                  </span>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="task-due-reminders-panel__remove"
                    onClick={() => handleDelete(r.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TaskDueRemindersPanel;
