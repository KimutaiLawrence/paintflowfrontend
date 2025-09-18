import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        localStorage.setItem("paintflow_token", token)
        localStorage.setItem("paintflow_user", JSON.stringify(user))
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem("paintflow_token")
        localStorage.removeItem("paintflow_user")
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: "paintflow-auth",
    },
  ),
)
