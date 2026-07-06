import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiUserCheck, FiUsers, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import TaskViewModal from '../view/TaskViewModal';
import TaskCardMenu from './TaskCardMenu';
import BoardColumnPicker from './BoardColumnPicker';
import TaskViewModeSwitch from '../shared/TaskViewModeSwitch';
import TaskAssigneeFilter from '../shared/TaskAssigneeFilter';
import {
  BOARD_COLUMNS,
  BOARD_COLUMN_IDS,
  CARD_COLOR_OPTIONS,
  CARD_COLORS_STORAGE_KEY,
  loadVisibleColumnIds,
  saveVisibleColumnIds,
} from './taskBoardConfig';
import './index.css';

const TasksBoard = ({ viewMode = 'kanban', onViewModeChange }) => {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [assignedUser, setAssignedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned_to_me');
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dropColumnId, setDropColumnId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [didDrag, setDidDrag] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);
  const [menuSubmenu, setMenuSubmenu] = useState(null);
  const [cardColors, setCardColors] = useState(() => {
    try {
      const raw = localStorage.getItem(CARD_COLORS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => loadVisibleColumnIds(null));
  const pendingRollbackRef = useRef(new Map());
  const statusRequestRef = useRef(0);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const currentUserId = user?.id ? Number(user.id) : null;

  useEffect(() => {
    setVisibleColumnIds(loadVisibleColumnIds(currentUserId));
  }, [currentUserId]);

  const tasksRouteBase = useMemo(() => tasksBasePath(), []);
  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const isManager = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return ['dept_head', 'manager', 'assistant_manager', 'team_lead', 'coordinator'].includes(role);
  }, [user?.role]);

  const isTaskAssignedToCurrentUser = useCallback(
    (task) => {
      if (!currentUserId || !task) return false;
      const ids = Array.isArray(task.assigned_user_ids) ? task.assigned_user_ids : [];
      const metaIds = Array.isArray(task.assigned_users_meta)
        ? task.assigned_users_meta.map((m) => m?.user_id)
        : [];
      return [...ids, ...metaIds]
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0)
        .includes(currentUserId);
    },
    [currentUserId],
  );

  const isTaskAssignedToTeam = useCallback(
    (task) => {
      if (!user?.department || !task) return false;
      const meta = Array.isArray(task.assigned_users_meta) ? task.assigned_users_meta : [];
      return meta.some((m) => m?.department === user.department && Number(m?.user_id) !== currentUserId);
    },
    [user?.department, currentUserId],
  );

  const filteredByTab = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    if (activeTab === 'assigned_to_me') {
      return list.filter((t) => isTaskAssignedToCurrentUser(t));
    }
    if (activeTab === 'assigned_to_team' && isManager) {
      return list.filter((t) => !isTaskAssignedToCurrentUser(t) && isTaskAssignedToTeam(t));
    }
    return list.filter((t) => !isTaskAssignedToCurrentUser(t) && !(isManager && isTaskAssignedToTeam(t)));
  }, [tasks, activeTab, isTaskAssignedToCurrentUser, isTaskAssignedToTeam, isManager]);

  const visibleTasks = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return filteredByTab;
    return filteredByTab.filter((t) => {
      const title = String(t.title || '').toLowerCase();
      const dept = String(t.department || '').toLowerCase();
      return title.includes(q) || dept.includes(q);
    });
  }, [filteredByTab, searchInput]);

  const tasksByColumn = useMemo(() => {
    const map = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, []]));
    visibleTasks.forEach((task) => {
      const status = String(task.status || 'open').toLowerCase();
      const columnId = BOARD_COLUMN_IDS.has(status) ? status : 'open';
      map[columnId].push(task);
    });
    return map;
  }, [visibleTasks]);

  const visibleBoardColumns = useMemo(
    () => BOARD_COLUMNS.filter((col) => visibleColumnIds.has(col.id)),
    [visibleColumnIds],
  );

  const columnCounts = useMemo(() => {
    const counts = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, 0]));
    visibleTasks.forEach((task) => {
      const status = String(task.status || 'open').toLowerCase();
      const columnId = BOARD_COLUMN_IDS.has(status) ? status : 'open';
      counts[columnId] = (counts[columnId] || 0) + 1;
    });
    return counts;
  }, [visibleTasks]);

  const persistVisibleColumns = useCallback(
    (nextSet) => {
      setVisibleColumnIds(nextSet);
      saveVisibleColumnIds(currentUserId, nextSet);
    },
    [currentUserId],
  );

  const handleToggleColumnVisibility = (columnId) => {
    setVisibleColumnIds((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        if (next.size <= 1) {
          toast.info('At least one column must stay visible.');
          return prev;
        }
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      saveVisibleColumnIds(currentUserId, next);
      return next;
    });
  };

  const handleShowAllColumns = () => {
    const next = new Set(BOARD_COLUMNS.map((c) => c.id));
    persistVisibleColumns(next);
  };

  const handleHideAllColumns = () => {
    const next = new Set(['open']);
    persistVisibleColumns(next);
    toast.info('Only Open column is shown. Use Show all to restore every column.');
  };

  const tabCounts = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    return {
      assigned_to_me: list.filter((t) => isTaskAssignedToCurrentUser(t)).length,
      assigned_to_team: isManager
        ? list.filter((t) => !isTaskAssignedToCurrentUser(t) && isTaskAssignedToTeam(t)).length
        : 0,
      other_tasks: list.filter(
        (t) => !isTaskAssignedToCurrentUser(t) && !(isManager && isTaskAssignedToTeam(t)),
      ).length,
    };
  }, [tasks, isTaskAssignedToCurrentUser, isTaskAssignedToTeam, isManager]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const taskSearch = searchInput.trim() || undefined;
        const assigneeId = assignedUser?.id ? Number(assignedUser.id) : undefined;
        const hasServerFilters = taskSearch || assigneeId;

        let res;
        if (hasServerFilters) {
          res = await axiosInstance.post('/tasks/search', {
            pagination: {
              page: 1,
              pageSize: 200,
              sortField: 'updated_at',
              sortOrder: 'DESC',
            },
            filters: {
              search: taskSearch,
              assignee_id: assigneeId,
            },
          });
        } else {
          res = await axiosInstance.get('/tasks/list', {
            params: {
              page: 1,
              pageSize: 200,
              sortField: 'updated_at',
              sortOrder: 'DESC',
            },
          });
        }
        setTasks(res.data?.data || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [searchInput, assignedUser?.id]);

  const canChangeStatus = useCallback(
    (task) => {
      const canUpdate = taskPerms.canUpdate === true;
      const isAssignee = isTaskAssignedToCurrentUser(task);
      const canChangeAsAssignee =
        isAssignee && (taskPerms.canUpdate === true || taskPerms.canComplete === true);
      return canUpdate || canChangeAsAssignee;
    },
    [taskPerms, isTaskAssignedToCurrentUser],
  );

  const handleStatusChange = async (task, nextStatus) => {
    if (!task?.id) return;
    const taskId = Number(task.id);
    const current = String(task.status || 'open').toLowerCase();
    const normalizedNext = String(nextStatus || '').toLowerCase();
    if (current === normalizedNext) return;
    if (!canChangeStatus(task)) {
      toast.error('You do not have permission to update this task status.');
      return;
    }

    const requestId = statusRequestRef.current + 1;
    statusRequestRef.current = requestId;

    let rollbackTask = null;
    setTasks((prev) => {
      const existing = prev.find((t) => Number(t.id) === taskId);
      if (existing) {
        rollbackTask = { ...existing };
        pendingRollbackRef.current.set(taskId, rollbackTask);
      }
      return prev.map((t) =>
        Number(t.id) === taskId ? { ...t, status: normalizedNext } : t,
      );
    });

    if (!rollbackTask) {
      rollbackTask = { ...task, status: current };
      pendingRollbackRef.current.set(taskId, rollbackTask);
    }

    setStatusUpdatingId(taskId);
    setDraggingTaskId(null);

    try {
      const res = await axiosInstance.post(`/tasks/${taskId}/status-transition`, {
        status: normalizedNext,
        notes: '',
      });

      if (requestId !== statusRequestRef.current) return;

      if (res.data?.success === false) {
        throw new Error(res.data?.message || 'Failed to update status.');
      }

      pendingRollbackRef.current.delete(taskId);
      const updated = res.data?.data;
      setTasks((prev) =>
        prev.map((t) =>
          Number(t.id) === taskId ? { ...t, ...(updated || { status: normalizedNext }) } : t,
        ),
      );
      toast.success('Status updated.');
    } catch (e) {
      if (requestId !== statusRequestRef.current) return;

      const snapshot = pendingRollbackRef.current.get(taskId) || rollbackTask;
      if (snapshot) {
        setTasks((prev) =>
          prev.map((t) => (Number(t.id) === taskId ? { ...snapshot } : t)),
        );
      }
      pendingRollbackRef.current.delete(taskId);

      const message =
        e.response?.data?.message || e.message || 'Failed to update status.';
      toast.error(message);
    } finally {
      if (requestId === statusRequestRef.current) {
        setStatusUpdatingId(null);
      }
    }
  };

  const handleDragStart = (e, task) => {
    if (!canChangeStatus(task)) {
      e.preventDefault();
      return;
    }
    setDidDrag(true);
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDropColumnId(null);
    setTimeout(() => setDidDrag(false), 0);
  };

  const openTaskModal = (taskId) => {
    if (!taskPerms.canViewDetail) return;
    setSelectedTaskId(taskId);
  };

  const handleTaskUpdatedFromModal = (updated) => {
    if (!updated?.id) return;
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(updated.id) ? { ...t, ...updated } : t)),
    );
  };

  const getCardColorStyle = (taskId) => {
    const colorId = cardColors[taskId] || 'default';
    const opt = CARD_COLOR_OPTIONS.find((c) => c.id === colorId) || CARD_COLOR_OPTIONS[0];
    return {
      backgroundColor: opt.value,
      borderColor: opt.border,
    };
  };

  const handleCardColorChange = (taskId, colorId) => {
    setCardColors((prev) => {
      const next = { ...prev, [taskId]: colorId };
      localStorage.setItem(CARD_COLORS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const closeCardMenu = () => {
    setOpenMenuTaskId(null);
    setMenuSubmenu(null);
  };

  const deleteTask = async (task) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axiosInstance.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success('Task deleted.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete task.');
    }
  };

  const canEditTask = (task) => {
    const status = String(task.status || '').toLowerCase();
    const canEditCompleted = taskPerms.canEditCompleted === true;
    return taskPerms.canUpdate && (status !== 'completed' || canEditCompleted);
  };

  const handleColumnDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropColumnId(columnId);
  };

  const handleColumnDrop = (e, columnId) => {
    e.preventDefault();
    setDropColumnId(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (!taskId) return;
    const task = tasksRef.current.find((t) => Number(t.id) === taskId);
    if (!task) return;
    setDraggingTaskId(null);
    handleStatusChange(task, columnId);
  };

  const formatDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const isOverdue = (task) => {
    if (!task?.due_date) return false;
    const status = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(status)) return false;
    const dueNoon = new Date(task.due_date);
    dueNoon.setHours(12, 0, 0, 0);
    return new Date() > dueNoon;
  };

  const capitalize = (s) =>
    s ? String(s).split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  return (
    <>
      <Navbar />
      <Loader loading={loading} />
      <div className="trello-board-wrapper">
        <PageHeader title="Tasks Board" showBackButton={false} showAdd={false} />
        <div className="trello-board-content">
          <div className="trello-board-toolbar">
            <div className="trello-board-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <TaskAssigneeFilter
              value={assignedUser}
              onSelect={setAssignedUser}
              onClear={() => setAssignedUser(null)}
              placeholder="Filter by assignee..."
            />

            <div className="trello-board-tabs">
              <button
                type="button"
                className={`trello-board-tab ${activeTab === 'assigned_to_me' ? 'trello-board-tab--active' : ''}`}
                onClick={() => setActiveTab('assigned_to_me')}
              >
                <FiUserCheck />
                Assigned to me
                <span className="trello-board-tab-count">{tabCounts.assigned_to_me}</span>
              </button>
              <button
                type="button"
                className={`trello-board-tab ${activeTab === 'other_tasks' ? 'trello-board-tab--active' : ''}`}
                onClick={() => setActiveTab('other_tasks')}
              >
                <FiList />
                Others
                <span className="trello-board-tab-count">{tabCounts.other_tasks}</span>
              </button>
              {isManager && (
                <button
                  type="button"
                  className={`trello-board-tab ${activeTab === 'assigned_to_team' ? 'trello-board-tab--active' : ''}`}
                  onClick={() => setActiveTab('assigned_to_team')}
                >
                  <FiUsers />
                  Team
                  <span className="trello-board-tab-count">{tabCounts.assigned_to_team}</span>
                </button>
              )}
            </div>

            <div className="trello-board-toolbar-right">
              <BoardColumnPicker
                open={columnPickerOpen}
                onToggle={() => setColumnPickerOpen((prev) => !prev)}
                onClose={() => setColumnPickerOpen(false)}
                visibleColumnIds={visibleColumnIds}
                columnCounts={columnCounts}
                onToggleColumn={handleToggleColumnVisibility}
                onShowAll={handleShowAllColumns}
                onHideAll={handleHideAllColumns}
              />

              <TaskViewModeSwitch value={viewMode} onChange={onViewModeChange} />

              <button
                type="button"
                className="trello-board-add-btn"
                title="Add task"
                disabled={!taskPerms.canCreate}
                onClick={
                  taskPerms.canCreate
                    ? () => navigate(`${tasksRouteBase}/add`, { state: { defaultDepartment: user?.department } })
                    : undefined
                }
              >
                <FiPlus />
              </button>
            </div>
          </div>

          <p className="trello-board-hint">
            Drag cards or use ⋮ menu to move status. Click a card to open details.
          </p>

          {error && <div className="tl-status-message tl-status-message--error">{error}</div>}

          {!loading && visibleTasks.length === 0 && (
            <div className="trello-board-empty">No tasks in this view.</div>
          )}

          {!loading && visibleBoardColumns.length === 0 && (
            <div className="trello-board-empty">
              No columns selected. Open Show/hide columns and pick at least one.
            </div>
          )}

          <div className="trello-board-scroll">
            <div className="trello-board-columns">
              {visibleBoardColumns.map((column) => (
                <section
                  key={column.id}
                  className={`trello-board-column ${dropColumnId === column.id ? 'trello-board-column--drag-over' : ''}`}
                  onDragOver={(e) => handleColumnDragOver(e, column.id)}
                  onDragLeave={() => setDropColumnId(null)}
                  onDrop={(e) => handleColumnDrop(e, column.id)}
                >
                  <header className="trello-board-column-header">
                    <div className="trello-board-column-title">
                      <span
                        className="trello-board-column-dot"
                        style={{ backgroundColor: column.color }}
                      />
                      {column.label}
                    </div>
                    <span className="trello-board-column-count">
                      {(tasksByColumn[column.id] || []).length}
                    </span>
                  </header>
                  <div className="trello-board-column-cards">
                    {(tasksByColumn[column.id] || []).map((task) => {
                      const due = formatDate(task.due_date);
                      const overdue = isOverdue(task);
                      const isUpdating = statusUpdatingId === task.id;
                      const draggable = canChangeStatus(task) && !isUpdating;
                      return (
                        <article
                          key={task.id}
                          className={`trello-board-card${draggingTaskId === task.id ? ' trello-board-card--dragging' : ''}${isUpdating ? ' trello-board-card--updating' : ''}`}
                          style={getCardColorStyle(task.id)}
                          draggable={draggable}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            if (didDrag || openMenuTaskId != null) return;
                            openTaskModal(task.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openTaskModal(task.id);
                            }
                          }}
                        >
                          <div className="trello-board-card-header">
                            <span
                              className={`trello-board-priority trello-board-priority--${task.priority || 'medium'}`}
                            >
                              {capitalize(task.priority || 'medium')}
                            </span>
                            <span className="trello-board-card-dept" title={capitalize(task.department)}>
                              {capitalize(task.department)}
                            </span>
                            <TaskCardMenu
                              task={task}
                              open={openMenuTaskId === task.id}
                              submenu={openMenuTaskId === task.id ? menuSubmenu : null}
                              onToggle={() => {
                                if (openMenuTaskId === task.id) {
                                  closeCardMenu();
                                } else {
                                  setOpenMenuTaskId(task.id);
                                  setMenuSubmenu(null);
                                }
                              }}
                              onSubmenu={setMenuSubmenu}
                              onClose={closeCardMenu}
                              onView={() => openTaskModal(task.id)}
                              onEdit={() => navigate(`${tasksRouteBase}/update/${task.id}`)}
                              onDelete={() => deleteTask(task)}
                              onMoveTo={(status) => handleStatusChange(task, status)}
                              onColorChange={(colorId) => handleCardColorChange(task.id, colorId)}
                              canView={taskPerms.canViewDetail}
                              canEdit={canEditTask(task)}
                              canDelete={taskPerms.canDelete}
                              canMove={canChangeStatus(task)}
                            />
                          </div>
                          <h4 className="trello-board-card-title">{task.title}</h4>
                          {due && (
                            <div className="trello-board-card-meta">
                              <span
                                className={`trello-board-card-due ${overdue ? 'trello-board-card-due--overdue' : ''}`}
                              >
                                {overdue ? 'Overdue · ' : ''}
                                {due}
                              </span>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TaskViewModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={handleTaskUpdatedFromModal}
        onOpenTask={setSelectedTaskId}
      />
    </>
  );
};

export default TasksBoard;
