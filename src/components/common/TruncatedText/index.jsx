import React, { useState } from 'react';
import Modal from '../Modal';
import './TruncatedText.css';

/** Standard display caps — keeps tables/views from stretching on bad input. */
export const TRUNCATE_LIMITS = {
  email: 28,
  phone: 16,
  address: 40,
  name: 24,
  city: 18,
  text: 32,
  default: 28,
};

export function getTruncateLimit(field) {
  if (typeof field === 'number' && field > 0) return field;
  return TRUNCATE_LIMITS[field] || TRUNCATE_LIMITS.default;
}

export function formatTruncated(value, maxLength) {
  if (value == null) {
    return { display: '', full: '', truncated: false, empty: true };
  }
  const full = String(value).trim();
  if (!full) {
    return { display: '', full: '', truncated: false, empty: true };
  }
  const limit = Math.max(4, Number(maxLength) || TRUNCATE_LIMITS.default);
  if (full.length <= limit) {
    return { display: full, full, truncated: false, empty: false };
  }
  return {
    display: `${full.slice(0, limit - 1)}…`,
    full,
    truncated: true,
    empty: false,
  };
}

/**
 * Prevents long user-entered values from breaking layout.
 *
 * - mode="list": plain truncated text (ellipsis when over limit)
 * - mode="view": truncated text; click opens modal with full value when truncated
 */
const TruncatedText = ({
  value,
  field = 'default',
  maxLength,
  mode = 'list',
  label = 'Value',
  empty = '—',
  className = '',
  title: titleProp,
}) => {
  const [open, setOpen] = useState(false);
  const limit = maxLength != null ? maxLength : getTruncateLimit(field);
  const { display, full, truncated, empty: isEmpty } = formatTruncated(
    value,
    limit,
  );

  if (isEmpty) {
    return <span className={`truncated-text trunc-text--empty ${className}`.trim()}>{empty}</span>;
  }

  if (mode === 'view' && truncated) {
    return (
      <>
        <button
          type="button"
          className={`trunc-text trunc-text--button ${className}`.trim()}
          onClick={() => setOpen(true)}
          title={titleProp || `Click to view full ${String(label).toLowerCase()}`}
        >
          {display}
        </button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={label}
          details={{ [label]: full }}
        />
      </>
    );
  }

  return (
    <span
      className={`trunc-text ${truncated ? 'trunc-text--truncated' : ''} ${className}`.trim()}
      title={truncated ? full : titleProp || undefined}
    >
      {display}
    </span>
  );
};

export default TruncatedText;
