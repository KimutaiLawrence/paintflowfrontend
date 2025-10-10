"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { jobsApi, workersApi, dashboardApi, type PaginatedJobResponse } from "@/lib/api"
import Link from "next/link"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

export default function DashboardPage() {
  const { user, canManageJobs } = useAuth()

  const {
    data: metricsResponse,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await dashboardApi.getMetrics()
      return response.data
    },
  })

  const {
    data: jobsResponse,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await jobsApi.getJobs({ per_page: 10 })
      return response.data as PaginatedJobResponse
    },
  })

  const { data: workersResponse, error: workersError } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const response = await workersApi.getWorkers()
      return response.data
    },
    enabled: canManageJobs(),
  })

  // const { data: notificationsResponse, error: notificationsError } = useQuery({
  //   queryKey: ["notifications"],
  //   queryFn: async () => {
  //     const response = await notificationsApi.getNotifications()
  //     return response.data
  //   },
  // })

  const jobs = jobsResponse?.data || []
  const workers = Array.isArray(workersResponse) ? workersResponse : workersResponse?.data || []
  // const notifications = Array.isArray(notificationsResponse) ? notificationsResponse : notificationsResponse?.data || []

  if (jobsError || workersError || metricsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unable to load dashboard data. Please check your connection and try again.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ensure jobs is an array before proceeding
  if (!Array.isArray(jobs)) {
    // You might want to render a loading state or an error message here
    return <div>Loading jobs or error...</div>
  }

  const totalJobs = metricsResponse?.total_jobs || jobsResponse?.total || jobs.length
  const activeJobs =
    metricsResponse?.active_jobs || jobs.filter((job) => job.areas?.some((area) => area.status !== "done")).length
  const completedJobs =
    metricsResponse?.completed_jobs || jobs.filter((job) => job.areas?.every((area) => area.status === "done")).length
  const totalWorkers = metricsResponse?.total_workers || workers.length
  // const unreadNotifications = notifications.filter((n: any) => !n.read).length

  const recentJobs = jobs.slice(0, 5)

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, {user?.full_name}</h1>
          <p className="text-muted-foreground">Here's what's happening with your painting operations today.</p>
        </div>
        {canManageJobs() && (
          <Link href="/jobs/create">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <SectionCards />

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Job Progress Over Time</CardTitle>
          <CardDescription>Track your painting job completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartAreaInteractive />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest job updates and status changes</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading || metricsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" style={{ backgroundColor: job.priority_color, color: "white" }}>
                        {job.priority}
                      </Badge>
                      <Badge variant="secondary">{job.areas?.length || 0} areas</Badge>
                    </div>
                  </div>
                ))}
                <Link href="/jobs">
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Jobs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No jobs yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first job.</p>
                {canManageJobs() && (
                  <Link href="/jobs/create">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Job
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Recent updates and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg ${
                      !notification.read ? "bg-muted/50" : ""
                    }`}
                  >
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No notifications</h3>
                <p className="mt-1 text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
