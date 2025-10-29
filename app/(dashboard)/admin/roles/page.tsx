"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { rolesApi, permissionsApi, Role, Permission, RolePermission } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Shield, Users, Settings } from "lucide-react"
import { toast } from "sonner"
import { InlineLoader } from "@/components/ui/custom-loader"

export default function RolesManagementPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getRoles,
  })

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsApi.getPermissions,
  })

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsCreateDialogOpen(false)
      toast.success("Role created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create role")
    },
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => rolesApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsEditDialogOpen(false)
      setSelectedRole(null)
      toast.success("Role updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update role")
    },
  })

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setDeleteRoleId(null)
      toast.success("Role deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete role")
    },
  })

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: RolePermission[] }) => 
      rolesApi.updateRolePermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsPermissionsDialogOpen(false)
      toast.success("Role permissions updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update permissions")
    },
  })

  const handleCreateRole = (data: Partial<Role>) => {
    createRoleMutation.mutate(data)
  }

  const handleUpdateRole = (data: Partial<Role>) => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data })
    }
  }

  const handleDeleteRole = () => {
    if (deleteRoleId) {
      deleteRoleMutation.mutate(deleteRoleId)
    }
  }

  const handleUpdatePermissions = (permissions: RolePermission[]) => {
    if (selectedRole) {
      updatePermissionsMutation.mutate({ id: selectedRole.id, permissions })
    }
  }

  const getPermissionCount = (role: Role) => {
    return role.permissions.filter(p => p.granted).length
  }

  const getResourceTypes = () => {
    const types = new Set(permissions.map(p => p.resource_type))
    return Array.from(types)
  }

  const getPermissionsByResource = (resourceType: string) => {
    return permissions.filter(p => p.resource_type === resourceType)
  }

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <InlineLoader className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading roles and permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        <CreateRoleDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateRole}
          isLoading={createRoleMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{role.display_name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {role.is_system_role && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                  <Badge variant={role.is_active ? "default" : "secondary"}>
                    {role.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{getPermissionCount(role)} permissions</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(role)
                    setIsPermissionsDialogOpen(true)
                  }}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Permissions
                </Button>
                
                {!role.is_system_role && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(role)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteRoleId(role.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the role "{role.display_name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteRole}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Role Dialog */}
      {selectedRole && (
        <EditRoleDialog
          role={selectedRole}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleUpdateRole}
          isLoading={updateRoleMutation.isPending}
        />
      )}

      {/* Permissions Dialog */}
      {selectedRole && (
        <PermissionsDialog
          role={selectedRole}
          permissions={permissions}
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          onSubmit={handleUpdatePermissions}
          isLoading={updatePermissionsMutation.isPending}
        />
      )}
    </div>
  )
}

// Create Role Dialog Component
function CreateRoleDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Role>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    is_active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: "", display_name: "", description: "", is_active: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new role with custom permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., senior_worker"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., Senior Worker"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Role description..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Role Dialog Component
function EditRoleDialog({ 
  role, 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: { 
  role: Role
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Role>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    display_name: role.display_name,
    description: role.description || "",
    is_active: role.is_active,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update role information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Permissions Dialog Component
function PermissionsDialog({ 
  role, 
  permissions, 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: { 
  role: Role
  permissions: Permission[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (permissions: RolePermission[]) => void
  isLoading: boolean
}) {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    // Initialize with current role permissions
    const currentPermissions = role.permissions || []
    const allPermissions = permissions.map(permission => {
      const existing = currentPermissions.find(p => p.permission_id === permission.id)
      return {
        permission_id: permission.id,
        permission_name: permission.name,
        resource_type: permission.resource_type,
        action: permission.action,
        granted: existing ? existing.granted : false
      }
    })
    return allPermissions
  })

  const handlePermissionToggle = (permissionId: string) => {
    setRolePermissions(prev => 
      prev.map(p => 
        p.permission_id === permissionId 
          ? { ...p, granted: !p.granted }
          : p
      )
    )
  }

  const handleSubmit = () => {
    onSubmit(rolePermissions)
  }

  const getResourceTypes = () => {
    const types = new Set(permissions.map(p => p.resource_type))
    return Array.from(types)
  }

  const getPermissionsByResource = (resourceType: string) => {
    return rolePermissions.filter(p => p.resource_type === resourceType)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Permissions - {role.display_name}</DialogTitle>
          <DialogDescription>
            Configure permissions for this role.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={getResourceTypes()[0]} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              {getResourceTypes().map((resourceType) => (
                <TabsTrigger key={resourceType} value={resourceType} className="text-xs">
                  {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          
          {getResourceTypes().map((resourceType) => (
            <TabsContent key={resourceType} value={resourceType} className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-3">
                {getPermissionsByResource(resourceType).map((permission) => {
                  const perm = permissions.find(p => p.id === permission.permission_id)
                  return (
                    <div key={permission.permission_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-medium truncate">{perm?.display_name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{perm?.description}</div>
                        <Badge variant="outline" className="text-xs">
                          {permission.action}
                        </Badge>
                      </div>
                      <Switch
                        checked={permission.granted}
                        onCheckedChange={() => handlePermissionToggle(permission.permission_id)}
                        className="flex-shrink-0 ml-3"
                      />
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          ))}
          </Tabs>
        </div>
        
        <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
