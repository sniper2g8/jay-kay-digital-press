// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'Admin',
  STAFF: 'Staff', 
  SYSTEM_USER: 'System User',
  CUSTOMER: 'Customer'
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'manage_roles',
    'manage_services',
    'manage_jobs',
    'manage_customers',
    'manage_invoices',
    'manage_quotes',
    'manage_settings',
    'view_analytics',
    'manage_notifications',
    'manage_displays'
  ],
  [USER_ROLES.STAFF]: [
    'manage_jobs',
    'manage_customers', 
    'manage_invoices',
    'manage_quotes',
    'view_analytics',
    'manage_notifications'
  ],
  [USER_ROLES.SYSTEM_USER]: [
    'manage_jobs',
    'view_customers',
    'create_invoices',
    'view_quotes'
  ],
  [USER_ROLES.CUSTOMER]: [
    'create_jobs',
    'view_own_jobs',
    'view_own_invoices',
    'create_quotes',
    'view_own_quotes',
    'update_profile'
  ]
} as const;

export const hasPermission = (userRole: string, permission: string): boolean => {
  const roleKey = userRole as keyof typeof ROLE_PERMISSIONS;
  const permissions = ROLE_PERMISSIONS[roleKey];
  return permissions ? (permissions as readonly string[]).includes(permission) : false;
};

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type Permission = typeof ROLE_PERMISSIONS[typeof USER_ROLES.ADMIN][number];