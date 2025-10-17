"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { ButtonLoader } from "@/components/ui/custom-loader"
import { loginSchema, type LoginFormData } from "@/lib/validators"
import { useAuth } from "@/hooks/use-auth"
import api from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import { FaGoogle } from "react-icons/fa"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

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
            <div className="p-3 bg-white rounded-full shadow-lg">
              <Image 
                src="/ASUlogo.png" 
                alt="AS United Logo" 
                width={64} 
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to AS United</CardTitle>
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
              <Label htmlFor="email">Email or Username</Label>
              <Input
                id="email"
                type="text"
                {...register("email")}
                placeholder="Enter your email or username"
                disabled={loginMutation.isPending}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  disabled={loginMutation.isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <ButtonLoader className="mr-2" />}
              Sign In
            </Button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
            <Link 
              href="/auth/signup" 
              className="text-sm text-primary hover:underline"
            >
              Don't have an account? Sign up
            </Link>
          </div>

          <Separator className="my-6" />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/auth/google/login`
            }}
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Test Accounts (login with email or username):</p>
            <div className="text-xs space-y-1">
              <p>
                <strong>Manager:</strong> admin@asunited.com / admin123
              </p>
              <p>
                <strong>Client:</strong> geospatialprime@gmail.com / Lawrence65
              </p>
              <p>
                <strong>Worker:</strong> lawrencekimutai001@gmail.com / Lawrence65
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border">
            <div className="text-center">
              <p className="text-sm font-semibold text-primary mb-2">AS UNITED PTE LTD</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>16 WOODLANDS INDUSTRIAL PARK E1 #05-03</p>
                <p>SINGAPORE 757737</p>
                <p>TEL: 6368-0491 | EMAIL: andy@asunited.com.sg</p>
                <p>CO. REG. NO: 201802491H | GST. REG. NO: 201802491H</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
