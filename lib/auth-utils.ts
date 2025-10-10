import { useAuthStore } from "@/store/auth-store"

export interface TokenValidationResult {
  isValid: boolean
  user?: any
  error?: string
}

export async function validateToken(token: string): Promise<TokenValidationResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const user = await response.json()
      return { isValid: true, user }
    } else {
      return { isValid: false, error: 'Token validation failed' }
    }
  } catch (error) {
    return { isValid: false, error: 'Network error during token validation' }
  }
}

export function clearAuthData() {
  // Clear Zustand store
  useAuthStore.getState().logout()
  
  // Clear localStorage (only on client side)
  if (typeof window !== 'undefined') {
    localStorage.removeItem("paintflow-auth")
    localStorage.removeItem("paintflow_token")
    localStorage.removeItem("paintflow_user")
  }
}

export function getStoredAuthData() {
  // Only run on client side
  if (typeof window === 'undefined') {
    return { user: null, token: null, isLoaded: false }
  }
  
  try {
    const authData = localStorage.getItem("paintflow-auth")
    if (authData) {
      const parsed = JSON.parse(authData)
      return {
        user: parsed.state?.user,
        token: parsed.state?.token,
        isLoaded: parsed.state?.isLoaded || false
      }
    }
  } catch (error) {
    console.error("Failed to parse stored auth data:", error)
  }
  
  return { user: null, token: null, isLoaded: false }
}

export function isTokenExpired(token: string): boolean {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) return true
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    // Check if token is expired
    return payload.exp < currentTime
  } catch (error) {
    console.error("Failed to parse token:", error)
    return true
  }
}
