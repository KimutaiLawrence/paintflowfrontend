"use client"

import { useAuthStore } from "@/store/auth-store"

export function useAuth() {
  const { user, token, login, logout, _hasHydrated } = useAuthStore()

  const hasRole = (roles: string | string[]) => {
    if (!_hasHydrated || !user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const isSuperAdmin = () => hasRole("superadmin")
  const isManager = () => hasRole("manager")
  const isClient = () => hasRole("client")
  const isWorker = () => hasRole("worker")
  const canManageJobs = () => hasRole(["superadmin", "manager"])
  const canDelete = () => hasRole(["superadmin", "manager"])
  const canEdit = () => hasRole(["superadmin", "manager", "worker"])
  const canCreate = () => hasRole(["superadmin", "manager", "client", "worker"])
  const canManageUsers = () => hasRole(["superadmin", "manager"])

  return {
    user,
    token,
    login,
    logout,
    isLoaded: _hasHydrated,
    isAuthenticated: !!user && _hasHydrated,
    hasRole,
    isSuperAdmin,
    isManager,
    isClient,
    isWorker,
    canManageJobs,
    canDelete,
    canEdit,
    canCreate,
    canManageUsers,
  }
}
