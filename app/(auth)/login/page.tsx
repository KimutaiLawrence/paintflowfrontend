"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { QueryClient, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Paintbrush } from "lucide-react"
import { loginSchema, type LoginFormData } from "@/lib/validators"
import { useAuth } from "@/hooks/use-auth"
import api from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import { FaGoogle } from "react-icons/fa"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post("/auth/login", data)
      return response.data
    },
    onSuccess: data => {
      login(data.user, data.token)
      router.push("/dashboard")
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Login failed. Please try again.")
    },
  })

  const onSubmit = (data: LoginFormData) => {
    setError("")
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Paintbrush className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to PaintFlow</CardTitle>
          <CardDescription>Digital Operations Platform for AS United PTE LTD</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Enter your username"
                disabled={loginMutation.isPending}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                disabled={loginMutation.isPending}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <Separator className="my-6" />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = `https://paintflowbackendlive.onrender.com/api/auth/google/login`
            }}
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Test Accounts:</p>
            <div className="text-xs space-y-1">
              <p>
                <strong>Admin:</strong> admin / admin123
              </p>
              <p>
                <strong>Supervisor:</strong> rohit.sharma / supervisor123
              </p>
              <p>
                <strong>Worker:</strong> jahid.hasan / worker123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
