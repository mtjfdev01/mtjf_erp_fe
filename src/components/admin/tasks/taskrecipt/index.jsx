import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { tasksBasePath } from '../../../../utils/admin';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import './index.css';

const TaskReceipt = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const taskRouteBase = useMemo(() => tasksBasePath(), []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const t = res.data.data;
        setTask(t);
        const idsFromAssigned = Array.isArray(t.assigned_user_ids)
          ? t.assigned_user_ids
              .map((v) => Number(v))
              .filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromMeta = Array.isArray(t.assigned_users_meta)
          ? t.assigned_users_meta
              .map((m) => Number(m?.user_id))
              .filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromApprovers = Array.isArray(t.approval_required_user_ids)
          ? t.approval_required_user_ids
              .map((v) => Number(v))
              .filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const uniqueIds = Array.from(
          new Set([...idsFromAssigned, ...idsFromMeta, ...idsFromApprovers]),
        );
        if (uniqueIds.length > 0) {
          try {
            const query = uniqueIds
              .map((idVal) => `ids=${encodeURIComponent(idVal)}`)
              .join('&');
            const byIds = await axiosInstance.get(
              `/users/by-ids${query ? `?${query}` : ''}`,
            );
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

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '-';

  const capitalize = (s) =>
    s
      ? s
          .split('_')
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
          .join(' ')
      : '';

  const formatTaskId = (t) => {
    if (!t) return '-';
    if (t.code) return `#${t.code}`;
    const raw = t.id != null ? String(t.id) : '';
    if (!raw) return '-';
    const padded = raw.padStart(4, '0');
    return `#TASK-${padded}`;
  };

  const getUserDisplayName = (u) => {
    if (!u) return '-';
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (full) return full;
    if (u.email) return u.email;
    if (u.id) return `User #${u.id}`;
    return '-';
  };

  const getDurationLabel = (start, end) => {
    if (!start || !end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return '-';
    }
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / 86400000);
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays - years * 365 - months * 30;
    return `${years} years, ${months} months, ${days} days`;
  };

  const getAttachmentHref = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    const base = axiosInstance.defaults.baseURL || '';
    const normalizedBase = base.replace(/\/$/, '');
    return `${normalizedBase}${fileUrl}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Task receipt"
            showBackButton={true}
          />
          <div className="view-content">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Task receipt"
            showBackButton={true}
          />
          <div className="view-content">
            <div className="status-message status-message--error">
              {error || 'Task not found'}
            </div>
          </div>
        </div>
      </>
    );
  }

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const approvalRequiredIds = Array.isArray(task.approval_required_user_ids)
    ? task.approval_required_user_ids
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];
  const approvers = approvalRequiredIds
    .map((idVal) => usersById[Number(idVal)])
    .filter(Boolean);
  const durationLabel = getDurationLabel(task.start_date, task.completed_date || task.due_date);
  const statusLabel = String(task.status || '')
    .toUpperCase()
    .replace(/_/g, ' ');

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          showBackButton={true}
          backPath={`${taskRouteBase}/view/${task.id}`}
        />
        <div className="view-content">
          <div className="task-receipt-page">
            <div className="task-receipt-container">
              <div className="task-receipt-header">
                <div className="task-receipt-title">
                  <div className="task-receipt-logo">📋</div>
                  <div>
                    <h1>{task.title || 'Task receipt'}</h1>
                  </div>
                </div>
                <div className="task-receipt-id">{formatTaskId(task)}</div>
              </div>

              <div className="task-receipt-status-banner">
                <div>
                  <strong>Task Status:</strong>
                  <span className="task-receipt-status-badge">{statusLabel}</span>
                </div>
                <button className="task-receipt-print-btn" onClick={handlePrint}>
                  🖨️ Print Receipt
                </button>
              </div>

               <div className="task-receipt-section task-receipt-section-desc">
                  <div className="task-receipt-section-title">
                    <span className="task-receipt-section-icon">📝</span>
                    Description
                  </div>
                  <div className="task-receipt-section-desc-card">
                    <p className="task-receipt-section-desc-text">
                      {task.description || 'No description'}
                    </p>
                  </div>
                </div>

              <div className="task-receipt-body">
                <div className="task-receipt-section">
                  <div className="task-receipt-section-title">
                    <span className="task-receipt-section-icon">📋</span>
                    Task Information
                  </div>
                  <div className="task-receipt-info-grid">
                    <div className="task-receipt-info-card">
                      {/* <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Task Title:</span>
                        <span className="task-receipt-value">{task.title}</span>
                      </div>
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Status:</span>
                        <span className="task-receipt-value">
                          {statusLabel}
                          <span className="badge completed">Status</span>
                        </span>
                      </div> */}
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Priority:</span>
                        <span className="task-receipt-value">
                          {capitalize(task.priority)}
                          <span className="task-receipt-badge task-receipt-priority-medium">
                            Priority
                          </span>
                        </span>
                      </div>
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Task Type:</span>
                        <span className="task-receipt-value">
                          {capitalize(task.task_type) || 'One-time'}
                        </span>
                      </div>
                        <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Workflow:</span>
                        <span className="task-receipt-value">
                          {capitalize(task.workflow_type)}
                        </span>
                      </div>
                    </div>

                    <div className="task-receipt-info-card">
                        <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Created By:</span>
                        <span className="task-receipt-value">
                          {getUserDisplayName(task.created_by)}
                        </span>
                      </div>
                      {/* <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Department:</span>
                        <span className="task-receipt-value">
                          {capitalize(task.department)}
                        </span>
                      </div> */}
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Project/Program:</span>
                        <span className="task-receipt-value">
                          {task.project_name || '-'}
                        </span>
                      </div>
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Approvers:</span>
                        <span className="task-receipt-value">
                          {approvers.length > 0
                            ? approvers.map((u) => getUserDisplayName(u)).join(', ')
                            : '-'}
                        </span>
                      </div>
                    
                    </div>
                  </div>
                </div>

                <div className="task-receipt-section">
                  <div className="task-receipt-section-title">
                    <span className="task-receipt-section-icon">⏰</span>
                    Timeline
                  </div>
                  <div className="task-receipt-info-grid">
                    <div className="task-receipt-info-card">
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Start Date:</span>
                        <span className="task-receipt-value">
                          {formatDate(task.start_date)}
                        </span>
                      </div>
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Due Date:</span>
                        <span className="task-receipt-value">
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Completed Date:</span>
                        <span className="task-receipt-value">
                          {formatDate(task.completed_date)}
                        </span>
                      </div>
                    </div>

                    <div className="task-receipt-info-card">
                      {/* <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Recurrence Rule:</span>
                        <span className="task-receipt-value">
                          {task.recurrence_rule || '-'}
                        </span>
                      </div> */}
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Next Recurrence:</span>
                        <span className="task-receipt-value">
                          {formatDate(task.recurrence_next_date)}
                        </span>
                      </div>
                      <div className="task-receipt-info-row">
                        <span className="task-receipt-label">Duration:</span>
                        <span className="task-receipt-value">{durationLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="task-receipt-section">
                  <div className="task-receipt-section-title">
                    <span className="task-receipt-section-icon">👥</span>
                    Team & Assignment
                  </div>

                  <div className="task-receipt-assignment-block">
                    <h4 className="task-receipt-assignment-title">
                      Assigned To:
                    </h4>
                    <div className="task-receipt-task-receipt-team-members">
                      {assignedUsers.map((u) => {
                        const name = getUserDisplayName(u);
                        const initial = name ? name.charAt(0).toUpperCase() : '?';
                        return (
                          <div key={u.id} className="task-receipt-team-member">
                            <div className="task-receipt-member-avatar">{initial}</div>
                            <div className="task-receipt-member-info">
                              <div className="task-receipt-member-name">{name}</div>
                              <div className="task-receipt-member-email">
                                {u.department || task.department}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {assignedUsers.length === 0 && (
                        <div className="task-receipt-team-member">
                          <div className="task-receipt-member-info">
                            <div className="task-receipt-member-name">No assignees</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-receipt-section">
                  <div className="task-receipt-section-title">
                    <span className="task-receipt-section-icon">📎</span>
                    Attachments
                  </div>
                  <div className="task-receipt-attachments-grid">
                    {attachments.map((a) => {
                      const rawType = a.file_type || '';
                      const shortType = rawType.includes('/')
                        ? rawType.split('/')[1]
                        : rawType;
                      return (
                        <div key={a.id} className="task-receipt-attachment-card">
                          <div className="task-receipt-file-icon">📄</div>
                          <div className="task-receipt-file-name">{a.file_name}</div>
                          <div className="task-receipt-file-type">
                            {shortType || rawType || 'File'}
                          </div>
                          <a
                            href={getAttachmentHref(a.file_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="task-receipt-view-btn"
                          >
                            👁️ VIEW FILE
                          </a>
                        </div>
                      );
                    })}
                    {attachments.length === 0 && (
                      <div className="task-receipt-attachment-card">
                        <div className="task-receipt-file-name">No attachments</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-receipt-section">
                  <div className="task-receipt-section-title">
                    <span className="task-receipt-section-icon">💬</span>
                    Comments & Activity
                  </div>

                  {comments.map((c) => {
                    const hasAuthor = !!c.author;
                    const authorName = hasAuthor
                      ? getUserDisplayName(c.author)
                      : 'System';
                    const initial =
                      authorName && authorName !== 'System'
                        ? authorName.charAt(0).toUpperCase()
                        : 'S';
                    return (
                      <div key={c.id} className="task-receipt-comment">
                        <div className="task-receipt-comment-header">
                          <span className="task-receipt-comment-author">{authorName}</span>
                          <span className="task-receipt-comment-time">
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                        <div className="task-receipt-comment-body">
                          <p>{c.content}</p>
                        </div>
                        <div className="task-receipt-comment-avatar">
                          <span className="task-receipt-member-avatar">{initial}</span>
                        </div>
                      </div>
                    );
                  })}
                  {comments.length === 0 && (
                    <div className="task-receipt-comment">
                      <div className="task-receipt-comment-body">
                        <p>No comments</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="task-receipt-footer">
                <div>MTJ Foundation • Task Management System</div>
                <div className="task-receipt-metadata">
                  <span>Generated: {formatDate(new Date())}</span>
                  <span>User: Task receipt</span>
                  <span>Document ID: {formatTaskId(task)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskReceipt;
