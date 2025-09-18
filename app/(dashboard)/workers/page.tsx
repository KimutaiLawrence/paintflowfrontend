"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Phone, Mail, Calendar, Users, Briefcase } from "lucide-react"
import { workersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import api from "@/lib/api" // Declare the api variable

export default function WorkersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: workersResponse, isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => workersApi.getWorkers(),
  })

  const workers = workersResponse?.data || []

  const createWorkerMutation = useMutation({
    mutationFn: (workerData: any) => {
      // Note: This endpoint doesn't exist in the API, using placeholder
      return api.post("/workers/", workerData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] })
      setIsCreateDialogOpen(false)
    },
  })

  const filteredWorkers =
    workers?.filter((worker: any) => {
      const matchesSearch =
        worker.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = selectedRole === "all" || worker.role === selectedRole
      return matchesSearch && matchesRole
    }) || []

  const handleCreateWorker = (formData: FormData) => {
    const workerData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      skills: formData.get("skills") as string,
      notes: formData.get("notes") as string,
    }
    createWorkerMutation.mutate(workerData)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "supervisor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "worker":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workers</h1>
          <p className="text-muted-foreground">Manage your team members and their assignments</p>
        </div>
        {(user?.role === "admin" || user?.role === "supervisor") && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form action={handleCreateWorker}>
                <DialogHeader>
                  <DialogTitle>Add New Worker</DialogTitle>
                  <DialogDescription>Create a new worker profile for your team.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input id="first_name" name="first_name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input id="last_name" name="last_name" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        {user?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Input id="skills" name="skills" placeholder="e.g., Painting, Primer, Patch work" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Additional notes..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createWorkerMutation.isPending}>
                    {createWorkerMutation.isPending ? "Creating..." : "Create Worker"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkers.map((worker: any) => (
          <Card key={worker.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={worker.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {worker.full_name
                      ? worker.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)
                      : `${worker.first_name?.[0] || ""}${worker.last_name?.[0] || ""}`}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {worker.full_name || `${worker.first_name || ""} ${worker.last_name || ""}`}
                  </CardTitle>
                  <Badge className={getRoleBadgeColor(worker.role)}>{worker.role}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                {worker.email}
              </div>
              {worker.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {worker.phone}
                </div>
              )}
              {worker.skills && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {worker.skills}
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {new Date(worker.date_joined || worker.created_at || Date.now()).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                {worker.active_jobs_count || 0} active jobs
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workers found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || selectedRole !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first worker."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
