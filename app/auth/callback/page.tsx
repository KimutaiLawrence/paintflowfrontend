"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PageLoader } from "@/components/ui/custom-loader"
import api from '@/lib/api'

function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    
    const authenticate = async (authToken: string) => {
      try {
        // Use the token to fetch user data
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const user = response.data
        
        // Now login with both token and user object
        login(user, authToken)
        router.push('/dashboard')
        
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
        router.push('/auth/login?error=auth_failed')
      }
    }

    if (token) {
      authenticate(token)
    } else {
      router.push('/auth/login?error=auth_failed')
    }
  }, [searchParams, login, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center space-x-2">
        <PageLoader />
        <p className="text-lg">Authenticating, please wait...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  )
}
