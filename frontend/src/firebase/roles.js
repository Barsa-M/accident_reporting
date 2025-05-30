// Role definitions and permissions
export const ROLES = {
  USER: 'User',
  RESPONDER: 'Responder',
  ADMIN: 'Admin'
};

export const RESPONDER_TYPES = {
  MEDICAL: 'Medical',
  POLICE: 'Police',
  FIRE: 'Fire',
  TRAFFIC: 'Traffic'
};

export const RESPONDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
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

// Helper function for case-insensitive role comparison
export const normalizeRole = (role) => {
  if (!role) return null;
  const normalizedRole = role.toLowerCase();
  
  // Check against lowercase versions of roles
  if (normalizedRole === ROLES.ADMIN.toLowerCase()) return ROLES.ADMIN;
  if (normalizedRole === ROLES.USER.toLowerCase()) return ROLES.USER;
  if (normalizedRole === ROLES.RESPONDER.toLowerCase()) return ROLES.RESPONDER;
  
  return null;
};

// Helper function to validate role
export const isValidRole = (role) => {
  return normalizeRole(role) !== null;
}; 