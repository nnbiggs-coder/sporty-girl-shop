import { appConfig } from "@/lib/config";

export interface AdminUser {
  email: string;
}

/**
 * Single source of truth for admin access checks.
 * All admin route guards and components MUST use this function.
 * Do not inline email checks anywhere else in the codebase.
 */
export function isAdmin(user: AdminUser | null | undefined): boolean {
  if (!user?.email) return false;

  const allowlist = process.env.ADMIN_EMAILS ?? "";
  const adminEmails = allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(user.email.toLowerCase());
}

export function requireAdmin(user: AdminUser | null | undefined): void {
  if (!isAdmin(user)) {
    throw new Error("Unauthorized: admin access required");
  }
}

export { appConfig };
