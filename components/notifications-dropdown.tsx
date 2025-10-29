"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationsApi, Notification } from "@/lib/api"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, ExternalLink, Trash2, Eye, EyeOff } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingNotificationId, setLoadingNotificationId] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Function to refresh notifications (can be called from other components)
  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  // Expose refresh function globally for other components to use
  React.useEffect(() => {
    (window as any).refreshNotifications = refreshNotifications
    return () => {
      delete (window as any).refreshNotifications
    }
  }, [])

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getNotifications,
    refetchOnWindowFocus: true, // Only refetch when user focuses the window
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const clearReadNotificationsMutation = useMutation({
    mutationFn: async () => {
      // Get all read notifications and delete them
      const readNotifications = notifications.filter(n => n.is_read)
      for (const notification of readNotifications) {
        await notificationsApi.deleteNotification(notification.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      setLoadingNotificationId(notification.id)
      markAsReadMutation.mutate(notification.id, {
        onSettled: () => {
          setLoadingNotificationId(null)
        }
      })
    }
    
    if (notification.job_id) {
      router.push(`/jobs/${notification.job_id}`)
    }
    
    setIsOpen(false)
  }

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.is_read) {
        markAsReadMutation.mutate(notification.id)
      }
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-w-[90vw]" align="end">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.filter(n => n.is_read).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearReadNotificationsMutation.mutate()}
                className="text-xs text-muted-foreground hover:text-destructive"
                disabled={clearReadNotificationsMutation.isPending || markAsReadMutation.isPending}
              >
                {clearReadNotificationsMutation.isPending ? (
                  <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                {clearReadNotificationsMutation.isPending ? "Clearing..." : "Clear read"}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
                disabled={markAsReadMutation.isPending || clearReadNotificationsMutation.isPending}
              >
                {markAsReadMutation.isPending ? (
                  <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                {markAsReadMutation.isPending ? "Marking..." : "Mark all read"}
              </Button>
            )}
          </div>
        </div>
        <Separator />
        
        <ScrollArea className="h-96 max-h-[60vh]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="p-1">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.is_read ? "bg-muted/30 border-l-2 border-l-blue-500" : "opacity-75"
                  } ${loadingNotificationId === notification.id ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {loadingNotificationId === notification.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : !notification.is_read ? (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      ) : (
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${
                          !notification.is_read ? "font-semibold" : "font-normal"
                        }`}>
                          {notification.title}
                        </p>
                        {notification.job_id && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(notification.created_at), 'MMM dd, HH:mm')}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                        <span>•</span>
                        <span>UTC</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 10 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  router.push('/notifications')
                  setIsOpen(false)
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
