"use client"

import { Bell, User, LogOut, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Sidebar } from "./sidebar"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications/")
      return response.data
    },
    enabled: isOnline, // Only fetch when online
  })

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <header className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center space-x-3">
        <div className="md:hidden">
          <Sidebar />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
          {!isOnline && (
            <div className="flex items-center space-x-1 text-xs text-orange-600 mt-1">
              <WifiOff className="h-3 w-3" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="hidden sm:flex items-center space-x-1 text-xs text-muted-foreground">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="hidden md:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-orange-500" />
              <span className="hidden md:inline">Offline</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0">
          {" "}
          {/* Larger touch target */}
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
              {" "}
              {/* Larger touch target */}
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="w-fit text-xs">
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="h-10">
              {" "}
              {/* Larger touch target for mobile */}
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="h-10">
              {" "}
              {/* Larger touch target for mobile */}
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
