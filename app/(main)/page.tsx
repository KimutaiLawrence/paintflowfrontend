"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, Users, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await api.get("/dashboard/metrics")
      return response.data
    },
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const response = await api.get("/dashboard/activity")
      return response.data
    },
  })

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const metricCards = [
    {
      title: "Total Jobs",
      value: metrics?.total_jobs || 0,
      description: "Active projects",
      icon: Briefcase,
      color: "text-primary",
    },
    {
      title: "In Progress",
      value: metrics?.jobs_in_progress || 0,
      description: "Currently active",
      icon: Clock,
      color: "text-secondary",
    },
    {
      title: "Completed",
      value: metrics?.jobs_completed || 0,
      description: "This month",
      icon: CheckCircle,
      color: "text-chart-1",
    },
    {
      title: "Workers",
      value: metrics?.active_workers || 0,
      description: "Available today",
      icon: Users,
      color: "text-chart-2",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0]}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {user?.role?.toUpperCase()}
        </Badge>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates from your projects</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity?.length > 0 ? (
            <div className="space-y-4">
              {activity.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.description || "Activity update"}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Just now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent activity to display</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
