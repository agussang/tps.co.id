/**
 * Role Permission Utilities
 * Load and check structure-level CRUD permissions per role
 */

import { g } from "utils/global";

export interface Permission {
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const DEFAULT_DENIED: Permission = {
  can_view: false,
  can_add: false,
  can_edit: false,
  can_delete: false,
};

const FULL_ACCESS: Permission = {
  can_view: true,
  can_add: true,
  can_edit: true,
  can_delete: true,
};

/**
 * Load all permissions for a role.
 * Returns Map<structureId, Permission>
 */
export async function loadRolePermissions(
  roleId: number
): Promise<Map<string, Permission>> {
  const permMap = new Map<string, Permission>();
  if (!g.db) return permMap;

  try {
    const permissions = await (g.db as any).role_permission.findMany({
      where: { id_role: roleId },
    });

    for (const p of permissions) {
      permMap.set(p.id_structure, {
        can_view: !!p.can_view,
        can_add: !!p.can_add,
        can_edit: !!p.can_edit,
        can_delete: !!p.can_delete,
      });
    }
  } catch (e) {
    console.error("[PERMISSIONS] Error loading:", e);
  }

  return permMap;
}

/**
 * Get permission for a specific structure.
 * Superadmin always gets full access.
 */
export function getPermission(
  roleName: string,
  structureId: string,
  permMap: Map<string, Permission>
): Permission {
  if (roleName === "superadmin") return FULL_ACCESS;

  return permMap.get(structureId) || DEFAULT_DENIED;
}

/**
 * Check if user has specific permission on a structure.
 * Superadmin bypasses all checks.
 */
export function hasPermission(
  roleName: string,
  structureId: string,
  action: keyof Permission,
  permMap: Map<string, Permission>
): boolean {
  if (roleName === "superadmin") return true;
  const perm = permMap.get(structureId);
  return perm ? perm[action] : false;
}
