import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createJSONStorage } from "zustand/middleware"

export interface User {
  id: string
  username: string
  full_name: string
  email: string
  role: "admin" | "supervisor" | "worker"
  company_id: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoaded: boolean
  login: (userData: User, token: string) => void
  logout: () => void
  setUser: (userData: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      isLoaded: false,
      login: (userData, token) => {
        localStorage.setItem("paintflow_token", token)
        localStorage.setItem("paintflow_user", JSON.stringify(userData))
        set({ user: userData, token })
      },
      logout: () => {
        localStorage.removeItem("paintflow_token")
        localStorage.removeItem("paintflow_user")
        set({ user: null, token: null })
      },
      setUser: userData => set({ user: userData }),
    }),
    {
      name: "paintflow-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        if (state) {
          state.isLoaded = true
        }
      },
    },
  ),
)
