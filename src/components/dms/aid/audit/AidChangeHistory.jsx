import React, { useMemo, useState } from 'react';
import {
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiInfo,
  FiSearch,
  FiSend,
  FiX,
} from 'react-icons/fi';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
import { formatAidStatus } from '../aidConstants';
import {
  AID_AUDIT_ACTION_LABELS,
  AID_AUDIT_SOURCE_LABELS,
  aidAuditFieldLabel,
} from './aidAuditLabels';
import './AidChangeHistory.css';

const CHECKLIST_STATUS_LABELS = {
  verified: 'Verified',
  mismatch: 'Mismatch',
  not_checked: 'Not checked',
};

const DECISION_LABELS = {
  approve_as_requested: 'Approve as requested',
  approve_with_changes: 'Approve with changes',
  reject: 'Reject',
};

const ACTIVITY_FILTERS = [
  { value: 'all', label: 'All activities' },
  { value: 'status', label: 'Status & decisions' },
  { value: 'updates', label: 'Application updates' },
  { value: 'attachments', label: 'Attachments' },
  { value: 'meal', label: 'MEAL / approvals' },
];

function initialsFromActor(actor) {
  if (!actor) return 'SY';
  const first = (actor.first_name || '').trim();
  const last = (actor.last_name || '').trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0) || first.charAt(1) || ''}`.toUpperCase();
  }
  const email = (actor.email || '').trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

function dayKey(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** Local calendar day bounds for YYYY-MM-DD filter values. */
function parseLocalDayStart(ymd) {
  if (!ymd) return null;
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function parseLocalDayEnd(ymd) {
  if (!ymd) return null;
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function entryMatchesDateFilter(entry, dateMode, specificDate, rangeFrom, rangeTo) {
  if (dateMode === 'all') return true;
  const ts = entry.created_at ? new Date(entry.created_at).getTime() : NaN;
  if (Number.isNaN(ts)) return false;

  if (dateMode === 'specific') {
    if (!specificDate) return true;
    const start = parseLocalDayStart(specificDate);
    const end = parseLocalDayEnd(specificDate);
    return start != null && end != null && ts >= start && ts <= end;
  }

  if (dateMode === 'range') {
    const start = parseLocalDayStart(rangeFrom);
    const end = parseLocalDayEnd(rangeTo);
    if (start == null && end == null) return true;
    if (start != null && ts < start) return false;
    if (end != null && ts > end) return false;
    return true;
  }

  return true;
}

function formatDayLabel(key) {
  if (key === 'unknown') return 'Unknown date';
  const [y, m, day] = key.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startThat = new Date(y, m - 1, day);
  const diffDays = Math.round((startToday - startThat) / 86400000);
  const nice = d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  if (diffDays === 0) return `Today · ${nice}`;
  if (diffDays === 1) return `Yesterday · ${nice}`;
  return nice;
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function displayValue(field, raw) {
  if (raw === null || raw === undefined || raw === '') return '—';
  const str = String(raw);
  if (field === 'status') return formatAidStatus(str);
  if (field?.endsWith('.status') || field?.endsWith('status')) {
    return CHECKLIST_STATUS_LABELS[str] || str.replace(/_/g, ' ');
  }
  if (field === 'recommendation.decision' || field?.endsWith('.decision')) {
    return DECISION_LABELS[str] || str.replace(/_/g, ' ');
  }
  if (str === 'true') return 'Yes';
  if (str === 'false') return 'No';
  return str;
}

function pillTone(field, value) {
  if (value === null || value === undefined || value === '') return 'muted';
  const v = String(value);
  if (field === 'status') {
    if (['verification_completed', 'successful', 'delivered'].includes(v)) return 'success';
    if (['ceo_approval_required', 'under_review', 'submitted', 'manager_review'].includes(v)) {
      return 'info';
    }
    if (['rejected', 'incomplete', 'incomplete_docs'].includes(v)) return 'danger';
    return 'muted';
  }
  if (v === 'verified' || v === 'approve_as_requested' || v === 'approve_with_changes') {
    return 'success';
  }
  if (v === 'mismatch' || v === 'reject') return 'danger';
  if (v === 'not_checked') return 'muted';
  return 'info';
}

function isChecklistNote(field) {
  return String(field || '').startsWith('checklist.') && String(field).endsWith('.note');
}

function isChecklistStatus(field) {
  return String(field || '').startsWith('checklist.') && String(field).endsWith('.status');
}

function checklistItemLabel(field) {
  const key = String(field || '').split('.')[1] || '';
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function nodeKind(action) {
  switch (action) {
    case 'manager_forwarded':
      return 'forward';
    case 'verification_completed':
    case 'verified':
    case 'draft_approved':
    case 'ceo_decided':
      return 'success';
    case 'attachment_uploaded':
    case 'attachment_deleted':
    case 'attachment_missing_set':
    case 'missing_docs_set':
      return 'file';
    case 'rejected':
    case 'marked_incomplete':
      return 'warn';
    case 'updated':
    case 'status_changed':
    case 'meal_updated':
    case 'preview_approval_updated':
    case 'assignee_changed':
    case 'delivery_updated':
      return 'edit';
    default:
      return 'neutral';
  }
}

function NodeIcon({ kind }) {
  if (kind === 'forward') return <FiSend size={12} />;
  if (kind === 'success') return <FiCheck size={13} />;
  if (kind === 'file') return <FiFileText size={12} />;
  if (kind === 'warn') return <FiX size={12} />;
  return <FiEdit2 size={12} />;
}

function activityBucket(action) {
  if (
    [
      'status_changed',
      'verification_completed',
      'manager_forwarded',
      'ceo_decided',
      'draft_approved',
      'rejected',
      'verified',
      'resumed',
      'marked_incomplete',
    ].includes(action)
  ) {
    return 'status';
  }
  if (
    [
      'attachment_uploaded',
      'attachment_deleted',
      'attachment_missing_set',
      'missing_docs_set',
    ].includes(action)
  ) {
    return 'attachments';
  }
  if (['meal_updated', 'preview_approval_updated'].includes(action)) return 'meal';
  return 'updates';
}

function classifyChanges(changes = []) {
  const status = [];
  const decisions = [];
  const checklistStatuses = [];
  const notes = [];
  const attachments = [];
  const other = [];

  changes.forEach((ch) => {
    const field = ch.field || '';
    if (field === 'status') status.push(ch);
    else if (field === 'attachment') attachments.push(ch);
    else if (field.includes('recommendation') || field.includes('decision')) decisions.push(ch);
    else if (isChecklistNote(field)) notes.push(ch);
    else if (isChecklistStatus(field)) checklistStatuses.push(ch);
    else if (field.startsWith('checklist.')) checklistStatuses.push(ch);
    else other.push(ch);
  });

  return { status, decisions, checklistStatuses, notes, attachments, other };
}

function fileDisplayName(filename) {
  if (!filename) return 'File';
  const base = String(filename).replace(/^.*[\\/]/, '');
  const withoutExt = base.replace(/\.[^.]+$/, '');
  const cleaned = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return base;
  return cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned;
}

function ValuePill({ field, value, forcePlain = false }) {
  const label = displayValue(field, value);
  if (forcePlain || label === '—') {
    return <span className="aid-ch__pill aid-ch__pill--plain">{label}</span>;
  }
  const tone = pillTone(field, value);
  return <span className={`aid-ch__pill aid-ch__pill--${tone}`}>{label}</span>;
}

function TransitionRow({ label, field, oldValue, newValue }) {
  return (
    <div className="aid-ch__row">
      <span className="aid-ch__row-label">{label}</span>
      <ValuePill field={field} value={oldValue} />
      <span className="aid-ch__arrow">→</span>
      <ValuePill field={field} value={newValue} />
    </div>
  );
}

function ChangeTable({ rows }) {
  if (!rows.length) return null;
  return (
    <div className="aid-ch__table-wrap">
      <table className="aid-ch__table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Previous</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ch, idx) => (
            <tr key={`${ch.field}-${idx}`}>
              <td className="aid-ch__table-field">
                {isChecklistStatus(ch.field)
                  ? checklistItemLabel(ch.field)
                  : aidAuditFieldLabel(ch.field)}
              </td>
              <td className="aid-ch__prev">{displayValue(ch.field, ch.old_value)}</td>
              <td>
                <ValuePill field={ch.field} value={ch.new_value} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryCard({ entry, expanded, onToggle }) {
  const action = entry.action;
  const actionLabel = AID_AUDIT_ACTION_LABELS[action] || action;
  const sourceLabel = AID_AUDIT_SOURCE_LABELS[entry.source] || entry.source || '—';
  const actor = entry.performed_by;
  const actorName = formatAuditActor(actor);
  const kind = nodeKind(action);
  const changes = Array.isArray(entry.changes) ? entry.changes : [];
  const groups = classifyChanges(changes);
  const changeCount = changes.length;
  const isAttachment =
    action === 'attachment_uploaded' ||
    action === 'attachment_deleted' ||
    groups.attachments.length > 0;
  const isStatusEvent =
    ['manager_forwarded', 'verification_completed', 'status_changed', 'ceo_decided', 'verified'].includes(
      action,
    ) ||
    (groups.status.length > 0 && changeCount <= 4 && groups.checklistStatuses.length === 0);

  const awaiting =
    action === 'manager_forwarded' ||
    groups.status.some((c) => c.new_value === 'ceo_approval_required');

  const [notesOpen, setNotesOpen] = useState(false);

  const summaryParts = [];
  if (groups.status[0]) {
    summaryParts.push(
      `Status changed to ${displayValue('status', groups.status[0].new_value)}`,
    );
  }
  if (groups.checklistStatuses.length) {
    summaryParts.push(
      `${groups.checklistStatuses.length} checklist update${
        groups.checklistStatuses.length === 1 ? '' : 's'
      }`,
    );
  }
  if (groups.notes.length) {
    summaryParts.push(
      `${groups.notes.length} note change${groups.notes.length === 1 ? '' : 's'}`,
    );
  }
  if (groups.other.length) {
    summaryParts.push(
      `${groups.other.length} other change${groups.other.length === 1 ? '' : 's'}`,
    );
  }

  const preferCollapsed =
    action === 'updated' &&
    changeCount >= 8 &&
    !isAttachment &&
    !expanded;

  const preferStatusLayout =
    isStatusEvent &&
    !preferCollapsed &&
    groups.checklistStatuses.length === 0 &&
    groups.notes.length === 0;

  const preferTable =
    !preferCollapsed &&
    !preferStatusLayout &&
    !isAttachment &&
    (groups.checklistStatuses.length > 0 || groups.other.length > 0);

  return (
    <li className="aid-ch__item">
      <span className={`aid-ch__node aid-ch__node--${kind}`} aria-hidden>
        <NodeIcon kind={kind} />
      </span>
      <article className="aid-ch__card">
        <div className="aid-ch__card-top">
          <div className="aid-ch__card-main">
            <h4 className="aid-ch__action">
              {isAttachment && groups.attachments.length > 1
                ? 'Attachments uploaded'
                : actionLabel}
            </h4>
            <div className="aid-ch__actor">
              <span className="aid-ch__avatar">{initialsFromActor(actor)}</span>
              <div className="aid-ch__actor-text">
                <span className="aid-ch__actor-name">{actorName}</span>
                <span className="aid-ch__actor-role">{sourceLabel}</span>
              </div>
            </div>
          </div>
          <div className="aid-ch__card-aside">
            {awaiting ? (
              <span className="aid-ch__badge aid-ch__badge--awaiting">
                <FiClock size={12} />
                Awaiting approval
              </span>
            ) : null}
            {isAttachment && groups.attachments.length ? (
              <span className="aid-ch__badge aid-ch__badge--count">
                {groups.attachments.length} file
                {groups.attachments.length === 1 ? '' : 's'}
              </span>
            ) : null}
            {!isAttachment && !awaiting && changeCount > 1 ? (
              <span className="aid-ch__badge aid-ch__badge--count">
                {changeCount} change{changeCount === 1 ? '' : 's'}
              </span>
            ) : null}
            <span className="aid-ch__time">{formatTime(entry.created_at)}</span>
          </div>
        </div>

        {preferCollapsed ? (
          <div className="aid-ch__summary">
            <span>{summaryParts.join(' · ') || `${changeCount} changes`}</span>
            <button type="button" className="aid-ch__link-btn" onClick={onToggle}>
              View changes
              <FiChevronRight size={14} />
            </button>
          </div>
        ) : null}

        {preferStatusLayout ? (
          <div className="aid-ch__rows">
            {groups.status.map((ch, idx) => (
              <TransitionRow
                key={`st-${idx}`}
                label="Status changed"
                field="status"
                oldValue={ch.old_value}
                newValue={ch.new_value}
              />
            ))}
            {groups.decisions.map((ch, idx) => (
              <TransitionRow
                key={`dec-${idx}`}
                label={aidAuditFieldLabel(ch.field).replace(/^Recommendation\s+/i, 'Recommendation')}
                field={ch.field}
                oldValue={ch.old_value}
                newValue={ch.new_value}
              />
            ))}
            {groups.other.map((ch, idx) => (
              <TransitionRow
                key={`ot-${idx}`}
                label={aidAuditFieldLabel(ch.field)}
                field={ch.field}
                oldValue={ch.old_value}
                newValue={ch.new_value}
              />
            ))}
          </div>
        ) : null}

        {isAttachment ? (
          <div className="aid-ch__files">
            {groups.attachments.map((ch, idx) => {
              const name = displayValue('attachment', ch.new_value || ch.old_value);
              return (
                <div className="aid-ch__file" key={`file-${idx}`}>
                  <span className="aid-ch__file-icon">
                    <FiFileText size={14} />
                  </span>
                  <div className="aid-ch__file-meta">
                    <p className="aid-ch__file-name">{fileDisplayName(name)}</p>
                    <p className="aid-ch__file-sub">{name === '—' ? 'Attachment' : name}</p>
                  </div>
                  <div className="aid-ch__file-actions" title="Open from the application attachments">
                    <span className="aid-ch__icon-btn" aria-hidden>
                      <FiEye size={14} />
                    </span>
                    <span className="aid-ch__icon-btn" aria-hidden>
                      <FiDownload size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {preferTable || (expanded && !preferStatusLayout && !isAttachment) ? (
          <>
            <ChangeTable
              rows={[
                ...groups.status,
                ...groups.decisions,
                ...groups.checklistStatuses,
                ...groups.other,
              ]}
            />
            {groups.notes.length ? (
              <>
                <button
                  type="button"
                  className="aid-ch__notes-toggle"
                  onClick={() => setNotesOpen((v) => !v)}
                >
                  <span>
                    {notesOpen ? 'Hide' : 'View'} {groups.notes.length} note change
                    {groups.notes.length === 1 ? '' : 's'}
                  </span>
                  <FiChevronDown
                    size={16}
                    style={{
                      transform: notesOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>
                {notesOpen ? (
                  <div className="aid-ch__notes">
                    {groups.notes.map((ch, idx) => (
                      <div className="aid-ch__note" key={`note-${idx}`}>
                        <div className="aid-ch__note-field">
                          {checklistItemLabel(ch.field)} note
                        </div>
                        <div className="aid-ch__note-vals">
                          <span className="aid-ch__note-old">
                            {displayValue(ch.field, ch.old_value)}
                          </span>
                          {' → '}
                          <span className="aid-ch__note-new">
                            {displayValue(ch.field, ch.new_value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            {expanded && preferCollapsed === false && changeCount >= 8 ? (
              <div style={{ marginTop: '0.55rem' }}>
                <button type="button" className="aid-ch__link-btn" onClick={onToggle}>
                  Collapse
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {!preferCollapsed &&
        !preferStatusLayout &&
        !preferTable &&
        !isAttachment &&
        changeCount > 0 ? (
          <div className="aid-ch__rows">
            {changes.map((ch, idx) => (
              <TransitionRow
                key={`all-${idx}`}
                label={aidAuditFieldLabel(ch.field)}
                field={ch.field}
                oldValue={ch.old_value}
                newValue={ch.new_value}
              />
            ))}
          </div>
        ) : null}

        {!changeCount ? (
          <p className="aid-ch__muted" style={{ margin: 0 }}>
            No field-level details recorded for this event.
          </p>
        ) : null}
      </article>
    </li>
  );
}

function exportEntries(entries) {
  const rows = [
    ['When', 'Action', 'User', 'Source', 'Field', 'Previous', 'Updated'],
  ];
  entries.forEach((entry) => {
    const when = entry.created_at ? new Date(entry.created_at).toISOString() : '';
    const action = AID_AUDIT_ACTION_LABELS[entry.action] || entry.action;
    const user = formatAuditActor(entry.performed_by);
    const source = AID_AUDIT_SOURCE_LABELS[entry.source] || entry.source || '';
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    if (!changes.length) {
      rows.push([when, action, user, source, '', '', '']);
      return;
    }
    changes.forEach((ch) => {
      rows.push([
        when,
        action,
        user,
        source,
        aidAuditFieldLabel(ch.field),
        displayValue(ch.field, ch.old_value),
        displayValue(ch.field, ch.new_value),
      ]);
    });
  });
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? '');
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aid-change-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const AidChangeHistory = ({
  entries = [],
  loading = false,
  emptyMessage = 'No audit events recorded yet for this application.',
}) => {
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState('all');
  const [userId, setUserId] = useState('all');
  const [sort, setSort] = useState('newest');
  const [dateMode, setDateMode] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const users = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const u = e.performed_by;
      if (!u?.id) return;
      map.set(u.id, formatAuditActor(u));
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    if (mode === 'all') {
      setSpecificDate('');
      setRangeFrom('');
      setRangeTo('');
    } else if (mode === 'specific') {
      setRangeFrom('');
      setRangeTo('');
    } else if (mode === 'range') {
      setSpecificDate('');
    }
  };

  const clearDateFilters = () => {
    setDateMode('all');
    setSpecificDate('');
    setRangeFrom('');
    setRangeTo('');
  };

  const dateFilterActive =
    dateMode === 'specific'
      ? Boolean(specificDate)
      : dateMode === 'range'
        ? Boolean(rangeFrom || rangeTo)
        : false;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = entries.filter((entry) => {
      if (activity !== 'all' && activityBucket(entry.action) !== activity) return false;
      if (userId !== 'all' && String(entry.performed_by?.id || '') !== String(userId)) {
        return false;
      }
      if (!entryMatchesDateFilter(entry, dateMode, specificDate, rangeFrom, rangeTo)) {
        return false;
      }
      if (!q) return true;
      const actionLabel = AID_AUDIT_ACTION_LABELS[entry.action] || entry.action || '';
      const actor = formatAuditActor(entry.performed_by);
      const changeText = (entry.changes || [])
        .map(
          (ch) =>
            `${aidAuditFieldLabel(ch.field)} ${displayValue(ch.field, ch.old_value)} ${displayValue(
              ch.field,
              ch.new_value,
            )}`,
        )
        .join(' ');
      return `${actionLabel} ${actor} ${changeText}`.toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return sort === 'oldest' ? ta - tb : tb - ta;
    });
    return list;
  }, [entries, search, activity, userId, sort, dateMode, specificDate, rangeFrom, rangeTo]);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((entry) => {
      const key = dayKey(entry.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    return [...map.entries()];
  }, [filtered]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return <p className="aid-ch__muted">Loading change history…</p>;
  }

  return (
    <section className="aid-ch">
      <div className="aid-ch__header">
        <div className="aid-ch__title-row">
          <span className="aid-ch__title-icon" aria-hidden>
            <FiClock size={16} />
          </span>
          <div>
            <h3 className="aid-ch__title">Change history</h3>
            <p className="aid-ch__subtitle">
              Track application updates, approvals and supporting files.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="aid-ch__export"
          disabled={!filtered.length}
          onClick={() => exportEntries(filtered)}
        >
          <FiDownload size={15} />
          Export log
        </button>
      </div>

      <div className="aid-ch__filters">
        <div className="aid-ch__search">
          <FiSearch className="aid-ch__search-icon" size={15} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            aria-label="Search activity"
          />
        </div>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          aria-label="Filter by activity"
        >
          {ACTIVITY_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          aria-label="Filter by user"
        >
          <option value="all">All users</option>
          {users.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort order"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="aid-ch__date-filters">
        <select
          value={dateMode}
          onChange={(e) => handleDateModeChange(e.target.value)}
          aria-label="Date filter mode"
          className="aid-ch__date-mode"
        >
          <option value="all">All dates</option>
          <option value="specific">Specific date</option>
          <option value="range">Date range</option>
        </select>

        {dateMode === 'specific' ? (
          <label className="aid-ch__date-field">
            <span>Date</span>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              aria-label="Specific date"
            />
          </label>
        ) : null}

        {dateMode === 'range' ? (
          <>
            <label className="aid-ch__date-field">
              <span>From</span>
              <input
                type="date"
                value={rangeFrom}
                max={rangeTo || undefined}
                onChange={(e) => setRangeFrom(e.target.value)}
                aria-label="From date"
              />
            </label>
            <label className="aid-ch__date-field">
              <span>To</span>
              <input
                type="date"
                value={rangeTo}
                min={rangeFrom || undefined}
                onChange={(e) => setRangeTo(e.target.value)}
                aria-label="To date"
              />
            </label>
          </>
        ) : null}

        {dateFilterActive ? (
          <button
            type="button"
            className="aid-ch__date-clear"
            onClick={clearDateFilters}
          >
            Clear dates
          </button>
        ) : null}
      </div>

      {!filtered.length ? (
        <p className="aid-ch__muted">
          {dateFilterActive || search || activity !== 'all' || userId !== 'all'
            ? 'No activity matches the current filters.'
            : emptyMessage}
        </p>
      ) : (
        groups.map(([key, dayEntries]) => (
          <div className="aid-ch__day" key={key}>
            <p className="aid-ch__day-label">{formatDayLabel(key)}</p>
            <ul className="aid-ch__timeline">
              {dayEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedIds.has(entry.id)}
                  onToggle={() => toggleExpanded(entry.id)}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      <div className="aid-ch__footer">
        <FiInfo size={14} />
        All changes are recorded automatically.
      </div>
    </section>
  );
};

export default AidChangeHistory;
