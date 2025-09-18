"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/shared/protected-route"
import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Dashboard" />
          <main className="flex-1 overflow-auto p-3 md:p-6">
            {" "}
            {/* Reduced padding on mobile */}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
