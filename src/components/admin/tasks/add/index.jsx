import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import SearchableMultiSelect from '../../../common/searchablemultiselect';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { encodeMovIntoDescription } from '../../../../utils/movEncoding';
import '../../../../styles/variables.css';
import './index.css';

const AddTask = () => {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: user?.department || '',
    priority: 'medium',
    workflow_type: 'standard',
    task_type: 'one_time',
    recurrence_frequency: '',
    start_date: '',
    due_date: '',
    project_name: '',
    recurrence_rule: '',
    recurrence_next_date: '',
    approval_required: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUserDepartments, setAssignedUserDepartments] = useState({});
  const [reportedByUsers, setReportedByUsers] = useState([]);
  const [approverUsers, setApproverUsers] = useState([]);
  const [movItems, setMovItems] = useState(['']);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  const projectOptions = [
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
  const multiSelectParams = useMemo(() => ({ active: true }), []);
  const createTitle = taskPerms.canCreate ? 'Create Task' : 'You do not have permission to create tasks';
  const userDisplayName = (u) => {
    const name = `${u?.first_name || ''} ${u?.last_name || ''}`.trim();
    return name || u?.email || '';
  };
  const formatDepartment = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const syncFromTaskType = (next) => {
    const tt = next.task_type;
    const freq = next.recurrence_frequency;
    let wt = next.workflow_type;
    let rr = next.recurrence_rule;
    if (tt === 'approval_based') wt = 'approval_required';
    if (tt === 'one_time' || tt === 'project_linked') {
      wt = 'standard';
      rr = '';
    }
    if (tt === 'recurring') {
      wt = 'standard';
      rr = freq || '';
    }
    setForm((prev) => ({ ...prev, workflow_type: wt, recurrence_rule: rr }));
  };
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (name === 'task_type' || name === 'recurrence_frequency') {
      syncFromTaskType(next);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const department = user?.department || form.department || 'admin';
    const validationErrors = [];
    if (!form.title || !form.title.trim()) {
      validationErrors.push('Task title is required.');
    }
    if (!form.description || !form.description.trim()) {
      validationErrors.push('Description is required.');
    }
    if (!department) {
      validationErrors.push('Department is required.');
    }
    if (!form.task_type) {
      validationErrors.push('Task type is required.');
    }
    if (!form.workflow_type) {
      validationErrors.push('Workflow type is required.');
    }
    if (!form.priority) {
      validationErrors.push('Priority is required.');
    }
    if (!form.start_date) {
      validationErrors.push('Start date is required.');
    }
    if (!form.due_date) {
      validationErrors.push('Due date is required.');
    }
    if (!assignedUsers || assignedUsers.length === 0) {
      validationErrors.push('At least one assignee is required.');
    }
    const movItemsCleanForValidation = Array.isArray(movItems)
      ? movItems
          .map((text) => String(text || '').trim())
          .filter((text) => text.length > 0)
      : [];
    if (movItemsCleanForValidation.length === 0) {
      validationErrors.push(
        'At least one Means of Verification (MOV) item is required for every task.'
      );
    }
    if (form.workflow_type === 'approval_required') {
      if (!approverUsers || approverUsers.length === 0) {
        validationErrors.push('At least one approver is required for approval-required tasks.');
      }
    }
    if (form.task_type === 'recurring') {
      if (!form.recurrence_frequency) {
        validationErrors.push('Recurring frequency is required for recurring tasks.');
      }
      if (!form.recurrence_next_date) {
        validationErrors.push('Recurrence next date is required for recurring tasks.');
      }
    }
    if (validationErrors.length > 0) {
      const msg = validationErrors.join(' ');
      setError(msg);
      toast.error(msg);
      return;
    }
    const start = Date.now();
    setSubmitting(true);
    let createdTaskId = null;
    try {
      const movItemsClean = movItemsCleanForValidation;
      const descriptionWithMov = encodeMovIntoDescription(
        form.description,
        movItemsClean,
      );
      const payload = {
        title: form.title,
        description: descriptionWithMov || undefined,
        department,
        priority: form.priority || undefined,
        workflow_type: form.workflow_type || undefined,
        task_type: form.task_type || undefined,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        assigned_users:
          assignedUsers && assignedUsers.length > 0
            ? assignedUsers.map((u) => u.id)
            : undefined,
        assigned_users_meta:
          assignedUsers && assignedUsers.length > 0
            ? assignedUsers.map((u) => ({
                user_id: u.id,
                department:
                  assignedUserDepartments[u.id] ||
                  u.department ||
                  department ||
                  'admin'
              }))
            : undefined,
        reported_by_id:
          Array.isArray(reportedByUsers) && reportedByUsers.length > 0
            ? reportedByUsers[0].id
            : undefined,
        project_name: form.project_name || undefined,
        recurrence_rule: form.recurrence_rule || undefined,
        recurrence_next_date: form.recurrence_next_date || undefined,
        approval_required: !!form.approval_required,
        approval_required_user_ids:
          approverUsers && approverUsers.length > 0
            ? approverUsers.map((u) => u.id)
            : undefined,
        mov_items: movItemsClean
      };
      const res = await axiosInstance.post('/tasks', payload);
      createdTaskId = res?.data?.data?.id;
      toast.success('Task created. Assignment emails will send if configured.');
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to create task.');
      toast.error(e2.response?.data?.message || 'Failed to create task.');
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 4000 - elapsed));
      }
      setSubmitting(false);
      if (createdTaskId) {
        const dept = department;
        const viewBase = {
          program: '/program/tasks/view',
          store: '/store/tasks/view',
          procurements: '/procurements/tasks/view',
          accounts_and_finance: '/accounts_and_finance/tasks/view',
          fund_raising: '/fund_raising/tasks/view',
          admin: '/admin/tasks/view'
        }[dept] || '/admin/tasks/view';
        navigate(`${viewBase}/${createdTaskId}`);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="add-task-page">
        <div className="add-task-card">
          <PageHeader title="Add Task" showBackButton={true} />
          {error && <div className="status-message status-message--error">{error}</div>}
          {submitting && (
            <div className="add-task-submitting-overlay">
              Creating task, please wait...
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="add-task-section">
              <div className="add-task-section-title">Basic Details</div>
              <div className="add-task-grid-2">
                <FormInput name="title" label="Task title" value={form.title} onChange={handleChange} required />
                <FormSelect
                  name="project_name"
                  label="Project"
                  value={form.project_name}
                  onChange={handleSelectChange}
                  showDefaultOption
                  options={projectOptions.map((p) => ({ value: p, label: p }))}
                />
              </div>
              <div className="add-task-grid-1">
                <FormTextarea
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">Means of Verification (MOV)</div>
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
              <div className="add-task-section-title">Assignment</div>
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
                    Assignee:
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
                          value={userDisplayName(u)}
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
                              user?.department ||
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
              <div className="add-task-section-title">Task Settings</div>
              <div className="add-task-grid-2">
                <FormSelect
                  name="task_type"
                  label="Task Type"
                  value={form.task_type}
                  onChange={handleSelectChange}
                  options={[
                    { value: 'one_time', label: 'One-time task' },
                    { value: 'recurring', label: 'Recurring task' },
                    { value: 'project_linked', label: 'Project-linked task' }
                  ]}
                  required
                />
                <FormSelect
                  name="workflow_type"
                  label="Workflow Type"
                  value={form.workflow_type}
                  onChange={handleSelectChange}
                  options={['standard', 'approval_required'].map((w) => ({
                    value: w,
                    label: w
                      .split('_')
                      .map((x) => x[0].toUpperCase() + x.slice(1))
                      .join(' ')
                  }))}
                  required
                />
              </div>
              {form.workflow_type === 'approval_required' && (
                <div className="add-task-grid-1">
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
              {form.task_type === 'recurring' && (
                <div className="add-task-grid-2">
                  <FormSelect
                    name="recurrence_frequency"
                    label="Recurring Frequency"
                    value={form.recurrence_frequency}
                    onChange={handleSelectChange}
                    showDefaultOption
                    options={['daily', 'weekly', 'monthly', 'quarterly', 'annually'].map(
                      (f) => ({
                        value: f,
                        label: f[0].toUpperCase() + f.slice(1)
                      })
                    )}
                    required
                  />
                  <FormInput
                    name="recurrence_next_date"
                    label="Recurrence Next Date"
                    type="date"
                    value={form.recurrence_next_date}
                    onChange={handleChange}
                    required
                  />
                  <div className="recurrence-rule-full">
                    <FormInput
                      name="recurrence_rule"
                      label="Recurrence Rule"
                      value={form.recurrence_rule}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">Schedule & Priority</div>
              <div className="add-task-grid-2">
                <FormSelect
                  name="priority"
                  label="Priority"
                  value={form.priority}
                  onChange={handleSelectChange}
                  options={['low', 'medium', 'high', 'critical'].map((p) => ({
                    value: p,
                    label: p[0].toUpperCase() + p.slice(1)
                  }))}
                  required
                />
              </div>
              <div className="add-task-grid-2">
                <FormInput
                  name="start_date"
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  name="due_date"
                  label="Due Date"
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="add-task-footer">
              <button
                className="add-task-submit primary-button"
                type="submit"
                disabled={submitting || !taskPerms.canCreate}
                title={createTitle}
              >
                {submitting ? 'Submitting....' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTask;
