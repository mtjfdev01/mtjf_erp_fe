import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import './UserPermissions.css';
import { toast } from 'react-toastify';
import { FiCloudLightning } from 'react-icons/fi';

const UserPermissions = ({ user, onSave, onCancel, isOpen }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize permissions when user data is available
  useEffect(() => {
    if (user?.permissions?.permissions) {
      setPermissions(user.permissions.permissions);
    }
  }, [user]);

  // Module structure with sub-modules and actions
  const moduleStructure = {
    accounts_and_finance: {
      label: 'Accounts & Finance',
      submodules: {
        reports: {
          label: 'Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        dashboard: {
          label: 'Dashboard',
          actions: ['view']
        }
      }
    },
    procurements: {
      label: 'Procurements',
      submodules: {
        reports: {
          label: 'Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        dashboard: {
          label: 'Dashboard',
          actions: ['view']
        }
      }
    },
    store: {
      label: 'Store',
      submodules: {
        reports: {
          label: 'Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        dashboard: {
          label: 'Dashboard',
          actions: ['view']
        }
      }
    },
    program: {
      label: 'Program',
      submodules: {
        application_reports: {
          label: 'Application Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        area_ration_reports: {
          label: 'Area Ration Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        education_reports: {
          label: 'Education Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        financial_assistance_reports: {
          label: 'Financial Assistance Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        kasb_reports: {
          label: 'Kasb Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        kasb_training_reports: {
          label: 'Kasb Training Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        marriage_gifts_reports: {
          label: 'Marriage Gifts Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        ration_reports: {
          label: 'Ration Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        sewing_machine_reports: {
          label: 'Sewing Machine Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        tree_plantation_reports: {
          label: 'Tree Plantation Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        water_reports: {
          label: 'Water Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        wheel_chair_or_crutches_reports: {
          label: 'Wheel Chair or Crutches Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        dashboard: {
          label: 'Dashboard',
          actions: ['view']
        },
        targets: {
          label: 'Targets',
          actions: ['create','list_view', 'view', 'update', 'delete']
        }
      }
    },
    admin: {
      label: 'Admin',
      submodules: {
        users: {
          label: 'Users',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        dashboard: {
          label: 'Dashboard',
          actions: ['view']
        }
      }
    },
    fund_raising: {
      label: 'Fund Raising',
      submodules: {
        donations: {
          label: 'Donations',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        donation_box: {
          label: 'Donation Box',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        donors: {
          label: 'Donors',
          actions: ['create','list_view', 'view', 'update', 'delete']
        },
        dashboard: {
          label: 'Dashboard',
          actions: ['view']
        }
      }
    },
    it: {
      label: 'IT',
      submodules: {
        reports: {
          label: 'Reports',
          actions: ['create','list_view', 'view', 'update', 'delete']
        }
      }
    },
    permissions: {
      label: 'Permissions',
      submodules: {
        manage: {
          label: 'Manage Permissions',
          actions: ['create','list_view', 'view', 'update', 'delete']
        }
      }
    }
  };

  // Action labels
  const actionLabels = {
    list_view: 'List View',
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete'
  };

  const initializePermissions = () => {
    const initialPermissions = {};
    
    Object.keys(moduleStructure).forEach(moduleKey => {
      initialPermissions[moduleKey] = {};
      Object.keys(moduleStructure[moduleKey].submodules).forEach(submoduleKey => {
        initialPermissions[moduleKey][submoduleKey] = {};
        moduleStructure[moduleKey].submodules[submoduleKey].actions.forEach(action => {
          initialPermissions[moduleKey][submoduleKey][action] = false;
        });
      });
    });
    
    return initialPermissions;
  };

  const handlePermissionChange = (moduleKey, submoduleKey, action, value) => {
    const updatedPermissions = {
      ...permissions,
      [moduleKey]: {
        ...permissions[moduleKey],
        [submoduleKey]: {
          ...permissions[moduleKey]?.[submoduleKey],
          [action]: value
        }
      }
    };
    
    setPermissions(updatedPermissions);
    
    // Update the user object with new permissions
    const updatedUser = {
      ...user,
      permissions: {
        ...user.permissions,
        permissions: updatedPermissions
      }
    };
    
    console.log('Updated user with new permissions:', updatedUser);
  };

  const handleModuleToggle = (moduleKey, value) => {
    const module = moduleStructure[moduleKey];
    const newPermissions = { ...permissions };
    
    if (!newPermissions[moduleKey]) {
      newPermissions[moduleKey] = {};
    }
    
    Object.keys(module.submodules).forEach(submoduleKey => {
      if (!newPermissions[moduleKey][submoduleKey]) {
        newPermissions[moduleKey][submoduleKey] = {};
      }
      
      module.submodules[submoduleKey].actions.forEach(action => {
        newPermissions[moduleKey][submoduleKey][action] = value;
      });
    });
    
    setPermissions(newPermissions);
    
    // Update the user object with new permissions
    const updatedUser = {
      ...user,
      permissions: {
        ...user.permissions,
        permissions: newPermissions
      }
    };
    
    console.log('Updated user with new permissions:', updatedUser);
  };

  const handleSubmoduleToggle = (moduleKey, submoduleKey, value) => {
    const submodule = moduleStructure[moduleKey].submodules[submoduleKey];
    const newPermissions = { ...permissions };
    
    if (!newPermissions[moduleKey]) {
      newPermissions[moduleKey] = {};
    }
    if (!newPermissions[moduleKey][submoduleKey]) {
      newPermissions[moduleKey][submoduleKey] = {};
    }
    
    submodule.actions.forEach(action => {
      newPermissions[moduleKey][submoduleKey][action] = value;
    });
    
    setPermissions(newPermissions);
    
    // Update the user object with new permissions
    const updatedUser = {
      ...user,
      permissions: {
        ...user.permissions,
        permissions: newPermissions
      }
    };
    
    console.log('Updated user with new permissions:', updatedUser);
  };

  const handleSave = async () => {
    if (!user?.id) {
      try {
        if (onSave) onSave(permissions);
      } catch (error) {
        setError('User ID is required');
      }
    }

    try {
      setSaving(true);
      setError('');
      
      // Create payload with only user data and permissions
      const updatePayload = {
        ...user,
        permissions: permissions
      };
      
      console.log('User before permissions update:', user);
      console.log('Update payload:', updatePayload);
      
      // Use the existing PATCH endpoint
      const response = await axiosInstance.patch(`/users/${user.id}`, updatePayload);
      
      if (response.data) {
        console.log('User after combined update:', response.data);
        toast.success('User and permissions updated successfully');
        if (onSave) onSave(permissions);
      } else {
        setError('Failed to update user and permissions');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleSuperAdminToggle = (checked) => {
    const updatedPermissions = {
      ...permissions,
      super_admin: checked
    };
    
    setPermissions(updatedPermissions);
    
    // Update the user object with new permissions
    const updatedUser = {
      ...user,
      permissions: {
        ...user.permissions,
        permissions: updatedPermissions
      }
    };
    
    console.log('Updated user with new permissions:', updatedUser);
  };

  const handleCancel = () => {
    setPermissions({});
    setError('');
    if (onCancel) onCancel();
  };

  const isModuleChecked = (moduleKey) => {
    const module = moduleStructure[moduleKey];
    if (!permissions[moduleKey]) return false;
    
    return Object.keys(module.submodules).every(submoduleKey => {
      const submodule = module.submodules[submoduleKey];
      return submodule.actions.every(action => 
        permissions[moduleKey]?.[submoduleKey]?.[action] === true
      );
    });
  };

  const isModuleIndeterminate = (moduleKey) => {
    const module = moduleStructure[moduleKey];
    if (!permissions[moduleKey]) return false;
    
    const hasChecked = Object.keys(module.submodules).some(submoduleKey => {
      const submodule = module.submodules[submoduleKey];
      return submodule.actions.some(action => 
        permissions[moduleKey]?.[submoduleKey]?.[action] === true
      );
    });
    
    const allChecked = isModuleChecked(moduleKey);
    
    return hasChecked && !allChecked;
  };

  const isSubmoduleChecked = (moduleKey, submoduleKey) => {
    const submodule = moduleStructure[moduleKey].submodules[submoduleKey];
    if (!permissions[moduleKey]?.[submoduleKey]) return false;
    
    return submodule.actions.every(action => 
      permissions[moduleKey][submoduleKey][action] === true
    );
  };

  const isSubmoduleIndeterminate = (moduleKey, submoduleKey) => {
    const submodule = moduleStructure[moduleKey].submodules[submoduleKey];
    if (!permissions[moduleKey]?.[submoduleKey]) return false;
    
    const hasChecked = submodule.actions.some(action => 
      permissions[moduleKey][submoduleKey][action] === true
    );
    
    const allChecked = isSubmoduleChecked(moduleKey, submoduleKey);
    
    return hasChecked && !allChecked;
  };

  if (!isOpen) return null;

  return (
    <div className="user-permissions-overlay">
      <div className="user-permissions-modal">
        <div className="user-permissions-header">
          <h2>User Permissions</h2>
          {user && (
            <div className="user-info">
              <span className="user-name">{user.first_name} {user.last_name}</span>
              <span className="user-department">({user.department})</span>
            </div>
          )}
          <button className="close-btn" onClick={handleCancel}>&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="user-permissions-content">

          {loading ? (
            <div className="loading">Loading permissions...</div>
          ) : (
            <div className="permissions-container">
              {/* Super Admin Checkbox */}
              <div className="super-admin-section">
                <div className="super-admin-header">
                  <label className="super-admin-checkbox">
                      <input
                        type="checkbox"
                        checked= {user?.permissions?.permissions?.super_admin || false}
                        onChange={(e) => handleSuperAdminToggle(e.target.checked)}
                      />
                    <span className="checkmark"></span>
                    <span className="super-admin-label">Super Admin (Full Access)</span>
                  </label>
                </div>
                {/* <div className="super-admin-description">
                  Grant all permissions across all modules and features
                </div> */}
              </div>

              {Object.keys(moduleStructure).map(moduleKey => {
                const module = moduleStructure[moduleKey];
                const moduleChecked = isModuleChecked(moduleKey);
                const moduleIndeterminate = isModuleIndeterminate(moduleKey);
                
                return (
                  <div key={moduleKey} className="module-section">
                    <div className="module-header">
                      <label className="module-checkbox">
                        <input
                          type="checkbox"
                          checked={moduleChecked}
                          ref={input => {
                            if (input) input.indeterminate = moduleIndeterminate;
                          }}
                          onChange={(e) => handleModuleToggle(moduleKey, e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <span className="module-label">{module.label}</span>
                      </label>
                    </div>
                    
                    <div className="submodules-container">
                      {Object.keys(module.submodules).map(submoduleKey => {
                        const submodule = module.submodules[submoduleKey];
                        const submoduleChecked = isSubmoduleChecked(moduleKey, submoduleKey);
                        const submoduleIndeterminate = isSubmoduleIndeterminate(moduleKey, submoduleKey);
                        
                        return (
                          <div key={submoduleKey} className="submodule-section">
                            <div className="submodule-header">
                              <label className="submodule-checkbox">
                                <input
                                  type="checkbox"
                                  checked={submoduleChecked}
                                  ref={input => {
                                    if (input) input.indeterminate = submoduleIndeterminate;
                                  }}
                                  onChange={(e) => handleSubmoduleToggle(moduleKey, submoduleKey, e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                <span className="submodule-label">{submodule.label}</span>
                              </label>
                            </div>
                            
                            <div className="actions-container">
                              {submodule.actions.map(action => (
                                <label key={action} className="action-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={permissions[moduleKey]?.[submoduleKey]?.[action] || false}
                                    onChange={(e) => handlePermissionChange(moduleKey, submoduleKey, action, e.target.checked)}
                                  />
                                  <span className="checkmark"></span>
                                  <span className="action-label">{actionLabels[action]}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="user-permissions-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissions; 