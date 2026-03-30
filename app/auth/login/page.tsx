"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormTooltipError from "@/components/ui/form-tooltip-error"
import LoadingModal from '@/components/app/LoadingModal'
import FirstLoginSuccess from '@/components/app/FirstLoginSuccess'
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { validateEmail } from "@/lib/validators"

interface LoginResponse {
  success: boolean
  message: string
  data?: {
    user: {
      name: string
      role: string
      account_status: string
      first_login: boolean
    }
  }
  errors?: Record<string, string[]>
  retry_after?: number
}

export default function LoginPage() {
  const router = useRouter()
  const showToast = (title: string, description: string, type: "success" | "error" | "warning") => {
    if (type === "success") {
      toast.success(title, { description })
      return
    }
    if (type === "warning") {
      toast.warning(title, { description })
      return
    }
    toast.error(title, { description })
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [showFirstLoginSuccess, setShowFirstLoginSuccess] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)

  // ✅ NEW: touched state
  const [touched, setTouched] = useState<{
    email?: boolean
    password?: boolean
  }>({})

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        const data = await res.json()

        if (res.ok && data.success && data.user) {
          const { role, first_login, account_status } = data.user

          if (first_login) {
            router.replace("/auth/change-password")
            return
          }

          if (account_status === "suspended") {
            setAuthChecking(false)
            return
          }

          if (role === "super_admin" || role === "admin" || role === "super_admin_viewer") router.replace("/admin")
          else router.replace("/login")

          return
        }
      } catch {
        // Not logged in, stay on login
      }

      setAuthChecking(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setCountdown(retryAfter)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) return prev - 1
          clearInterval(timer)
          return null
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setFieldErrors({})
    setRetryAfter(null)
    setShowLoadingModal(true)

    // mark all as touched on submit
    setTouched({
      email: true,
      password: true,
    })

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setFieldErrors({ email: [emailValidation.message!] })
      setLoading(false)
      setShowLoadingModal(false)
      return
    }

    if (!password.trim()) {
      setFieldErrors({ password: ["Password is required"] })
      setLoading(false)
      setShowLoadingModal(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Page-URL': typeof window !== 'undefined' ? window.location.href : '',
        },
        body: JSON.stringify({ email, password }),
      })

      const data: LoginResponse = await res.json()
      setShowLoadingModal(false)

      if (res.ok && data.success && data.data) {
        const { role, first_login, account_status } = data.data.user

        if (first_login) {
          setUserData(data.data)
          setShowFirstLoginSuccess(true)
          setLoading(false)
          return
        }

        if (account_status === 'suspended') {
          showToast("Account Suspended", "Please contact administrator.", "error")
          setLoading(false)
          return
        }

        showToast("Login Successful", "Redirecting to dashboard...", "success")

        setTimeout(() => {
          if (role === 'super_admin' || role === 'admin' || role === 'super_admin_viewer') router.push('/admin')
          else router.push('/login')
        }, 900)

      } else {
        if (data.errors) {
          setFieldErrors(data.errors)
        }

        if (res.status === 401) {
          setFieldErrors({
            password: ["Invalid email or password"],
          })
          showToast("Invalid Credentials", "Please check your login details.", "error")
        }

        if (data.retry_after) {
          setRetryAfter(data.retry_after)
          showToast(
            "Too Many Attempts",
            `Please wait ${data.retry_after}s before trying again.`,
            "warning"
          )
        }

        if (!data.errors && !data.retry_after) {
          showToast("Login Failed", data.message || "Something went wrong.", "error")
        }
      }

    } catch {
      setShowLoadingModal(false)
      showToast("Network Error", "Please check your connection.", "error")
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (field: string) =>
    fieldErrors[field]?.[0] ?? ""

  const handleCloseFirstLoginSuccess = () => {
    setShowFirstLoginSuccess(false)
    router.push("/auth/change-password")
  }

  if (authChecking) return null

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(/images/background/bg_login.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-16 relative py-8">

        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-12 lg:left-16">
          <img
            src="/images/logo/abic-logo-black.png"
            alt="ABIC Logo"
            className="w-56 sm:w-64 lg:w-72 h-auto object-contain"
          />
        </div>

        <div className="w-full max-w-sm sm:max-w-md">
          <div className="rounded-xl shadow-lg border bg-white border-gray-200 p-4 sm:p-6 lg:p-8">

            <div className="mb-8 flex justify-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Login
              </h1>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate className="space-y-4">

              <input type="text" name="fake_username" style={{ display: 'none' }} />
              <input type="password" name="fake_password" style={{ display: 'none' }} />

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    type="email"
                    name="login_email"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value
                      setEmail(value)

                      if (fieldErrors.email) {
                        const validation = validateEmail(value)
                        if (validation.isValid) {
                          setFieldErrors((prev) => {
                            const updated = { ...prev }
                            delete updated.email
                            return updated
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, email: true }))
                      const validation = validateEmail(email)
                      if (!validation.isValid) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: [validation.message!],
                        }))
                      }
                    }}
                    disabled={loading || !!countdown}
                    className={`h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 ${touched.email && getFieldError('email') ? 'border-red-500' : ''
                      }`}
                  />
                </div>

                {touched.email && (
                  <FormTooltipError
                    message={getFieldError("email")}
                    onClose={() =>
                      setFieldErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.email
                        return updated
                      })
                    }
                  />
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="login_password"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value
                      setPassword(value)

                      if (fieldErrors.password && value.trim()) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev }
                          delete updated.password
                          return updated
                        })
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, password: true }))
                      if (!password.trim()) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: ["Password is required"],
                        }))
                      }
                    }}
                    disabled={loading || !!countdown}
                    className={`h-10 pl-10 pr-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 ${touched.password && getFieldError('password') ? 'border-red-500' : ''
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {touched.password && (
                  <FormTooltipError
                    message={getFieldError("password")}
                    onClose={() =>
                      setFieldErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.password
                        return updated
                      })
                    }
                  />
                )}
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-sm text-[#7B0F2B] hover:text-[#5E0C20]"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading || !!countdown}
                className="w-full h-10 font-medium rounded-lg bg-[#7B0F2B] hover:bg-[#5E0C20] text-white"
              >
                {countdown ? `Please wait ${countdown}s` : "Sign in"}
              </Button>

            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-black/80">
              © 2026 ABIC Realty & Consultancy Corporation
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1"></div>

      <LoadingModal
        isOpen={showLoadingModal}
        title="Signing In"
        message="Please wait while we authenticate your credentials..."
      />

      <FirstLoginSuccess
        isOpen={showFirstLoginSuccess}
        onClose={handleCloseFirstLoginSuccess}
        userName={userData?.user?.name}
      />
    </div>
  )
}
