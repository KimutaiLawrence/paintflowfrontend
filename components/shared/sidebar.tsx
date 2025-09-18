"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
  Menu,
  Shield,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "supervisor", "worker"],
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    roles: ["admin", "supervisor", "worker"],
  },
  {
    name: "Safety Forms",
    href: "/forms",
    icon: Shield,
    roles: ["admin", "supervisor", "worker"],
  },
  {
    name: "Workers",
    href: "/workers",
    icon: Users,
    roles: ["admin", "supervisor"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ["admin", "supervisor"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
]

function NavigationItems({ collapsed = false, onItemClick }: { collapsed?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname()
  const { hasRole } = useAuth()

  const filteredNavigation = navigation.filter((item) => item.roles.some((role) => hasRole(role)))

  return (
    <ul className="space-y-1">
      {filteredNavigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <li key={item.name}>
            <Link href={item.href} onClick={onItemClick}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 text-left", // Increased height for better touch targets
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" /> {/* Increased icon size for mobile */}
                {!collapsed && <span className="ml-3 text-sm font-medium">{item.name}</span>}
              </Button>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sidebar-primary rounded-lg">
              <Paintbrush className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">PaintFlow</h1>
              <p className="text-xs text-sidebar-foreground/70">AS United PTE LTD</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <NavigationItems collapsed={collapsed} />
      </nav>
    </div>
  )
}

function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden h-10 w-10 p-0">
          {" "}
          {/* Larger touch target for mobile */}
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full bg-sidebar">
          {/* Header */}
          <div className="flex items-center space-x-2 p-4">
            <div className="p-2 bg-sidebar-primary rounded-lg">
              <Paintbrush className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">PaintFlow</h1>
              <p className="text-xs text-sidebar-foreground/70">AS United PTE LTD</p>
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 p-2">
            <NavigationItems onItemClick={() => setOpen(false)} />
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}
