"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface User {
  id: string
  username: string
  full_name: string
  email: string
  role: "superadmin" | "manager" | "client" | "worker"
  company_id: string
}

interface AuthState {
  user: User | null
  token: string | null
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (userData: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
      login: (userData, token) => {
        set({ user: userData, token })
      },
      logout: () => {
        set({ user: null, token: null })
      },
    }),
    {
      name: "paintflow-auth", // The key in localStorage
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
