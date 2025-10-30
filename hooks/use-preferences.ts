"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userPreferencesApi, UserPreferences } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export function usePreferences() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get initial theme from localStorage for instant loading
  const [localTheme, setLocalTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  const { data: preferences, isLoading, error } = useQuery<UserPreferences>({
    queryKey: ["user-preferences"],
    queryFn: userPreferencesApi.getPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: {
      theme: localTheme as 'light' | 'dark' | 'system',
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
    } as UserPreferences
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: userPreferencesApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] })
      toast.success("Preferences updated successfully")
    },
    onError: (error: any) => {
      toast.error("Failed to update preferences: " + (error.response?.data?.message || "Please try again"))
    }
  })

  const updatePreferenceMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => 
      userPreferencesApi.updatePreference(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] })
    },
    onError: (error: any) => {
      toast.error("Failed to update preference: " + (error.response?.data?.message || "Please try again"))
    }
  })

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    updatePreferencesMutation.mutate(newPreferences)
  }

  const updatePreference = (key: string, value: any) => {
    updatePreferenceMutation.mutate({ key, value })
  }

  // Instant theme update function
  const updateThemeInstantly = (newTheme: 'light' | 'dark' | 'system') => {
    // 1. Update localStorage immediately
    localStorage.setItem('theme', newTheme)
    setLocalTheme(newTheme)
    
    // 2. Apply theme instantly to DOM
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'light') {
      root.classList.remove('dark')
     } else if (newTheme === 'system') {
       // System theme should always be light (as per user request)
       root.classList.remove('dark')
     }
    
    // 3. Update backend in background (optimistic update)
    updatePreference('theme', newTheme)
    
    // 4. Dispatch custom event to notify theme toggle component
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }))
  }

  // Apply theme immediately on mount to prevent flash
  useEffect(() => {
    const root = document.documentElement
    const savedTheme = localStorage.getItem('theme') || 'light'
    
    if (savedTheme === 'dark') {
      root.classList.add('dark')
    } else if (savedTheme === 'light') {
      root.classList.remove('dark')
     } else if (savedTheme === 'system') {
       // System theme should always be light
       root.classList.remove('dark')
     } else {
      root.classList.remove('dark')
    }
  }, [])

  // Sync backend theme with localStorage without causing UI flicker
  useEffect(() => {
    if (!preferences) return

    const normalize = (t: string | null | undefined) => (t === 'dark' ? 'dark' : 'light')
    const root = document.documentElement

    const local = localStorage.getItem('theme')
    const localNormalized = normalize(local || 'light')
    const serverNormalized = normalize(preferences.theme)

    if (!local) {
      // No local preference yet: adopt server (normalized), defaulting system->light
      localStorage.setItem('theme', serverNormalized)
      setLocalTheme(serverNormalized)
      if (serverNormalized === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: serverNormalized }))
      return
    }

    if (localNormalized !== serverNormalized) {
      // Keep UI as-is (local is source of truth), sync backend quietly
      if (preferences.theme !== localNormalized) {
        updatePreference('theme', localNormalized)
      }
      return
    }

    // They match: ensure DOM reflects the value
    if (localNormalized === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [preferences?.theme])

  // Apply accent color
  useEffect(() => {
    if (preferences?.accent_color) {
      const root = document.documentElement
      root.setAttribute('data-accent', preferences.accent_color)
    }
  }, [preferences?.accent_color])

  // Apply accessibility preferences
  useEffect(() => {
    if (preferences) {
      const root = document.documentElement
      
      if (preferences.high_contrast) {
        root.classList.add('high-contrast')
      } else {
        root.classList.remove('high-contrast')
      }
      
      if (preferences.large_text) {
        root.classList.add('large-text')
      } else {
        root.classList.remove('large-text')
      }
      
      if (preferences.reduced_motion) {
        root.classList.add('reduced-motion')
      } else {
        root.classList.remove('reduced-motion')
      }
    }
  }, [preferences?.high_contrast, preferences?.large_text, preferences?.reduced_motion])

  return {
    preferences: preferences ? { ...preferences, theme: (localTheme as 'light' | 'dark' | 'system') } : {
      theme: localTheme as 'light' | 'dark' | 'system',
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
    },
    isLoading,
    error,
    updatePreferences,
    updatePreference,
    updateThemeInstantly, // New instant theme update function
    isUpdating: updatePreferencesMutation.isPending || updatePreferenceMutation.isPending
  }
}
