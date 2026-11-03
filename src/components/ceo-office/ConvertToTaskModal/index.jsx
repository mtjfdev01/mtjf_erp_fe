import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaExclamationTriangle, FaFlag, FaUsers } from 'react-icons/fa';
import axios from '../../../utils/axios';
import SearchableMultiSelect from '../../common/SearchableMultiSelect';
import FormInput from '../../common/FormInput';
import MovAssignmentPicker from '../../admin/tasks/shared/MovAssignmentPicker';
import '../../admin/tasks/add/index.css';
import './index.css';

const formatTaskDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const ConvertToTaskModal = ({ 
  isOpen, 
  onClose, 
  convertData, 
  setConvertData, 
  onConvert 
}) => {
  // Local state for user objects and MOV items
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUserDepartments, setAssignedUserDepartments] = useState({});
  const [movItems, setMovItems] = useState([{ text: '', user_id: null }]);
  const hasInitialized = useRef(false); // To track if we've already initialized assignedUsers

  // Sync local state with convertData when modal first opens
  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (convertData.assigned_users && convertData.assigned_users.length > 0) {
        try {
          // Fetch user details for all initial assigned user IDs at once
          const response = await axios.get('/users/by-ids', {
            params: { ids: convertData.assigned_users }
          });
          let users = response.data || [];
          // Add full_name field if not present (since /users/by-ids doesn't return it like /users/options does)
          users = users.map(u => ({
            ...u,
            full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
          }));
          setAssignedUsers(users);
        } catch (err) {
          console.error('Error fetching initial users:', err);
        }
      } else {
        setAssignedUsers([]);
      }
    };
    
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      const initialMovItems = Array.isArray(convertData.mov_items)
        ? convertData.mov_items.map((item, index) => ({
          text: typeof item === 'string' ? item : item?.text || '',
          user_id: convertData.mov_assignments?.find(
            (assignment) => Number(assignment.mov_index) === index,
          )?.user_id ?? (typeof item === 'object' ? item?.user_id : null),
        }))
        : [];
      setMovItems(initialMovItems.length > 0 ? initialMovItems : [{ text: '', user_id: null }]);
      fetchInitialUsers();
    }
  }, [isOpen]); // Only depend on isOpen, not convertData.assigned_users!

  // Reset the initialization ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAssignedUsers([]);
      setAssignedUserDepartments({});
      setMovItems([{ text: '', user_id: null }]);
    }
  }, [isOpen]);

  // Custom search function for assignees
  const searchAssignees = useMemo(() => {
    return async (searchTerm) => {
      try {
        const response = await axios.get('/users/options', {
          params: { search: searchTerm, active: true }
        });
        // /users/options returns the array directly, not wrapped in data
        const users = Array.isArray(response.data) ? response.data : response.data.data || [];
        return users;
      } catch (err) {
        console.error('Search error:', err);
        return [];
      }
    };
  }, []);

  // Helper functions
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

  // Update convertData when users are selected
  const handleSelectUsers = (users) => {
    setAssignedUsers(users);
    setConvertData((previous) => ({
      ...previous,
      assigned_users: users.map((user) => user.id),
      mov_assignments: movItems
        .filter((item) => item.text.trim())
        .map((item, mov_index) => ({
          mov_index,
          user_id: users.length === 1 ? users[0].id : item.user_id,
        })),
    }));
  };

  // MOV handlers
  const handleMovAdd = () => {
    setMovItems((prev) => [...prev, { text: '', user_id: null }]);
  };

  const handleMovRemove = (index) => {
    const newMovItems = movItems.filter((_, i) => i !== index);
    setMovItems(newMovItems);
    updateMovData(newMovItems);
  };

  const handleMovChange = (index, value) => {
    const newMovItems = movItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, text: value } : item
    ));
    setMovItems(newMovItems);
    updateMovData(newMovItems);
  };

  const handleMovUserChange = (index, userId) => {
    const newMovItems = movItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, user_id: userId } : item
    ));
    setMovItems(newMovItems);
    updateMovData(newMovItems);
  };

  const updateMovData = (items) => {
    const cleanItems = items
      .map((item) => ({ ...item, text: String(item.text || '').trim() }))
      .filter((item) => item.text.length > 0);
    setConvertData((previous) => ({
      ...previous,
      mov_items: cleanItems.map((item) => item.text),
      mov_assignments: cleanItems.map((item, mov_index) => ({
        mov_index,
        user_id: assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id,
      })),
    }));
  };

  // Validation checks
  const hasAssignees = assignedUsers.length > 0;
  const hasMovItems = movItems.some(item => item.text.trim() !== '');
  const isFormValid = hasAssignees && hasMovItems;

  // Wrapper for onConvert to validate first
  const handleConvert = () => {
    if (isFormValid) {
      onConvert();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tkadd-modal-backdrop convert-modal-overlay">
      <div className="tkadd-card tkadd-card--popup convert-modal-content">
        <div className="tkadd-modal-header">
          <div className="tkadd-form-breadcrumb">
            <span className="tkadd-form-dept-chip">CEO Office</span>
            <span className="tkadd-form-breadcrumb-sep">›</span>
            <h2 className="tkadd-modal-title">Convert to task</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tkadd-modal-close"
            aria-label="Close convert to task dialog"
          >
            ✕
          </button>
        </div>

        <div className="tkadd-body convert-modal-body">
          {!isFormValid && (
            <div className="convert-validation-message" role="status">
              <FaExclamationTriangle className="convert-validation-message-icon" />
              <span>Please add at least one assignee and one MOV item.</span>
            </div>
          )}

          <div className="tkadd-title-section convert-title-section">
            <input
              type="text"
              aria-label="Task title"
              placeholder="Enter task title..."
              value={convertData.task_title}
              onChange={(e) => setConvertData({ ...convertData, task_title: e.target.value })}
              className="tkadd-title-input"
            />
            <textarea
              aria-label="Task description"
              placeholder="Enter task description..."
              value={convertData.task_description}
              onChange={(e) => setConvertData({ ...convertData, task_description: e.target.value })}
              rows={2}
              className="tkadd-desc-input"
            />
          </div>

          <div className="tkadd-meta-pills convert-meta-pills">
            <div className={`tkadd-assignee-field convert-assignee-field ${assignedUsers.length > 0 ? 'is-filled' : 'is-empty'}`}>
              <FaUsers className="convert-assignee-icon" aria-hidden="true" />
              <SearchableMultiSelect
                label=""
                onSearch={searchAssignees}
                onSelect={handleSelectUsers}
                onClear={() => {
                  setAssignedUsers([]);
                  setConvertData({ ...convertData, assigned_users: [] });
                }}
                value={assignedUsers}
                displayKey="full_name"
                valueKey="id"
                allowResearch={true}
                debounceDelay={500}
                minSearchLength={2}
                renderOption={(user) => (
                  <div className="assign-user-option">
                    <div className="assign-user-name">{user.first_name} {user.last_name}</div>
                    <div className="assign-user-email">{user.email}</div>
                    {user.department && (
                      <div className="assign-user-meta">
                        {user.department} • {user.role || 'User'}
                      </div>
                    )}
                  </div>
                )}
                placeholder="Assignee(s)"
              />
            </div>

            <label className="convert-priority-pill">
              <FaFlag aria-hidden="true" />
              <span className="convert-visually-hidden">Task priority</span>
              <select
                value={convertData.task_priority}
                onChange={(e) => setConvertData({ ...convertData, task_priority: e.target.value })}
                aria-label="Task priority"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
                <option value="critical">Critical priority</option>
              </select>
            </label>

            <label className={`tkadd-pill-input-wrapper tkadd-pill-date convert-date-pill ${convertData.task_due_date ? 'is-filled' : 'is-empty'}`}>
              <FaCalendarAlt className="tkadd-pill-icon" aria-hidden="true" />
              <span>{formatTaskDate(convertData.task_due_date) || 'Due date'}</span>
              <span className="tkadd-pill-dot" aria-hidden="true" />
              <span className="convert-visually-hidden">Task due date</span>
              <input
                type="date"
                value={convertData.task_due_date}
                onChange={(e) => setConvertData({ ...convertData, task_due_date: e.target.value })}
                aria-label="Task due date"
              />
            </label>
          </div>

          {assignedUsers.length > 0 && (
            <div className="tkadd-popup-assignee-summary">
              <span className="tkadd-popup-assignee-count">
                {assignedUsers.length} {assignedUsers.length === 1 ? 'assignee' : 'assignees'}
              </span>
              {assignedUsers.map((user) => (
                <span className="tkadd-popup-assignee-chip" key={user.id}>
                  <span className="tkadd-chip-avatar" aria-hidden="true">
                    {(userDisplayName(user)[0] || 'U').toUpperCase()}
                  </span>
                  <span className="tkadd-chip-name">{userDisplayName(user)}</span>
                  {(assignedUserDepartments[user.id] || user.department) && (
                    <span className="tkadd-chip-dept">
                      {formatDepartment(assignedUserDepartments[user.id] || user.department)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          <section className="tkadd-done-when-section convert-mov-section">
            <div className="tkadd-done-when-header">
              Done when... <span>Means of verification the assignee must tick off</span>
            </div>
            <div className="convert-mov-container">
              {movItems.map((item, index) => (
                <div key={index} className="tkadd-done-when-input-wrapper convert-mov-item-row">
                  <FormInput
                    name={`mov_item_${index}`}
                    label=""
                    value={item.text}
                    onChange={(e) => handleMovChange(index, e.target.value)}
                    placeholder="Define a clear, specific, and measurable verification point"
                  />
                  <MovAssignmentPicker
                    assignedUsers={assignedUsers}
                    userId={assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id}
                    onChange={(userId) => handleMovUserChange(index, userId)}
                    disabled={assignedUsers.length === 0}
                  />
                  {movItems.length > 1 && (
                    <button
                      type="button"
                      className="tkadd-done-when-remove-btn"
                      onClick={() => handleMovRemove(index)}
                      aria-label={`Remove verification item ${index + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="tkadd-done-when-add-btn" onClick={handleMovAdd}>
                + Add condition
              </button>
            </div>
          </section>
        </div>

        <div className="tkadd-footer convert-modal-footer">
          <span className="convert-footer-hint">Required: assignee(s) and at least one MOV item</span>
          <div className="tkadd-footer-actions">
            <button type="button" onClick={onClose} className="tkadd-cancel-btn">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConvert}
              className="tkadd-submit"
              disabled={!isFormValid}
            >
              Convert to task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertToTaskModal;
