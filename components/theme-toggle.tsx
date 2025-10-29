"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { usePreferences } from "@/hooks/use-preferences"

export function ThemeToggle() {
  const { updateThemeInstantly } = usePreferences()
  
  // Use local state for immediate UI updates
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system'
      // Convert system to light, only allow light/dark
      return saved === 'dark' ? 'dark' : 'light'
    }
    return 'light'
  })

  // Sync with theme changes from preferences hook
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as 'light' | 'dark' | 'system'
      // Convert system to light, only allow light/dark
      const theme = newTheme === 'dark' ? 'dark' : 'light'
      setCurrentTheme(theme)
    }

    window.addEventListener('themeChanged', handleThemeChange as EventListener)
    return () => window.removeEventListener('themeChanged', handleThemeChange as EventListener)
  }, [])

  const handleThemeChange = () => {
    let newTheme: 'light' | 'dark'

    // Only toggle between light and dark (no system mode)
    if (currentTheme === 'light') {
      newTheme = 'dark'
    } else {
      newTheme = 'light'
    }

    // Update local state immediately
    setCurrentTheme(newTheme)
    
    // Update theme instantly
    updateThemeInstantly(newTheme)
  }

  const getIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const getTooltip = () => {
    switch (currentTheme) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to light mode'
      default:
        return 'Switch theme'
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      title={getTooltip()}
      className="relative"
    >
      {getIcon()}
    </Button>
  )
}
