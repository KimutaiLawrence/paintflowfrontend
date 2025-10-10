import { useAuthStore } from "@/store/auth-store"
import { validateToken, clearAuthData, isTokenExpired } from "./auth-utils"

class SessionManager {
  private validationInterval: NodeJS.Timeout | null = null
  private readonly VALIDATION_INTERVAL = 30 * 60 * 1000 // 30 minutes (much less frequent)
  private readonly MAX_VALIDATION_AGE = 24 * 60 * 60 * 1000 // 24 hours

  start() {
    // Clear any existing interval
    this.stop()
    
    // Only validate if we haven't validated in a long time
    this.validateSessionIfNeeded()
    
    // Set up much less frequent validation (30 minutes)
    this.validationInterval = setInterval(() => {
      this.validateSessionIfNeeded()
    }, this.VALIDATION_INTERVAL)
  }

  stop() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
      this.validationInterval = null
    }
  }

  private validateSessionIfNeeded() {
    const { user, token } = useAuthStore.getState()
    
    if (!user || !token) {
      return
    }

    // Check if token is expired locally first
    if (isTokenExpired(token)) {
      console.log("Token is expired, clearing session")
      clearAuthData()
      return
    }

    // Only validate with server if we haven't validated in 24 hours
    const lastValidation = localStorage.getItem('paintflow_last_validation')
    const now = Date.now()

    if (lastValidation) {
      const timeSinceValidation = now - parseInt(lastValidation)
      if (timeSinceValidation < this.MAX_VALIDATION_AGE) {
        return // Skip validation if we validated recently
      }
    }

    // Validate with server only when absolutely necessary
    this.validateSessionWithServer()
  }

  private async validateSessionWithServer() {
    const { user, token } = useAuthStore.getState()
    
    if (!user || !token) {
      return
    }

    try {
      const result = await validateToken(token)
      
      if (!result.isValid) {
        console.log("Token validation failed, clearing session")
        clearAuthData()
      } else {
        // Update last validation time
        localStorage.setItem('paintflow_last_validation', Date.now().toString())
      }
    } catch (error) {
      console.error("Session validation error:", error)
      // Don't clear session on network errors, just log
    }
  }

  // Manual session validation (useful for critical operations)
  async validateSessionNow(): Promise<boolean> {
    const { user, token } = useAuthStore.getState()
    
    if (!user || !token) {
      return false
    }

    if (isTokenExpired(token)) {
      clearAuthData()
      return false
    }

    try {
      const result = await validateToken(token)
      return result.isValid
    } catch (error) {
      console.error("Session validation error:", error)
      return false
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()

// Auto-start session manager when module is imported
if (typeof window !== 'undefined') {
  sessionManager.start()
}
