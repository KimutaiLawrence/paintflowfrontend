"use client"

import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance inside the client component
  const [queryClient] = React.useState(() => {
    console.log('Creating QueryClient in root Providers')
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
        },
      },
    })
  })

  console.log('Rendering Providers with QueryClient:', !!queryClient)

  // Ensure QueryClient is properly initialized
  if (!queryClient) {
    console.error('QueryClient is not initialized')
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Initialization Error</h3>
          <p className="text-muted-foreground">
            QueryClient is not properly initialized. Please refresh the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
