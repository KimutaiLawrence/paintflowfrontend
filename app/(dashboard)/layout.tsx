"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/hooks/use-auth"
import { PageLoader } from "@/components/ui/custom-loader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If the auth state is loaded and the user is not authenticated, redirect to login.
    if (isLoaded && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoaded, isAuthenticated, router])

  // While loading the auth state, or if the user is not authenticated (and about to be redirected),
  // show a full-screen loader. This prevents flashing the dashboard content.
  if (!isLoaded || !isAuthenticated) {
    return <PageLoader className="h-screen" />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
