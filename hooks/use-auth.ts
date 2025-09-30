"use client"

import { useAuthStore } from "@/store/auth-store"
import { useEffect, useState } from "react"

export function useAuth() {
  const { user, token, login, logout, isLoaded } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const hasRole = (roles: string | string[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const isAdmin = () => hasRole("admin")
  const isSupervisor = () => hasRole("supervisor")
  const isWorker = () => hasRole("worker")
  const canManageJobs = () => hasRole(["admin", "supervisor"])

  // To prevent hydration mismatch, we'll only return the user and token
  // once the component has mounted on the client.
  if (!isMounted) {
    return {
      user: null,
      token: null,
      login,
      logout,
      isLoaded: false,
      hasRole: () => false,
      isAdmin: () => false,
      isSupervisor: () => false,
      isWorker: () => false,
      canManageJobs: () => false,
    }
  }

  return {
    user,
    token,
    login,
    logout,
    isLoaded,
    hasRole,
    isAdmin,
    isSupervisor,
    isWorker,
    canManageJobs,
  }
}
