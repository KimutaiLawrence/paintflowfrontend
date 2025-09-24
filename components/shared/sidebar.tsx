"use client"

import Link from "next/link"
import {
  Home,
  Briefcase,
  ClipboardList,
  FileText,
  Users,
  Building,
  Settings,
  Package2,
  Menu,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import React from "react"

const NavLink = ({
  href,
  icon: Icon,
  label,
  isMobile = false,
  isCollapsed,
}: {
  href: string
  icon: React.ElementType
  label: string
  isMobile?: boolean
  isCollapsed: boolean
}) => {
  const pathname = usePathname()
  const isActive = pathname === href

  const linkClasses = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
    isActive && "bg-muted text-primary"
  )

  if (isMobile) {
    return (
      <Link href={href} className={linkClasses.replace("gap-3", "gap-4")}>
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    )
  }

  // For desktop
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link href={href} className={linkClasses}>
          <Icon className="h-5 w-5" />
          <span className={isCollapsed ? "sr-only" : ""}>{label}</span>
        </Link>
      </TooltipTrigger>
      {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}

const NavSection = ({ title, isCollapsed }: { title: string; isCollapsed: boolean }) => (
  <h2
    className={cn(
      "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80",
      isCollapsed && "sr-only"
    )}
  >
    {title}
  </h2>
)

export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const { user } = useAuth()

  const desktopNavLinks = (
    <>
      <NavLink href="/dashboard" icon={Home} label="Dashboard" isCollapsed={isCollapsed} />
      <NavLink href="/jobs" icon={Briefcase} label="Jobs" isCollapsed={isCollapsed} />
      <NavLink href="/forms" icon={ClipboardList} label="Safety Forms" isCollapsed={isCollapsed} />
      <NavLink href="/reports" icon={FileText} label="Reports" isCollapsed={isCollapsed} />
      <NavLink href="/company-documents" icon={FileText} label="Documents" isCollapsed={isCollapsed} />
      {user?.role === "admin" && (
        <>
          <NavSection title="Admin" isCollapsed={isCollapsed} />
          <NavLink href="/users" icon={Users} label="Users" isCollapsed={isCollapsed} />
          <NavLink href="/management-companies" icon={Building} label="Clients" isCollapsed={isCollapsed} />
          <NavLink href="/form-templates" icon={ClipboardList} label="Form Templates" isCollapsed={isCollapsed} />
        </>
      )}
    </>
  )

  const mobileNavLinks = (
    <>
      <NavLink href="/dashboard" icon={Home} label="Dashboard" isMobile />
      <NavLink href="/jobs" icon={Briefcase} label="Jobs" isMobile />
      <NavLink href="/forms" icon={ClipboardList} label="Safety Forms" isMobile />
      <NavLink href="/reports" icon={FileText} label="Reports" isMobile />
      <NavLink href="/company-documents" icon={FileText} label="Documents" isMobile />
      {user?.role === "admin" && (
        <>
          <NavLink href="/users" icon={Users} label="Users" isMobile />
          <NavLink href="/management-companies" icon={Building} label="Clients" isMobile />
          <NavLink href="/form-templates" icon={ClipboardList} label="Form Templates" isMobile />
        </>
      )}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
          isCollapsed ? "w-14" : "w-64"
        )}
      >
        <div className={cn("flex h-14 items-center border-b", isCollapsed ? "px-2 justify-center" : "px-4")}>
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
          >
            <Package2 className="h-6 w-6" />
            <span className={cn(isCollapsed && "sr-only")}>PaintFlow</span>
          </Link>
        </div>

        <nav className={cn("flex-grow space-y-1", isCollapsed ? "px-2 py-4" : "px-4 py-4")}>
          <TooltipProvider>{desktopNavLinks}</TooltipProvider>
        </nav>

        <nav className={cn("mt-auto border-t", isCollapsed ? "px-2 py-4" : "px-4 py-4")}>
          <TooltipProvider>
            <NavLink href="/settings" icon={Settings} label="Settings" isCollapsed={isCollapsed} />
          </TooltipProvider>
        </nav>
      </aside>

      {/* Mobile Header & Sidebar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">PaintFlow</span>
              </Link>
              {mobileNavLinks}
              <NavLink href="/settings" icon={Settings} label="Settings" isMobile />
            </nav>
          </SheetContent>
        </Sheet>
      </header>
    </>
  )
}
