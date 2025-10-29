"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, Calendar, Briefcase, Award, Clock, CheckCircle, Upload, Edit, Settings, Activity } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { authApi, auditTrailApi, AuditTrailEntry } from "@/lib/api"
import { PreferencesSettings } from "@/components/settings/preferences-settings"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: authApi.getCurrentUser,
  })

  const { data: userStats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => api.dashboard.getMetrics(),
  })

  // Get user's recent audit trail entries
  const { data: userActivity } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: () => auditTrailApi.getAuditTrail({
      user_id: user?.id,
      per_page: 10
    }),
    enabled: !!user?.id,
  })

  // const updateProfileMutation = useMutation({
  //   mutationFn: api.auth.updateProfile,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["user-profile"] })
  //     setIsEditing(false)
  //   },
  // })

  const handleProfileUpdate = (formData: FormData) => {
    // const profileData = {
    //   first_name: formData.get("first_name") as string,
    //   last_name: formData.get("last_name") as string,
    //   email: formData.get("email") as string,
    //   phone: formData.get("phone") as string,
    //   bio: formData.get("bio") as string,
    // }
    // updateProfileMutation.mutate(profileData)
    console.log("Profile update functionality to be implemented.")
    setIsEditing(false)
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
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and view your activity</p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
          className={!isEditing ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {userProfile?.first_name?.[0]}
                    {userProfile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">
                {userProfile?.first_name} {userProfile?.last_name}
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Badge className={getRoleBadgeColor(userProfile?.role || "")}>{userProfile?.role}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                {userProfile?.email}
              </div>
              {userProfile?.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {userProfile.phone}
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {new Date(userProfile?.date_joined || "").toLocaleDateString()}
              </div>
              {userProfile?.bio && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">About</Label>
                    <p className="text-sm text-muted-foreground mt-1">{userProfile.bio}</p>
                  </div>
                </>
              )}
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  Active Jobs
                </div>
                <span className="font-medium">{userStats?.active_jobs || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                  Completed Jobs
                </div>
                <span className="font-medium">{userStats?.completed_jobs || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  Hours This Month
                </div>
                <span className="font-medium">{userStats?.hours_this_month || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                  Performance Score
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {userStats?.performance_score || 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Personal Info</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    {isEditing ? "Update your personal details" : "Your personal information"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form action={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input id="first_name" name="first_name" defaultValue={userProfile?.first_name} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input id="last_name" name="last_name" defaultValue={userProfile?.last_name} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={userProfile?.email} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={userProfile?.phone} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          placeholder="Tell us about yourself..."
                          defaultValue={userProfile?.bio}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={true}>
                          {/* {updateProfileMutation.isPending ? "Saving..." : "Save Changes"} */}
                          Save Changes
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">First Name</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {userProfile?.first_name || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Last Name</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {userProfile?.last_name || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground mt-1">{userProfile?.email || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone Number</Label>
                        <p className="text-sm text-muted-foreground mt-1">{userProfile?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Bio</Label>
                        <p className="text-sm text-muted-foreground mt-1">{userProfile?.bio || "No bio provided"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your recent actions and system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {userActivity?.audit_entries?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userActivity?.audit_entries?.map((entry: AuditTrailEntry) => {
                        const getActivityIcon = (action: string) => {
                          if (action.includes('CREATE')) return <CheckCircle className="h-5 w-5 text-green-600" />
                          if (action.includes('UPDATE')) return <Edit className="h-5 w-5 text-blue-600" />
                          if (action.includes('DELETE')) return <Settings className="h-5 w-5 text-red-600" />
                          if (action.includes('LOGIN')) return <User className="h-5 w-5 text-purple-600" />
                          return <Activity className="h-5 w-5 text-gray-600" />
                        }

                        return (
                          <div key={entry.id} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                            {getActivityIcon(entry.action)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{entry.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {entry.action}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {entry.resource_type}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(entry.created_at), 'MMM dd, HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Account Type</Label>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{userProfile?.role} Account</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(userProfile?.date_joined || "").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userProfile?.last_login
                        ? new Date(userProfile.last_login).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                    <Button variant="outline" size="sm">
                      Download My Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
