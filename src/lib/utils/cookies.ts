/**
 * Cookie Utilities
 *
 * PURPOSE: Read tenant context (branchId, tenantId, posId) from cookies
 * These values are set during login and used for API calls
 */

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
}

/**
 * Get branch ID from cookie (set during login)
 */
export function getBranchIdFromCookie(): string | null {
  return getCookie('pos-branch-id');
}

/**
 * Get tenant ID from cookie (set during login)
 */
export function getTenantIdFromCookie(): string | null {
  return getCookie('pos-tenant-id');
}

/**
 * Get POS/terminal ID from cookie (set during login)
 */
export function getPosIdFromCookie(): string | null {
  return getCookie('pos-terminal-id');
}

/**
 * Get all tenant context from cookies
 */
export function getTenantContext(): {
  branchId: string | null;
  tenantId: string | null;
  posId: string | null;
} {
  return {
    branchId: getBranchIdFromCookie(),
    tenantId: getTenantIdFromCookie(),
    posId: getPosIdFromCookie(),
  };
}
