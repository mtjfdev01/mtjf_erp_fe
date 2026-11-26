import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowDown } from 'react-icons/io';
import './Sidebar.css';

/**
 * Detail / action segments that belong to a `…/list` menu item
 * (e.g. /donors/list → /donors/view/1). Nested list namespaces like
 * /applications/drafts or /applications/entry must NOT light up
 * /applications/list.
 */
const LIST_DETAIL_SEGMENTS = new Set([
  'view',
  'edit',
  'add',
  'update',
  'create',
  'new',
  'detail',
  'form',
  'print',
  'preview',
  'register',
  'profile',
  'relocate',
  'record',
  'poc',
  // aid audit detail: /dms/aid/audit/applications/:id
  'applications',
]);

/** Match list routes and their view/edit/add children without colliding on shared prefixes. */
export const isSidebarPathActive = (activeItem, path) => {
  if (!activeItem || !path) return false;
  if (activeItem === path) return true;
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
  if (activeItem.startsWith(`${normalized}/`)) return true;
  if (normalized.endsWith('/list')) {
    const base = normalized.slice(0, -'/list'.length);
    if (!base || !activeItem.startsWith(`${base}/`)) return false;
    const rest = activeItem.slice(base.length + 1);
    const firstSegment = rest.split('/').filter(Boolean)[0];
    if (!firstSegment) return false;
    // /applications/list must not match /applications/drafts/… or /applications/entry/…
    if (LIST_DETAIL_SEGMENTS.has(firstSegment)) return true;
    if (/^\d+$/.test(firstSegment)) return true;
    return false;
  }
  return false;
};

const entryOrDescendantActive = (entry, activeItem) => {
  if (!entry) return false;
  if (entry.path && isSidebarPathActive(activeItem, entry.path)) return true;
  return Boolean(
    entry.subItems?.some((child) => entryOrDescendantActive(child, activeItem))
  );
};

const SidebarItem = ({
  item,
  activeItem,
  onNavigate,
  collapsed = false,
  depth = 0,
}) => {
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
  const isChildActive = Boolean(
    hasSubItems &&
      item.subItems.some((subItem) => entryOrDescendantActive(subItem, activeItem))
  );
  const isSelfActive =
    Boolean(item.path) &&
    isSidebarPathActive(activeItem, item.path) &&
    !isChildActive;
  const isActive = isSelfActive || isChildActive;

  const [expanded, setExpanded] = useState(
    Boolean(isChildActive || item.defaultExpanded)
  );

  useEffect(() => {
    if (isChildActive) {
      setExpanded(true);
    }
  }, [isChildActive]);

  const tooltipProps = collapsed
    ? { 'data-tooltip': item.label, title: item.label }
    : {};

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const handleNavigate = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    onNavigate?.();
  };

  const handleHeaderWithSubItemsClick = (event) => {
    const isPlainLeftClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;

    if (isPlainLeftClick) {
      event.preventDefault();
      toggleExpanded();
      return;
    }

    onNavigate?.();
  };

  const headerClassName = `sidebar-item-header ${
    isActive ? 'sidebar-item-header--active' : ''
  }${depth > 0 ? ' sidebar-item-header--nested' : ''}`;

  const directCount = hasSubItems ? item.subItems.length : 0;
  const countBadge =
    directCount > 0 ? (
      <span className="sidebar-item-count" aria-label={`${directCount} options`}>
        {directCount}
      </span>
    ) : null;

  return (
    <div className={`sidebar-item${depth > 0 ? ' sidebar-item--nested' : ''}`}>
      {hasSubItems ? (
        item.path ? (
          <Link
            to={item.path}
            className={headerClassName}
            onClick={handleHeaderWithSubItemsClick}
            aria-current={isSelfActive ? 'page' : undefined}
            {...tooltipProps}
          >
            {item.icon && (
              <span className="sidebar-item-icon">
                <item.icon />
              </span>
            )}
            <span className="sidebar-item-label">{item.label}</span>
            {item.badge && (
              <span
                className={`sidebar-sub-item-badge ${
                  item.badge === 'NEW' ? 'sidebar-badge-new' : ''
                }`}
              >
                {item.badge}
              </span>
            )}
            {countBadge}
            {item.dot && <span className="sidebar-alert-dot" />}
            <span
              className={`sidebar-item-arrow ${
                expanded ? 'sidebar-item-arrow--expanded' : ''
              }`}
            >
              <IoIosArrowDown />
            </span>
          </Link>
        ) : (
          <div
            className={headerClassName}
            onClick={toggleExpanded}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleExpanded();
              }
            }}
            {...tooltipProps}
          >
            {item.icon && (
              <span className="sidebar-item-icon">
                <item.icon />
              </span>
            )}
            <span className="sidebar-item-label">{item.label}</span>
            {item.badge && (
              <span
                className={`sidebar-sub-item-badge ${
                  item.badge === 'NEW' ? 'sidebar-badge-new' : ''
                }`}
              >
                {item.badge}
              </span>
            )}
            {countBadge}
            {item.dot && <span className="sidebar-alert-dot" />}
            <span
              className={`sidebar-item-arrow ${
                expanded ? 'sidebar-item-arrow--expanded' : ''
              }`}
            >
              <IoIosArrowDown />
            </span>
          </div>
        )
      ) : (
        <Link
          to={item.path}
          className={headerClassName}
          onClick={handleNavigate}
          aria-current={isActive ? 'page' : undefined}
          {...tooltipProps}
        >
          {item.icon && (
            <span className="sidebar-item-icon">
              <item.icon />
            </span>
          )}
          <span className="sidebar-item-label">{item.label}</span>
          {item.badge && (
            <span
              className={`sidebar-sub-item-badge ${
                item.badge === 'NEW' ? 'sidebar-badge-new' : ''
              }`}
            >
              {item.badge}
            </span>
          )}
          {item.dot && <span className="sidebar-alert-dot" />}
        </Link>
      )}

      {expanded && hasSubItems && !collapsed && (
        <div className="sidebar-sub-items">
          {item.subItems.map((subItem, index) => {
            const nestedHasChildren = Boolean(subItem.subItems?.length);
            if (nestedHasChildren) {
              return (
                <SidebarItem
                  key={subItem.id || subItem.path || index}
                  item={subItem}
                  activeItem={activeItem}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                  depth={depth + 1}
                />
              );
            }

            const isSubActive = isSidebarPathActive(activeItem, subItem.path);
            return (
              <Link
                key={subItem.id || subItem.path || index}
                to={subItem.path}
                className={`sidebar-sub-item ${
                  isSubActive ? 'sidebar-sub-item--active' : ''
                }`}
                onClick={handleNavigate}
                aria-current={isSubActive ? 'page' : undefined}
              >
                {subItem.icon && (
                  <span className="sidebar-sub-item-icon">
                    <subItem.icon />
                  </span>
                )}
                <span className="sidebar-sub-item-label">{subItem.label}</span>
                {subItem.badge && (
                  <span
                    className={`sidebar-sub-item-badge ${
                      subItem.badge === 'Pending' ? 'sidebar-badge-pending' : ''
                    } ${subItem.badge === 'NEW' ? 'sidebar-badge-new' : ''}`}
                  >
                    {subItem.badge}
                  </span>
                )}
                {subItem.dot && <span className="sidebar-alert-dot" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
