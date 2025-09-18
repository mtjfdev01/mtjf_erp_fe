import React, { useState } from 'react';
import SidebarItem from './SidebarItem';
import './Sidebar.css';

const SidebarGroup = ({ group, collapsed, activeItem, onItemClick }) => {
  const [expanded, setExpanded] = useState(true);

  const isActiveGroup = group.items.some(item => 
    activeItem.startsWith(item.path) || 
    item.subItems?.some(subItem => activeItem.startsWith(subItem.path))
  );

  const handleGroupClick = () => {
    setExpanded(e => !e);
  };

  return (
    <div className="sidebar-group">
      <div 
        className={`sidebar-group-header ${isActiveGroup ? 'sidebar-group-header--active' : ''}`}
        onClick={handleGroupClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="sidebar-group-label">{group.label}</span>
        <span className={`sidebar-group-arrow${expanded ? ' sidebar-group-arrow--expanded' : ''}`}>▼</span>
      </div>
      {!collapsed && expanded && (
        <div className="sidebar-group-items">
          {group.items.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              activeItem={activeItem}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarGroup; 