import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowDown } from "react-icons/io";
import SidebarItem from './SidebarItem';
import './Sidebar.css';

const SidebarGroup = ({ group, collapsed, activeItem, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);

  const singleLink =
    group.items?.length === 1 &&
    group.items[0]?.path &&
    !(group.items[0].subItems?.length)
      ? group.items[0]
      : null;

  const isActiveGroup = group.items.some(item =>
    activeItem.startsWith(item.path) ||
    item.subItems?.some(subItem => activeItem.startsWith(subItem.path))
  );

  const handleGroupClick = () => {
    setExpanded(e => !e);
  };

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

  // Single leaf item → main menu header is the link (no nested submenu)
  if (singleLink) {
    const Icon = singleLink.icon || group.icon;
    return (
      <div className="sidebar-group">
        <Link
          to={singleLink.path}
          className={`sidebar-group-header ${isActiveGroup ? 'sidebar-group-header--active' : ''}`}
          onClick={handleNavigate}
        >
          {Icon && <span className="sidebar-group-icon"><Icon /></span>}
          <span className="sidebar-group-label">{group.label}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="sidebar-group">
      <div
        className={`sidebar-group-header ${isActiveGroup ? 'sidebar-group-header--active' : ''}`}
        onClick={handleGroupClick}
        style={{ cursor: 'pointer' }}
      >
        {group.icon && <span className="sidebar-group-icon"><group.icon /></span>}
        <span className="sidebar-group-label">{group.label}</span>
        <span className={`sidebar-group-arrow${expanded ? ' sidebar-group-arrow--expanded' : ''}`}>
          <IoIosArrowDown />
        </span>
      </div>
      {!collapsed && expanded && (
        <div className="sidebar-group-items">
          {group.items.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              activeItem={activeItem}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarGroup;
