"use client"

import type React from "react"

import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/jobs": "Jobs",
  "/workers": "Workers",
  "/reports": "Reports",
  "/settings": "Settings",
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "PaintFlow"

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
