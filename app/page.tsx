"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { PageLoader } from "@/components/ui/custom-loader"

export default function HomePage() {
  const { isAuthenticated, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once we've determined the authentication state.
    if (isLoaded) {
      if (isAuthenticated) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [isAuthenticated, isLoaded, router])

  // Show a loader while we are determining the auth state.
  return <PageLoader className="min-h-screen" />
}
