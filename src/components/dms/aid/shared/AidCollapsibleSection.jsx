import React, { forwardRef } from 'react';

/**
 * Collapsed-by-default section for optional long forms (Zakat / Consent).
 */
const AidCollapsibleSection = forwardRef(
  (
    {
      title,
      hint = 'Click to expand',
      defaultOpen = false,
      open,
      onToggle,
      actions = null,
      className = '',
      children,
    },
    ref,
  ) => (
    <details
      ref={ref}
      className={`aid-collapse ${className}`.trim()}
      open={open !== undefined ? open : defaultOpen || undefined}
      onToggle={onToggle}
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
  ),
);

AidCollapsibleSection.displayName = 'AidCollapsibleSection';

export default AidCollapsibleSection;
