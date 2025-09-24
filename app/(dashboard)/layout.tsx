"use client"

import React, { useState } from "react"
import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div
        className={cn(
          "flex flex-col sm:gap-4 sm:py-4 transition-all duration-300",
          isSidebarCollapsed ? "sm:pl-14" : "sm:pl-64"
        )}
      >
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  )
}
