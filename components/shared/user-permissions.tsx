"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, ChevronDown } from "lucide-react"
import { userRoleAssignmentApi, Permission, Role } from "@/lib/api"

interface UserPermissionsProps {
  userId: string
  userRole: string
}

export function UserPermissions({ userId, userRole }: UserPermissionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fetch user permissions
  const { data: permissions, isLoading, error: permissionsError } = useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => userRoleAssignmentApi.getUserPermissions(userId),
    enabled: isOpen && userId !== "",
    retry: false, // Don't retry on 404 errors
  })

  // Fetch user roles
  const { data: roles, error: rolesError } = useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => userRoleAssignmentApi.getUserRoles(userId),
    enabled: isOpen && userId !== "",
    retry: false, // Don't retry on 404 errors
  })

  // Handle errors silently for 404 (endpoints not available yet)
  if (permissionsError && (permissionsError as any).response?.status !== 404) {
    console.warn("Failed to fetch user permissions:", permissionsError)
  }
  if (rolesError && (rolesError as any).response?.status !== 404) {
    console.warn("Failed to fetch user roles:", rolesError)
  }

  // System role permissions mapping
  const getSystemRolePermissions = (role: string): string[] => {
    switch (role) {
      case "superadmin":
        return ["All Permissions"]
      case "manager":
        return [
          "jobs.create", "jobs.read", "jobs.update", "jobs.delete",
          "users.create", "users.read", "users.update", "users.delete",
          "roles.create", "roles.read", "roles.update", "roles.delete",
          "audit.read", "notifications.read", "notifications.delete"
        ]
      case "client":
        return [
          "jobs.read", "notifications.read", "reports.read"
        ]
      case "worker":
        return [
          "jobs.read", "jobs.update", "notifications.read", "reports.create"
        ]
      default:
        return []
    }
  }

  const systemPermissions = getSystemRolePermissions(userRole)
  const customPermissions = (permissions as Permission[]) || []
  const customRoles = (roles as Role[]) || []

  const getPermissionDisplayName = (permission: string) => {
    const permissionMap: Record<string, string> = {
      "jobs.create": "Create Jobs",
      "jobs.read": "View Jobs",
      "jobs.update": "Update Jobs",
      "jobs.delete": "Delete Jobs",
      "users.create": "Create Users",
      "users.read": "View Users",
      "users.update": "Update Users",
      "users.delete": "Delete Users",
      "roles.create": "Create Roles",
      "roles.read": "View Roles",
      "roles.update": "Update Roles",
      "roles.delete": "Delete Roles",
      "audit.read": "View Audit Trail",
      "notifications.read": "View Notifications",
      "notifications.delete": "Delete Notifications",
      "reports.read": "View Reports",
      "reports.create": "Create Reports",
    }
    return permissionMap[permission] || permission
  }

  const getPermissionColor = (permission: string) => {
    if (permission.includes("create")) return "bg-green-100 text-green-800 border-green-200"
    if (permission.includes("read")) return "bg-blue-100 text-blue-800 border-blue-200"
    if (permission.includes("update")) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (permission.includes("delete")) return "bg-red-100 text-red-800 border-red-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Shield className="h-4 w-4 mr-1" />
          Permissions
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <h4 className="font-medium">User Permissions</h4>
          </div>
          
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {/* System Role Permissions */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  System Role ({userRole})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {systemPermissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className={`text-xs ${getPermissionColor(permission)}`}
                    >
                      {getPermissionDisplayName(permission)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Roles */}
              {customRoles.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Custom Roles
                  </h5>
                  <div className="space-y-2">
                    {customRoles.map((role) => (
                      <div key={role.id} className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-sm">{role.display_name}</div>
                        <div className="text-xs text-gray-600">{role.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Permissions */}
              {customPermissions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Additional Permissions
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {customPermissions.map((permission) => (
                      <Badge
                        key={permission.id}
                        variant="outline"
                        className={`text-xs ${getPermissionColor(permission.name)}`}
                      >
                        {permission.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="text-sm text-gray-500">Loading permissions...</div>
              )}

              {/* Show message if no custom permissions/roles and API is not available */}
              {!isLoading && customPermissions.length === 0 && customRoles.length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  No additional permissions assigned
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
