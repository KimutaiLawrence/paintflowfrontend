"use client"

import * as React from "react"
import {
  Home,
  Briefcase,
  FileText,
  Users,
  Building,
  Settings,
  Package2,
  BarChart3,
  Shield,
  Layout,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"

// PaintFlow application data
const getNavData = (user: any) => {
  const baseNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Jobs",
      url: "/jobs",
      icon: Briefcase,
      items: user?.role === "worker" 
        ? [
            {
              title: "All Jobs",
              url: "/jobs",
            },
          ]
        : [
            {
              title: "All Jobs",
              url: "/jobs",
            },
            {
              title: "Create Job",
              url: "/jobs/create",
            },
          ],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
    },
    {
      title: "Company Documents",
      url: "/company-documents",
      icon: FileText,
      items: [
        {
          title: "All Documents",
          url: "/company-documents",
        },
        {
          title: "Categories",
          url: "/company-documents/categories",
        },
      ],
    },
    {
      title: "Floor Plans",
      url: "/floor-plans",
      icon: Layout,
      items: [
        {
          title: "All Floor Plans",
          url: "/floor-plans",
        },
        {
          title: "Floor Plan Canvas",
          url: "/floor-plans/canvas",
        },
      ],
    },
  ]

  // Add admin/manager-only items
  if (user?.role === "superadmin" || user?.role === "manager") {
    baseNavItems.push({
      title: "Admin",
      url: "#",
      icon: Shield,
      items: [
        {
          title: "Users",
          url: "/users",
        },
        {
          title: "Clients",
          url: "/clients",
        },
        {
          title: "Workers",
          url: "/workers",
        },
        {
          title: "Locations",
          url: "/locations",
        },
        {
          title: "Town Councils",
          url: "/town-councils",
        },
        {
          title: "Job Titles",
          url: "/job-titles",
        },
        {
          title: "Job Areas",
          url: "/job-areas",
        },
        {
          title: "Audit Trail",
          url: "/admin/audit-trail",
        },
        {
          title: "Roles & Permissions",
          url: "/admin/roles",
        },
      ],
    })
  }

  // Add client-specific items (can see only their users, not workers)
  if (user?.role === "client") {
    baseNavItems.push({
      title: "My Team",
      url: "/users",
      icon: Users,
    })
  }

  return baseNavItems
}

const getProjectsData = () => [
  {
    name: "Active Jobs",
    url: "/jobs?status=active",
    icon: Briefcase,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  
  const navData = getNavData(user)
  const projectsData = getProjectsData()
  
  const userData = {
    name: user?.full_name || "User",
    email: user?.email || "user@example.com",
    avatar: "/placeholder-user.jpg",
  }

  const teamData = [
    {
      name: "AS United PTE LTD",
      logo: "/ASUlogo.png",
      plan: "Enterprise",
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamData} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData} />
        <NavProjects projects={projectsData} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
