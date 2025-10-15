/**
 * Permission utility functions for checking user permissions
 * Based on the permission structure: department.module.action
 */

/**
 * Check if user has a specific permission
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @param {string} action - Action name (view, create, update, delete, list_view)
 * @returns {boolean} - Whether user has the permission
 */
export const hasPermission = (permissions, department, module, action) => {
  if (!permissions || !department || !module || !action) {
    return false;
  }
  
  return permissions[department]?.[module]?.[action] === true;
};

/**
 * Check if user has any permission for a specific module
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @returns {boolean} - Whether user has any permission for the module
 */
export const hasModuleAccess = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return false;
  }
  
  const modulePermissions = permissions[department]?.[module];
  if (!modulePermissions) {
    return false;
  }
  
  // Check if user has any permission (view, create, update, delete, list_view)
  return Object.values(modulePermissions).some(permission => permission === true);
};

/**
 * Check if user has access to a department
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @returns {boolean} - Whether user has access to the department
 */
export const hasDepartmentAccess = (permissions, department) => {
  if (!permissions || !department) {
    return false;
  }
  
  const departmentPermissions = permissions[department];
  if (!departmentPermissions) {
    return false;
  }
  
  // Check if department has any modules with permissions
  return Object.keys(departmentPermissions).length > 0;
};

/**
 * Check if user has list_view permission for a module (for sidebar display)
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @returns {boolean} - Whether user can see the module in sidebar
 */
export const canViewModule = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return false;
  }
  
  const modulePermissions = permissions[department]?.[module];
  if (!modulePermissions) {
    return false;
  }
  
  // User can view module if they have view or list_view permission
  return modulePermissions.view === true || modulePermissions.list_view === true;
};

/**
 * Check if user is super admin
 * @param {Object} permissions - User permissions object
 * @returns {boolean} - Whether user is super admin
 */
export const isSuperAdmin = (permissions) => {
  return permissions?.super_admin === true;
};

/**
 * Get all modules user has access to in a department
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @returns {Array} - Array of module names user can access
 */
export const getAccessibleModules = (permissions, department) => {
  if (!permissions || !department) {
    return [];
  }
  
  const departmentPermissions = permissions[department];
  if (!departmentPermissions) {
    return [];
  }
  
  return Object.keys(departmentPermissions).filter(module => 
    hasModuleAccess(permissions, department, module)
  );
};

/**
 * Get user's permissions for a specific module
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @returns {Object} - Object with permission flags
 */
export const getModulePermissions = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return {
      view: false,
      create: false,
      update: false,
      delete: false,
      list_view: false
    };
  }
  
  const modulePermissions = permissions[department]?.[module] || {};
  
  return {
    view: modulePermissions.view === true,
    create: modulePermissions.create === true,
    update: modulePermissions.update === true,
    delete: modulePermissions.delete === true,
    list_view: modulePermissions.list_view === true
  };
};

export default {
  hasPermission,
  hasModuleAccess,
  hasDepartmentAccess,
  canViewModule,
  isSuperAdmin,
  getAccessibleModules,
  getModulePermissions
};
