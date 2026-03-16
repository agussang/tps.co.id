/**
 * Password Policy Validation Utility
 * Reads policy from site_settings table and validates passwords
 */

import { g } from "utils/global";

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_number: boolean;
  require_special: boolean;
  expiry_days: number;
  auto_deactivate_days: number;
}

const DEFAULT_POLICY: PasswordPolicy = {
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special: false,
  expiry_days: 90,
  auto_deactivate_days: 0,
};

export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  if (!g.db) return DEFAULT_POLICY;

  try {
    const settings = await (g.db as any).site_settings.findMany({
      where: {
        key: {
          in: [
            "password_min_length",
            "password_require_uppercase",
            "password_require_lowercase",
            "password_require_number",
            "password_require_special",
            "password_expiry_days",
            "auto_deactivate_days",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    return {
      min_length: parseInt(map.password_min_length || "8") || 8,
      require_uppercase: map.password_require_uppercase === "true",
      require_lowercase: map.password_require_lowercase === "true",
      require_number: map.password_require_number === "true",
      require_special: map.password_require_special === "true",
      expiry_days: parseInt(map.password_expiry_days || "90") || 0,
      auto_deactivate_days: parseInt(map.auto_deactivate_days || "0") || 0,
    };
  } catch (e) {
    return DEFAULT_POLICY;
  }
}

export function validatePassword(
  password: string,
  policy: PasswordPolicy
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.min_length) {
    errors.push(`Minimal ${policy.min_length} karakter`);
  }
  if (policy.require_uppercase && !/[A-Z]/.test(password)) {
    errors.push("Harus mengandung huruf besar");
  }
  if (policy.require_lowercase && !/[a-z]/.test(password)) {
    errors.push("Harus mengandung huruf kecil");
  }
  if (policy.require_number && !/[0-9]/.test(password)) {
    errors.push("Harus mengandung angka");
  }
  if (policy.require_special && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Harus mengandung karakter spesial");
  }

  return { valid: errors.length === 0, errors };
}

export function isPasswordExpired(
  passwordChangedAt: Date | null,
  expiryDays: number
): boolean {
  if (expiryDays <= 0) return false;
  if (!passwordChangedAt) return true; // Never changed = expired

  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  return new Date() > expiryDate;
}

export function shouldAutoDeactivate(
  lastLogin: Date | null,
  autoDeactivateDays: number
): boolean {
  if (autoDeactivateDays <= 0) return false;
  if (!lastLogin) return false; // Never logged in, don't deactivate

  const deactivateDate = new Date(lastLogin);
  deactivateDate.setDate(deactivateDate.getDate() + autoDeactivateDays);
  return new Date() > deactivateDate;
}
