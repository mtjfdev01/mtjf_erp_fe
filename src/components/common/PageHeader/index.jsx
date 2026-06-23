import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { MdEdit, MdAdd } from "react-icons/md";
import { FaFilter } from "react-icons/fa6";

import './PageHeader.css';

const PageHeader = ({ 
  title, 
  backPath, 
  onBackClick, 
  showBackButton = true,
  className = '',
  showEdit = false,
  editPath = '',
  showAdd = false,
  addPath = '',
  addDisabled = false,
  addTitle = 'Add new',
  showFilterToggle = false,
  filtersOpen = false,
  onFilterToggle,
  filterTitle = 'Toggle filters',
  rightElement
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const handleEditClick = () => {
    if (editPath) {
      navigate(editPath);
    }
  };

  const handleAddClick = () => {
    if (addPath) {
      navigate(addPath);
    }
  };

  return (
    <div className={`page-header ${className}`}>
      <div className="page-header-content">
        {showBackButton && (
          <button 
            className="back-button"
            onClick={handleBackClick}
            title="Go back"
          >
            <FiArrowLeft />
          </button>
        )}
        <h1 className="page-title">{title}</h1>
        {showFilterToggle && (
          <button
            type="button"
            className={`back-button filter-toggle-button${filtersOpen ? ' filter-toggle-button--active' : ''}`}
            onClick={onFilterToggle}
            title={filterTitle}
            aria-label={filterTitle}
            aria-expanded={filtersOpen}
          >
            <FaFilter />
          </button>
        )}
        {showAdd && addPath && (
          <button 
            className={`back-button ${addDisabled ? 'disabled' : ''}`}
            onClick={handleAddClick}
            title={addTitle}
            disabled={addDisabled}
          >
            <MdAdd />
          </button>
        )}
        {showEdit && editPath && (
          <button 
            className="back-button"
            onClick={handleEditClick}
            title="Edit"
          >
            <MdEdit />
          </button>
        )}
        {rightElement}
      </div>
    </div>
  );
};

export default PageHeader; 