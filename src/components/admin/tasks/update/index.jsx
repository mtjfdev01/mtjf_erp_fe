import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { splitDescriptionAndMov, encodeMovIntoDescription } from '../../../../utils/movEncoding';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import '../../../../styles/variables.css';
import './index.css';

const UpdateTask = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { permissions } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    priority: '',
    status: '',
    workflow_type: '',
    task_type: '',
    recurrence_frequency: '',
    custom_recurrence_days: '',
    start_date: '',
    due_date: '',
    project_id: '',
    project_name: '',
    recurrence_rule: '',
    recurrence_next_date: '',
    recurrence_end_type: 'never',
    recurrence_end_date: '',
    recurrence_end_occurrences: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalStatus, setOriginalStatus] = useState('');
  const [originalWorkflowType, setOriginalWorkflowType] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUserDepartments, setAssignedUserDepartments] = useState({});
  const [reportedByUsers, setReportedByUsers] = useState([]);
  const [approverUsers, setApproverUsers] = useState([]);
  const [movItems, setMovItems] = useState(['']);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [showAttachment, setShowAttachment] = useState(false);
  const [showAttachmentTrigger, setShowAttachmentTrigger] = useState(false);

  const formatDepartment = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  const projectOptions = useMemo(() => {
    const base = [
      'General',
      'Health',
      'Education',
      'Clean Water',
      'Apna Ghar',
      'Disaster Relief',
      'KASB Skill Development',
      'Seeds of Change',
      'Qurbani Barai Mustehqeen',
      'Aaslab',
      'Community Service'
    ];
    const options = base.map((p) => ({ value: p, label: p }));
    if (form.project_name && !base.includes(form.project_name)) {
      return [{ value: form.project_name, label: form.project_name }, ...options];
    }
    return options;
  }, [form.project_name]);

  const taskPerms = useMemo(() => getTaskPermissions(permissions || {}), [permissions]);
  const multiSelectParams = useMemo(() => ({ active: true }), []);
  const canEditCompleted = taskPerms.canEditCompleted === true;
  
  const editTitle =
    String(form.status).toLowerCase() === 'completed' && !canEditCompleted
      ? 'Your role cannot edit completed tasks'
      : 'Save Changes';

  const handleMovChange = (index, value) => {
    setMovItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleMovAdd = () => {
    setMovItems((prev) => [...prev, '']);
  };

  const handleMovRemove = (index) => {
    setMovItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-calculate due date based on recurrence frequency
  const calculateDueDate = (startDate, frequency) => {
    if (!startDate || !frequency) return '';
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '';
    
    const dueDate = new Date(start);
    
    switch (frequency) {
      case 'daily':
        dueDate.setDate(dueDate.getDate() + 1);
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      case 'quarterly':
        dueDate.setMonth(dueDate.getMonth() + 3);
        break;
      case 'annually':
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
      case 'other':
        // For custom days, add the custom_recurrence_days
        const customDays = parseInt(form.custom_recurrence_days) || 1;
        dueDate.setDate(dueDate.getDate() + customDays);
        break;
      default:
        return '';
    }
    
    // Format as YYYY-MM-DD
    return dueDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const t = res.data.data;
        const { baseDescription, movItems: movFromDescription } = splitDescriptionAndMov(
          t.description || '',
        );
        setForm({
          title: t.title || '',
          description: baseDescription || '',
          department: t.department || '',
          priority: t.priority || '',
          status: t.status || '',
          workflow_type: t.workflow_type || '',
          task_type: t.task_type || '',
          start_date: t.start_date ? t.start_date.slice(0, 10) : '',
          due_date: t.due_date ? t.due_date.slice(0, 10) : '',
          project_id: t.project_id || '',
          project_name: t.project_name || '',
          recurrence_rule: t.recurrence_rule || '',
          recurrence_next_date: t.recurrence_next_date ? t.recurrence_next_date.slice(0, 10) : '',
          recurrence_frequency: [
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'annually'
          ].includes(t.recurrence_rule)
            ? t.recurrence_rule
            : t.recurrence_rule ? 'other' : '',
          custom_recurrence_days: t.recurrence_rule && ![
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'annually'
          ].includes(t.recurrence_rule)
            ? t.recurrence_rule.replace(' days', '')
            : '',
          recurrence_end_type: t.recurrence_end_type || 'never',
          recurrence_end_date: t.recurrence_end_date ? t.recurrence_end_date.slice(0, 10) : '',
          recurrence_end_occurrences: t.recurrence_end_occurrences || ''
        });
        const existingMovItems = Array.isArray(t.mov_items)
          ? t.mov_items
              .map((text) => String(text || '').trim())
              .filter((text) => text.length > 0)
          : [];
        const combinedMovItems =
          existingMovItems.length > 0
            ? existingMovItems
            : movFromDescription && movFromDescription.length > 0
            ? movFromDescription
            : [];
        setMovItems(combinedMovItems.length > 0 ? combinedMovItems : ['']);

        const idsFromAssigned = Array.isArray(t.assigned_user_ids)
          ? t.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromMeta = Array.isArray(t.assigned_users_meta)
          ? t.assigned_users_meta
              .map((m) => (m && m.user_id ? m.user_id : null))
              .filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromApprovers = Array.isArray(t.approval_required_user_ids)
          ? t.approval_required_user_ids.filter(
              (n) => Number.isInteger(Number(n)) && Number(n) > 0
            )
          : [];
        const uniqueIds = Array.from(
          new Set([
            ...(idsFromAssigned || []),
            ...(idsFromMeta || []),
            ...idsFromApprovers
          ])
        );

        const deptMap = {};
        if (Array.isArray(t.assigned_users_meta)) {
          t.assigned_users_meta.forEach((m) => {
            if (m && m.user_id) deptMap[m.user_id] = m.department;
          });
        }
        setAssignedUserDepartments(deptMap);

        if (uniqueIds.length > 0) {
          try {
            const query = uniqueIds
              .map((idVal) => `ids=${encodeURIComponent(idVal)}`)
              .join('&');
            const byIds = await axiosInstance.get(
              `/users/by-ids${query ? `?${query}` : ''}`
            );
            const usersArray = Array.isArray(byIds.data) ? byIds.data : [];
            const assignedSet = new Set(idsFromAssigned.map((v) => Number(v)));
            setAssignedUsers(
              usersArray.filter((u) => assignedSet.has(Number(u.id)))
            );
            const approverSet = new Set(
              idsFromApprovers.map((v) => Number(v))
            );
            setApproverUsers(
              usersArray.filter((u) => approverSet.has(Number(u.id)))
            );
          } catch {
            setAssignedUsers(idsFromAssigned.map((idVal) => ({ id: idVal })));
            setApproverUsers(
              idsFromApprovers.map((idVal) => ({ id: Number(idVal) }))
            );
          }
        } else {
          setAssignedUsers([]);
        }

        if (t.reported_by) {
          setReportedByUsers([t.reported_by]);
        } else {
          setReportedByUsers([]);
        }
        setOriginalStatus(t.status || '');
        setOriginalWorkflowType(t.workflow_type || 'standard');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load task.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const statusOptions = useMemo(() => {
    const s = originalStatus;
    const w = originalWorkflowType;
    let allowed = [];

    switch (s) {
      case 'draft':
        allowed = ['open'];
        break;
      case 'open':
        allowed = ['in_progress', 'cancelled'];
        break;
      case 'in_progress':
        allowed = ['completed', 'cancelled'];
        break;
      case 'completed':
        allowed =
          w === 'approval_required'
            ? ['pending_approval', 'in_progress']
            : ['closed', 'in_progress'];
        break;
      case 'pending_approval':
        allowed = ['approved', 'rejected', 'closed', 'in_progress'];
        break;
      case 'approved':
        allowed = ['closed'];
        break;
      case 'rejected':
        allowed = ['in_progress', 'cancelled'];
        break;
      case 'closed':
      case 'cancelled':
        allowed = ['open'];
        break;
      default:
        allowed = [];
    }
    if (!allowed.includes(s) && s) allowed.push(s);
    return allowed.map((status) => ({
      value: status,
      label: status
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ')
    }));
  }, [originalStatus, originalWorkflowType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      
      // Auto-calculate due date when start_date or recurrence_frequency changes
      if ((name === 'start_date' || name === 'recurrence_frequency') && prev.task_type === 'recurring') {
        const startDate = name === 'start_date' ? value : prev.start_date;
        const frequency = name === 'recurrence_frequency' ? value : prev.recurrence_frequency;
        const calculatedDueDate = calculateDueDate(startDate, frequency);
        if (calculatedDueDate) {
          next.due_date = calculatedDueDate;
        }
      }
      
      if (name === 'custom_recurrence_days') {
        next.recurrence_rule = value ? `${value} days` : '';
      }
      return next;
    });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      
      // Auto-calculate due date when recurrence_frequency changes
      if (name === 'recurrence_frequency' && prev.task_type === 'recurring') {
        const calculatedDueDate = calculateDueDate(prev.start_date, value);
        if (calculatedDueDate) {
          next.due_date = calculatedDueDate;
        }
      }
      
      if (name === 'recurrence_frequency') {
        if (value === 'other') {
          next.recurrence_rule = next.custom_recurrence_days ? `${next.custom_recurrence_days} days` : '';
        } else {
          next.recurrence_rule = value || '';
          next.custom_recurrence_days = '';
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const movItemsClean = Array.isArray(movItems)
        ? movItems
            .map((text) => String(text || '').trim())
            .filter((text) => text.length > 0)
        : [];
      if (movItemsClean.length === 0) {
        const msg =
          'At least one Means of Verification (MOV) item is required for every task.';
        setError(msg);
        toast.error(msg);
        setSaving(false);
        return;
      }
      const descriptionWithMov = encodeMovIntoDescription(
        form.description,
        movItemsClean,
      );
      const payload = {
        title: form.title || undefined,
        description: descriptionWithMov || undefined,
        priority: form.priority || undefined,
        status: form.status || undefined,
        workflow_type: form.workflow_type || undefined,
        task_type: form.task_type || undefined,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        project_name: form.project_name || undefined,
        assigned_users: assignedUsers && assignedUsers.length > 0
          ? assignedUsers.map((u) => u.id)
          : undefined,
        assigned_users_meta:
          assignedUsers && assignedUsers.length > 0
            ? assignedUsers.map((u) => ({
                user_id: u.id,
                department:
                  assignedUserDepartments[u.id] ||
                  form.department ||
                  'admin'
              }))
            : undefined,
        approval_required_user_ids:
          approverUsers && approverUsers.length > 0
            ? approverUsers.map((u) => u.id)
            : undefined,
        reported_by_id:
          Array.isArray(reportedByUsers) && reportedByUsers.length > 0
            ? reportedByUsers[0].id
            : undefined,
        recurrence_rule:
          form.task_type === 'recurring' ? form.recurrence_rule || undefined : undefined,
        recurrence_next_date:
          form.task_type === 'recurring' ? form.recurrence_next_date || undefined : undefined,
        recurrence_end_type: form.recurrence_end_type || undefined,
        recurrence_end_date: form.recurrence_end_date || undefined,
        recurrence_end_occurrences: form.recurrence_end_occurrences ? parseInt(form.recurrence_end_occurrences) : undefined,
        mov_items: movItemsClean
      };
      await axiosInstance.patch(`/tasks/${id}`, payload);
      toast.success('Task updated. Email notification will be sent if configured.');

      if (showAttachment && attachmentFile) {
        try {
          const formData = new FormData();
          formData.append('file', attachmentFile);
          formData.append('is_initial', 'true');
          if (attachmentDescription) {
            formData.append('description', attachmentDescription);
          }
          await axiosInstance.post(
            `/tasks/${id}/attachments/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          toast.success('Attachment uploaded successfully.');
        } catch (attErr) {
          console.error('Attachment upload error:', attErr);
          toast.error('Task updated, but failed to upload attachment.');
        }
      }

      navigate(`/admin/tasks/view/${id}`);
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to update task.');
      toast.error(e2.response?.data?.message || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="add-task-page">
          <div className="add-task-card">
            <PageHeader title="Update Task" showBackButton={true} />
            <div className="status-message">Loading task...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="add-task-page">
        <div className="add-task-card">
          <PageHeader title="Update Task" showBackButton={true} />
          {error && <div className="status-message status-message--error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="add-task-section">
              <div className="add-task-section-title">1. Basic Details</div>
              <div className="add-task-grid-2">
                <FormInput
                  name="title"
                  label="Title"
                  value={form.title}
                  onChange={handleChange}
                />
                <FormSelect
                  name="project_name"
                  label="Project"
                  value={form.project_name}
                  onChange={handleChange}
                  showDefaultOption
                  options={projectOptions}
                />
              </div>
              <div className="add-task-grid-1">
                <FormTextarea
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">2. Means of Verification (MOV)</div>
              <div className="add-task-grid-1">
                {movItems.map((value, index) => (
                  <div key={index} className="mov-item-row">
                    <FormInput
                      name={`mov_item_${index}`}
                      label={index === 0 ? 'MOV item' : ''}
                      value={value}
                      onChange={(e) => handleMovChange(index, e.target.value)}
                      placeholder="Define a clear, specific, and measurable verification point"
                    />
                    {movItems.length > 1 && (
                      <button
                        type="button"
                        className="mov-item-remove-button"
                        onClick={() => handleMovRemove(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <div className="mov-hint">
                  MOV items should be clear and measurable.
                </div>
                <div className="mov-actions">
                  <button
                    type="button"
                    className="mov-item-add-button"
                    onClick={handleMovAdd}
                  >
                    + Add MOV item
                  </button>
                </div>
              </div>
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">3. Task Configuration</div>
              <div className="add-task-grid-2">
                <FormSelect
                  name="status"
                  label="Status"
                  value={form.status}
                  onChange={handleChange}
                  options={statusOptions}
                />
                <FormSelect
                  name="priority"
                  label="Priority"
                  value={form.priority}
                  onChange={handleChange}
                  options={['low', 'medium', 'high', 'critical'].map((p) => ({
                    value: p,
                    label: p[0].toUpperCase() + p.slice(1)
                  }))}
                />
                <FormSelect
                  name="task_type"
                  label="Task Type"
                  value={form.task_type}
                  onChange={handleChange}
                  options={[
                    { value: 'one_time', label: 'One-time task' },
                    { value: 'recurring', label: 'Recurring task' },
                    { value: 'project_linked', label: 'Project-linked task' }
                  ]}
                />
                <FormSelect
                  name="workflow_type"
                  label="Workflow Type"
                  value={form.workflow_type}
                  onChange={handleChange}
                  options={['standard', 'approval_required'].map((w) => ({
                    value: w,
                    label: w
                      .split('_')
                      .map((x) => x[0].toUpperCase() + x.slice(1))
                      .join(' ')
                  }))}
                />
              </div>
              {form.workflow_type === 'approval_required' && (
                <div className="add-task-grid-1" style={{ marginTop: '1rem' }}>
                  <SearchableMultiSelect
                    label="Approvers"
                    apiEndpoint="/users/options"
                    apiParams={multiSelectParams}
                    onSelect={(users) => setApproverUsers(users)}
                    onClear={() => setApproverUsers([])}
                    value={approverUsers}
                    displayKey="first_name"
                    valueKey="id"
                    allowResearch={true}
                    debounceDelay={500}
                    minSearchLength={2}
                    renderOption={(user) => (
                      <div className="assign-user-option">
                        <div className="assign-user-name">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="assign-user-email">
                          {user.email}
                        </div>
                        {user.department && (
                          <div className="assign-user-meta">
                            {user.department} • {user.role || 'User'}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">4. Assignment</div>
              <div className="add-task-grid-1">
                <SearchableMultiSelect
                  label="Assign Users"
                  apiEndpoint="/users/options"
                  apiParams={multiSelectParams}
                  onSelect={(users) => setAssignedUsers(users)}
                  onClear={() => setAssignedUsers([])}
                  value={assignedUsers}
                  displayKey="first_name"
                  valueKey="id"
                  allowResearch={true}
                  debounceDelay={500}
                  minSearchLength={2}
                  renderOption={(user) => (
                    <div className="assign-user-option">
                      <div className="assign-user-name">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="assign-user-email">{user.email}</div>
                      {user.department && (
                        <div className="assign-user-meta">
                          {user.department} • {user.role || 'User'}
                        </div>
                      )}
                    </div>
                  )}
                />
                {assignedUsers.length > 0 && (
                  <div className="assign-users-hint">
                    {'\u2713'} {assignedUsers.length}{' '}
                    {assignedUsers.length === 1 ? 'user selected' : 'users selected'}
                  </div>
                )}
              </div>
              {assignedUsers.length > 0 && (
                <div className="assign-users-summary">
                  <div className="assign-users-summary-label">
                    Selected Assignees:
                  </div>
                  {assignedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="assign-users-row"
                    >
                      <div className="assign-users-row-col">
                        <FormInput
                          name={`user_${u.id}_label`}
                          label=""
                          value={
                            `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                            u.email ||
                            `User #${u.id}`
                          }
                          onChange={() => {}}
                          disabled
                        />
                      </div>
                      <div className="assign-users-row-col">
                        <FormInput
                          name={`dept_${u.id}`}
                          label=""
                          value={formatDepartment(
                            assignedUserDepartments[u.id] ||
                              u.department ||
                              form.department ||
                              ''
                          )}
                          onChange={() => {}}
                          disabled
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">5. Schedule & Recurrence</div>
              <div className="add-task-grid-2">
                <FormInput
                  name="start_date"
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                />
                <FormInput
                  name="due_date"
                  label={form.task_type === 'recurring' ? 'Due Date (of first task) - Auto-calculated' : 'Due Date'}
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  disabled={form.task_type === 'recurring' && form.recurrence_frequency}
                  placeholder={form.task_type === 'recurring' ? 'Select frequency to auto-calculate' : undefined}
                />
              </div>
              {form.task_type === 'recurring' && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                  <div className="add-task-grid-2">
                    <FormSelect
                      name="recurrence_frequency"
                      label="Recurring Frequency"
                      value={form.recurrence_frequency}
                      onChange={handleSelectChange}
                      showDefaultOption
                      options={['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'other'].map(
                        (f) => ({
                          value: f,
                          label: f[0].toUpperCase() + f.slice(1)
                        })
                      )}
                    />
                    {form.recurrence_frequency === 'other' && (
                      <FormInput
                        name="custom_recurrence_days"
                        label="Custom Recurrence Days"
                        type="number"
                        min="1"
                        value={form.custom_recurrence_days}
                        onChange={handleChange}
                        placeholder="Enter number of days"
                        required
                      />
                    )}
                  </div>
                  <div className="recurrence-end-section" style={{ marginTop: '1rem' }}>
                    <div className="form-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>END CONDITION</div>
                    <div className="add-task-grid-2">
                      <FormSelect
                        name="recurrence_end_type"
                        label="End After"
                        value={form.recurrence_end_type}
                        onChange={handleSelectChange}
                        options={[
                          { value: 'never', label: 'Indefinitely (No end date)' },
                          { value: 'on_date', label: 'On specific date' },
                          { value: 'after_occurrences', label: 'After number of occurrences' }
                        ]}
                      />
                      {form.recurrence_end_type === 'on_date' && (
                        <FormInput
                          name="recurrence_end_date"
                          label="End Date"
                          type="date"
                          value={form.recurrence_end_date}
                          onChange={handleChange}
                          required
                        />
                      )}
                      {form.recurrence_end_type === 'after_occurrences' && (
                        <FormInput
                          name="recurrence_end_occurrences"
                          label="Number of Occurrences"
                          type="number"
                          min="1"
                          value={form.recurrence_end_occurrences}
                          onChange={handleChange}
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">6. Attachments</div>
              <div className="add-task-attachment-toggle">
                {!showAttachmentTrigger ? (
                  <div
                    className="attachment-prompt-wrapper"
                    onClick={() => setShowAttachmentTrigger(true)}
                  >
                    <span className="attachment-prompt-icon">📎</span>
                    <span className="attachment-prompt-text">
                      Click here if you want to add an attachment
                    </span>
                  </div>
                ) : (
                  <div className="add-task-grid-1">
                    <button
                      type="button"
                      className="mov-item-add-button"
                      style={{ width: 'fit-content', marginBottom: '1rem' }}
                      onClick={() => {
                        if (showAttachment) {
                          setAttachmentFile(null);
                          setAttachmentDescription('');
                        }
                        setShowAttachment(!showAttachment);
                      }}
                    >
                      {showAttachment ? '- Remove Attachment' : '+ Add Attachment'}
                    </button>
                    
                    {showAttachment && (
                      <div className="add-task-grid-2">
                        <div className="form-group">
                          <label className="form-label">File</label>
                          <input
                            type="file"
                            className="form-input"
                            onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                          />
                        </div>
                        <FormInput
                          name="attachmentDescription"
                          label="Attachment Description"
                          value={attachmentDescription}
                          onChange={(e) => setAttachmentDescription(e.target.value)}
                          placeholder="Optional notes about this file"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="add-task-footer">
              <button
                className="add-task-submit primary-button"
                type="submit"
                disabled={saving || (String(form.status).toLowerCase() === 'completed' && !canEditCompleted)}
                title={editTitle}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateTask;
