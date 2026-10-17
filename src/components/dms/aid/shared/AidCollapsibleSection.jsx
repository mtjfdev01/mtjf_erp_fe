import React from 'react';

/**
 * Collapsed-by-default section for optional long forms (Zakat / Consent).
 */
const AidCollapsibleSection = ({
  title,
  hint = 'Click to expand',
  defaultOpen = false,
  actions = null,
  className = '',
  children,
}) => (
  <details
    className={`aid-collapse ${className}`.trim()}
    open={defaultOpen || undefined}
  >
    <summary className="aid-collapse__summary">
      <span className="aid-collapse__summary-main">
        <span className="aid-collapse__chevron" aria-hidden />
        <span className="aid-collapse__titles">
          <span className="aid-collapse__title">{title}</span>
          {hint ? <span className="aid-collapse__hint">{hint}</span> : null}
        </span>
      </span>
      {actions ? (
        <span
          className="aid-collapse__actions"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions}
        </span>
      ) : null}
    </summary>
    <div className="aid-collapse__body">{children}</div>
  </details>
);

export default AidCollapsibleSection;
