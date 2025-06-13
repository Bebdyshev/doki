"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import GoogleLoginButton from "@/components/google-login-button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Function to convert error codes to user-friendly messages
  const getErrorMessage = (error: string): string => {
    if (error.includes('400') || error.includes('401') || error.includes('Invalid credentials')) {
      return "Invalid email or password. Please check your credentials and try again."
    }
    if (error.includes('404') || error.includes('User not found')) {
      return "No account found with this email address. Please sign up first."
    }
    if (error.includes('429') || error.includes('rate limit')) {
      return "Too many login attempts. Please wait a few minutes and try again."
    }
    if (error.includes('500') || error.includes('server')) {
      return "We're experiencing technical difficulties. Please try again later."
    }
    if (error.includes('network') || error.includes('fetch')) {
      return "Connection error. Please check your internet connection and try again."
    }
    // If it's already a user-friendly message, return as is
    if (!error.match(/^\d{3}/) && !error.includes('Error:')) {
      return error
    }
    return "Something went wrong. Please try again."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    const response = await apiClient.login(email, password)

    if (response.error) {
      setError(getErrorMessage(response.error))
    } else if (response.data) {
      setSuccess(true)
      // Add a small delay to show success animation before redirect
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } else {
      setError("Login failed. Please try again.")
    }

    setIsLoading(false)
  }

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true)
    setError("")

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
      setError(getErrorMessage(response.error))
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo with animation */}
        <div className="flex items-center justify-center space-x-2 mb-8 animate-in slide-in-from-top-4 duration-1000">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Doki</span>
        </div>

        <Card className="animate-in slide-in-from-bottom-4 duration-1000 delay-200">
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
                  disabled={isLoading}
                  required
                  className="transition-all duration-200 focus:scale-[1.02]"
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
                    disabled={isLoading}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent transition-all duration-200 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Error message with animation */}
              {error && (
                <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success message with animation */}
              {success && (
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200 animate-in slide-in-from-top-2 duration-300">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Login successful! Redirecting...</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:scale-105 active:scale-95" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            
            {/* Divider */}
            <div className="flex items-center my-6">
              <span className="flex-1 h-px bg-gray-300" />
              <span className="px-3 text-xs text-gray-500">OR</span>
              <span className="flex-1 h-px bg-gray-300" />
            </div>
            
            <div className="transition-all duration-200 hover:scale-105">
              <GoogleLoginButton onSuccess={handleGoogleSuccess} />
            </div>
            
            <div className="mt-6 text-center text-sm animate-in fade-in duration-1000 delay-500">
              {"Don't have an account? "}
              <Link href="/register" className="text-blue-600 hover:underline transition-all duration-200 hover:text-blue-700">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
