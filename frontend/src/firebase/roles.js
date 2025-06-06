// User roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  RESPONDER: 'responder'
};

// Responder statuses
export const RESPONDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Role validation and normalization
export const normalizeRole = (role) => {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Check if the normalized role is valid
  if (Object.values(ROLES).includes(normalizedRole)) {
    return normalizedRole;
  }
  
  // Handle legacy or alternative role names
  switch (normalizedRole) {
    case 'administrator':
    case 'superadmin':
      return ROLES.ADMIN;
    case 'regular':
    case 'normal':
      return ROLES.USER;
    case 'responder':
    case 'emergency':
      return ROLES.RESPONDER;
    default:
      return null;
  }
};

// Role validation
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(normalizeRole(role));
};

// Role-based access control
export const hasRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  return normalizeRole(userRole) === normalizeRole(requiredRole);
};

// Role hierarchy
export const roleHierarchy = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.RESPONDER, ROLES.USER],
  [ROLES.RESPONDER]: [ROLES.RESPONDER, ROLES.USER],
  [ROLES.USER]: [ROLES.USER]
};

// Check if user has required role or higher
export const hasRequiredRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedRequiredRole = normalizeRole(requiredRole);
  
  if (!normalizedUserRole || !normalizedRequiredRole) return false;
  
  return roleHierarchy[normalizedUserRole]?.includes(normalizedRequiredRole) || false;
};

export const RESPONDER_TYPES = {
  MEDICAL: 'Medical',
  POLICE: 'Police',
  FIRE: 'Fire',
  TRAFFIC: 'Traffic'
};

// Define permissions for each role
export const PERMISSIONS = {
  [ROLES.USER]: [
    'report-incident',
    'view-own-reports',
    'post-forum',
    'comment-forum',
    'like-forum'
  ],
  [ROLES.RESPONDER]: [
    'view-assigned-incidents',
    'update-incident-status',
    'view-own-profile',
    'post-forum',
    'comment-forum',
    'like-forum'
  ],
  [ROLES.ADMIN]: [
    'view-all-incidents',
    'manage-responders',
    'approve-responders',
    'view-analytics',
    'moderate-forum',
    'manage-content',
    'create-admin'
  ]
};

// Helper function to check if a user has permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  return PERMISSIONS[userRole]?.includes(permission) || false;
};

// Helper function to validate responder type
export const isValidResponderType = (type) => {
  return Object.values(RESPONDER_TYPES).includes(type);
}; 