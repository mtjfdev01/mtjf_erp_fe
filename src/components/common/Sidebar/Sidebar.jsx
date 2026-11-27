import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SidebarGroup from './SidebarGroup';
import { getSidebarConfig } from './sidebarConfig';
import { FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { FaArrowRightArrowLeft } from 'react-icons/fa6';
import './Sidebar.css';

const SIDEBAR_WIDTH_KEY = 'mtjf_sidebar_width';
const SIDEBAR_DEFAULT_WIDTH = 268;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 480;

const clampSidebarWidth = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(n)));
};

const readStoredSidebarWidth = () => {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (raw == null) return SIDEBAR_DEFAULT_WIDTH;
    return clampSidebarWidth(raw);
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(readStoredSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ active: false });
  const location = useLocation();
  const { user, permissions } = useAuth();

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  // Keep page content offset in sync with sidebar width (avoids horizontal page scroll).
  useEffect(() => {
    document.body.classList.toggle('sidebar-is-collapsed', collapsed);
    document.body.classList.toggle('sidebar-is-expanded', !collapsed);
    return () => {
      document.body.classList.remove('sidebar-is-collapsed', 'sidebar-is-expanded');
    };
  }, [collapsed]);

  // Apply stretchable width via CSS variable (collapse still uses --sidebar-width-collapsed).
  useEffect(() => {
    const px = `${sidebarWidth}px`;
    document.documentElement.style.setProperty('--sidebar-width', px);
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* ignore quota / private mode */
    }
  }, [sidebarWidth]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
    };
  }, []);

  const handleNavigate = () => {
    setMobileOpen(false);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const stopResize = useCallback(() => {
    if (!resizeRef.current.active) return;
    resizeRef.current.active = false;
    setIsResizing(false);
    document.body.classList.remove('sidebar-is-resizing');
  }, []);

  const onResizeMove = useCallback((event) => {
    if (!resizeRef.current.active) return;
    const next = clampSidebarWidth(event.clientX);
    setSidebarWidth(next);
  }, []);

  useEffect(() => {
    if (!isResizing) return undefined;
    const onUp = () => stopResize();
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isResizing, onResizeMove, stopResize]);

  const startResize = (event) => {
    if (collapsed || window.matchMedia('(max-width: 768px)').matches) return;
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current.active = true;
    setIsResizing(true);
    document.body.classList.add('sidebar-is-resizing');
  };

  const sidebarConfig = getSidebarConfig(user, permissions);

  return (
    <>
      {/* Mobile Hamburger Icon */}
      <button
        type="button"
        className={`mobile-hamburger${mobileOpen ? ' mobile-hamburger--shifted' : ''}`}
        onClick={toggleMobile}
        title="Toggle Sidebar"
      >
        <FaArrowRightArrowLeft />
      </button>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <div
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${
          mobileOpen ? 'sidebar--mobile-open' : ''
        } ${isResizing ? 'sidebar--resizing' : ''}`}
        style={
          collapsed
            ? undefined
            : {
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                maxWidth: `${sidebarWidth}px`,
              }
        }
      >
        <div className="sidebar-content">
          {/* Global Toggle Button */}
          <div className="sidebar-toggle-container">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            </button>
          </div>

          {sidebarConfig.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              collapsed={collapsed}
              activeItem={activeItem}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {!collapsed && (
          <div
            className="sidebar-resize-handle"
            onPointerDown={startResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={SIDEBAR_MAX_WIDTH}
            aria-valuenow={sidebarWidth}
            title="Drag to resize"
          />
        )}
      </div>
    </>
  );
};

export default Sidebar;
