"use client"

import React from "react"
import { usePreferences } from "@/hooks/use-preferences"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Palette, 
  Layout, 
  Bell, 
  Eye, 
  Globe, 
  Settings,
  Sun,
  Moon,
  Monitor,
  DragHandleDots2Icon
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SortableDocumentOrder } from "@/components/ui/sortable-document-order"

export function PreferencesSettings() {
  const { preferences, updatePreference, isUpdating } = usePreferences()
  const { toast } = useToast()

  const handleThemeChange = (theme: string) => {
    updatePreference('theme', theme)
  }

  const handleAccentColorChange = (color: string) => {
    updatePreference('accent_color', color)
  }

  const handleLayoutChange = (key: string, value: boolean) => {
    updatePreference(key, value)
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    updatePreference(`notifications.${key}`, value)
  }

  const handleAccessibilityChange = (key: string, value: boolean) => {
    updatePreference(key, value)
  }

  const resetToDefaults = () => {
    const defaultPreferences = {
      theme: 'system',
      accent_color: 'blue',
      sidebar_collapsed: false,
      compact_mode: false,
      dense_tables: false,
      company_documents_order: ['PTW', 'TBM', 'WAH', 'VSS'],
      safety_documents_order: ['PTW', 'TBM', 'WAH', 'VSS'],
      dashboard_widgets: {
        recent_jobs: true,
        pending_tasks: true,
        safety_alerts: true,
        progress_chart: true,
        quick_stats: true
      },
      notifications: {
        email_enabled: true,
        push_enabled: true,
        job_updates: true,
        safety_alerts: true,
        system_updates: false
      },
      table_page_size: 25,
      table_sort_preferences: {},
      auto_save_forms: true,
      form_validation_mode: 'real_time',
      high_contrast: false,
      large_text: false,
      reduced_motion: false,
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      time_format: '12h'
    }
    
    // Update all preferences at once
    Object.entries(defaultPreferences).forEach(([key, value]) => {
      updatePreference(key, value)
    })
    
    toast.success("Preferences reset to defaults")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preferences</h2>
          <p className="text-muted-foreground">
            Customize your PaintFlow experience
          </p>
        </div>
        <Button variant="outline" onClick={resetToDefaults} disabled={isUpdating}>
          Reset to Defaults
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="ordering" className="flex items-center gap-2">
            <DragHandleDots2Icon className="h-4 w-4" />
            Ordering
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Colors
              </CardTitle>
              <CardDescription>
                Choose your preferred theme and accent color
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={preferences.theme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <Select value={preferences.accent_color} onValueChange={handleAccentColorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accent color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Layout Options
              </CardTitle>
              <CardDescription>
                Customize the interface layout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sidebar-collapsed">Collapsed Sidebar</Label>
                  <p className="text-sm text-muted-foreground">
                    Start with sidebar collapsed by default
                  </p>
                </div>
                <Switch
                  id="sidebar-collapsed"
                  checked={preferences.sidebar_collapsed}
                  onCheckedChange={(checked) => handleLayoutChange('sidebar_collapsed', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing and padding throughout the interface
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={preferences.compact_mode}
                  onCheckedChange={(checked) => handleLayoutChange('compact_mode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dense-tables">Dense Tables</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more rows in tables with reduced spacing
                  </p>
                </div>
                <Switch
                  id="dense-tables"
                  checked={preferences.dense_tables}
                  onCheckedChange={(checked) => handleLayoutChange('dense_tables', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-enabled">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={preferences.notifications.email_enabled}
                  onCheckedChange={(checked) => handleNotificationChange('email_enabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-enabled">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={preferences.notifications.push_enabled}
                  onCheckedChange={(checked) => handleNotificationChange('push_enabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="job-updates">Job Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications for job status changes
                  </p>
                </div>
                <Switch
                  id="job-updates"
                  checked={preferences.notifications.job_updates}
                  onCheckedChange={(checked) => handleNotificationChange('job_updates', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="safety-alerts">Safety Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Important safety-related notifications
                  </p>
                </div>
                <Switch
                  id="safety-alerts"
                  checked={preferences.notifications.safety_alerts}
                  onCheckedChange={(checked) => handleNotificationChange('safety_alerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Accessibility Options
              </CardTitle>
              <CardDescription>
                Improve accessibility and readability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={preferences.high_contrast}
                  onCheckedChange={(checked) => handleAccessibilityChange('high_contrast', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="large-text">Large Text</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase text size throughout the interface
                  </p>
                </div>
                <Switch
                  id="large-text"
                  checked={preferences.large_text}
                  onCheckedChange={(checked) => handleAccessibilityChange('large_text', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={preferences.reduced_motion}
                  onCheckedChange={(checked) => handleAccessibilityChange('reduced_motion', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordering" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DragHandleDots2Icon className="h-5 w-5" />
                Document Ordering
              </CardTitle>
              <CardDescription>
                Customize the order of safety documents by dragging and dropping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SortableDocumentOrder
                items={preferences.company_documents_order}
                onReorder={(newOrder) => updatePreference('company_documents_order', newOrder)}
                title="Company Documents Order"
                description="Drag and drop to reorder categories on the company documents page"
                requiredItems={['PTW', 'TBM', 'WAH', 'VSS']}
              />

              <Separator />

              <SortableDocumentOrder
                items={preferences.safety_documents_order}
                onReorder={(newOrder) => updatePreference('safety_documents_order', newOrder)}
                title="Safety Documents Order"
                description="Drag and drop to reorder categories in job safety document dialogs"
                requiredItems={['PTW', 'TBM', 'WAH', 'VSS']}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
