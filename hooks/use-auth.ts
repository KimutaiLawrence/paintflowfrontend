"use client"

import { useAuthStore } from "@/store/auth-store"

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore()

  const hasRole = (roles: string | string[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const isAdmin = () => hasRole("admin")
  const isSupervisor = () => hasRole("supervisor")
  const isWorker = () => hasRole("worker")
  const canManageJobs = () => hasRole(["admin", "supervisor"])

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isAdmin,
    isSupervisor,
    isWorker,
    canManageJobs,
  }
}
