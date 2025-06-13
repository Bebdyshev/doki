"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, EyeOff } from "lucide-react"
import { apiClient } from "@/lib/api"
import GoogleLoginButton from "@/components/google-login-button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const response = await apiClient.login(email, password)

    console.log("Login response:", response) // Debug log

    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      router.push("/dashboard")
    } else {
      setError("Login failed: No data received")
    }

    setIsLoading(false)
  }

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true)

    // Decode Google ID token to extract profile picture and name
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]))
      if (payload.picture) {
        localStorage.setItem('avatar_url', payload.picture)
      }
      if (payload.name) {
        localStorage.setItem('user_name', payload.name)
      }
    } catch (err) {
      console.warn('Failed to decode Google token', err)
    }

    const response = await apiClient.googleLogin(credential)
    if (response.error) {
      setError(response.error)
    } else {
      router.push("/dashboard")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Doki</span>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            {/* Divider */}
            <div className="flex items-center my-4">
              <span className="flex-1 h-px bg-gray-300" />
              <span className="px-2 text-xs text-gray-500">OR</span>
              <span className="flex-1 h-px bg-gray-300" />
            </div>
            <GoogleLoginButton onSuccess={handleGoogleSuccess} />
            <div className="mt-4 text-center text-sm">
              {"Don't have an account? "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
