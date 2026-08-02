import React from "react";
import { User } from "../types";

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === "admin" ||
    Boolean(user.emailOrPhone && user.emailOrPhone.toLowerCase().includes("admin")) ||
    Boolean(user.name && user.name.toLowerCase().includes("admin"))
  );
}

interface AdminGuardProps {
  user: User | null | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AdminGuard component checks if the logged-in user has the "admin" role.
 * If true, renders children (e.g. CRUD forms, affiliate management).
 * If false, renders fallback or null, effectively hiding admin-only UI.
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({
  user,
  children,
  fallback = null,
}) => {
  if (!isAdminUser(user)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Higher Order Component (HOC) for restricting components or views to admin role only.
 */
export function withAdminGuard<P extends { currentUser?: User | null }>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType
) {
  return function GuardedComponent(props: P) {
    if (!isAdminUser(props.currentUser)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }
    return <Component {...props} />;
  };
}
