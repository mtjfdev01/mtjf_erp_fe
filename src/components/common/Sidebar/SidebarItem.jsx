import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowDown } from 'react-icons/io';
import './Sidebar.css';

const SidebarItem = ({ item, activeItem, onNavigate, collapsed = false }) => {
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
  const isChildActive = Boolean(
    hasSubItems && item.subItems.some((subItem) => activeItem === subItem.path)
  );
  const isSelfActive = activeItem === item.path;
  const isActive = isSelfActive || isChildActive;

  const [expanded, setExpanded] = useState(Boolean(isChildActive || item.defaultExpanded));

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

  const headerClassName = `sidebar-item-header ${isActive ? 'sidebar-item-header--active' : ''}`;

  return (
    <div className="sidebar-item">
      {hasSubItems ? (
        item.path ? (
          <Link
            to={item.path}
            className={headerClassName}
            onClick={handleHeaderWithSubItemsClick}
            {...tooltipProps}
          >
            {item.icon && (
              <span className="sidebar-item-icon">
                <item.icon />
              </span>
            )}
            <span className="sidebar-item-label">{item.label}</span>
            {item.badge && (
              <span className={`sidebar-sub-item-badge ${item.badge === 'NEW' ? 'sidebar-badge-new' : ''}`}>
                {item.badge}
              </span>
            )}
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
              <span className={`sidebar-sub-item-badge ${item.badge === 'NEW' ? 'sidebar-badge-new' : ''}`}>
                {item.badge}
              </span>
            )}
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
          {...tooltipProps}
        >
          {item.icon && (
            <span className="sidebar-item-icon">
              <item.icon />
            </span>
          )}
          <span className="sidebar-item-label">{item.label}</span>
          {item.badge && (
            <span className={`sidebar-sub-item-badge ${item.badge === 'NEW' ? 'sidebar-badge-new' : ''}`}>
              {item.badge}
            </span>
          )}
          {item.dot && <span className="sidebar-alert-dot" />}
        </Link>
      )}

      {expanded && hasSubItems && !collapsed && (
        <div className="sidebar-sub-items">
          {item.subItems.map((subItem, index) => {
            const isSubActive = activeItem === subItem.path;
            return (
              <Link
                key={subItem.id || subItem.path || index}
                to={subItem.path}
                className={`sidebar-sub-item ${
                  isSubActive ? 'sidebar-sub-item--active' : ''
                }`}
                onClick={handleNavigate}
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
