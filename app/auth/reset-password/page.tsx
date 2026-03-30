"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import FormTooltipError from "@/components/ui/form-tooltip-error"
import LoadingModal from "@/components/app/LoadingModal"
import { toast } from "sonner"
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"

const PASSWORD_SYMBOLS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const [authChecking, setAuthChecking] = useState(true)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [touched, setTouched] = useState<{
    password?: boolean
    password_confirmation?: boolean
  }>({})
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
  })

  const token = searchParams.get("token")
  const email = searchParams.get("email")

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

          if (role === "super_admin") router.replace("/super-admin")
          else if (role === "admin" || role === "super_admin_viewer") router.replace("/admin")
          else router.replace("/login")

          return
        }
      } catch {
        // Not logged in, stay on page
      }

      setAuthChecking(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!token || !email) {
      showToast(
        "Invalid Reset Link",
        "Please use the link from your email.",
        "error"
      )
      setTimeout(() => {
        router.push("/auth/forgot-password")
      }, 2000)
    }
  }, [token, email, router])

  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: PASSWORD_SYMBOLS.test(password),
    })
  }, [password])

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const getFieldError = (field: string) =>
    fieldErrors[field]?.[0] ?? ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || !email) {
      return
    }

    setTouched({ password: true, password_confirmation: true })
    setFieldErrors({})
    setLoading(true)
    setShowLoadingModal(true)

    if (!isPasswordValid) {
      setFieldErrors({
        password: ["Password does not meet all requirements"],
      })
      setLoading(false)
      setShowLoadingModal(false)
      return
    }

    if (password !== passwordConfirmation) {
      setFieldErrors({
        password_confirmation: ["Passwords do not match."],
      })
      setLoading(false)
      setShowLoadingModal(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Page-URL": typeof window !== 'undefined' ? window.location.href : '',
        },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      })

      const data = await res.json()
      setShowLoadingModal(false)

      if (res.ok && data.success) {
        showToast(
          "Password Reset Successful",
          "Your password has been reset. Please login with your new password.",
          "success"
        )

        setTimeout(() => {
          router.push("/login")
        }, 1500)
      } else {
        if (data.errors) setFieldErrors(data.errors)

        showToast(
          "Failed to Reset Password",
          data.message || "Something went wrong.",
          "error"
        )
      }
    } catch {
      setShowLoadingModal(false)
      showToast("Network Error", "Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (authChecking) return null

  if (!token || !email) {
    return null
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(/images/background/forgotp_light.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* LEFT COLUMN (Empty - background shows) */}
      <div className="hidden lg:flex lg:flex-1" />

      {/* RIGHT COLUMN (Form Column) */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-16 relative py-8">
        {/* Logo Top Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-12 lg:right-16">
          <img
            src="/images/logo/abic-logo-black.png"
            alt="ABIC Logo"
            className="w-56 sm:w-64 lg:w-72 h-auto object-contain"
          />
        </div>

        <div className="w-full max-w-sm sm:max-w-md">
          <div className="rounded-xl shadow-lg border bg-white border-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h1>
                <p className="text-sm text-gray-600">
                  Enter your new password
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              noValidate
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  New Password
                </label>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>

                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value
                      setPassword(value)

                      if (fieldErrors.password && value) {
                        const valid =
                          value.length >= 8 &&
                          /[A-Z]/.test(value) &&
                          /[a-z]/.test(value) &&
                          /[0-9]/.test(value) &&
                          PASSWORD_SYMBOLS.test(value)
                        if (valid) {
                          setFieldErrors((prev) => {
                            const updated = { ...prev }
                            delete updated.password
                            return updated
                          })
                        }
                      }

                      if (
                        fieldErrors.password_confirmation &&
                        value === passwordConfirmation
                      ) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev }
                          delete updated.password_confirmation
                          return updated
                        })
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, password: true }))
                      if (!isPasswordValid && password) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: ["Password does not meet all requirements"],
                        }))
                      }
                    }}
                    disabled={loading}
                    className={`h-10 pl-10 pr-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] ${touched.password && getFieldError("password")
                      ? "border-red-500"
                      : ""
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

                {/* Password Validation Indicators */}
                {password && (
                  <div className="mt-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
                    <p className="text-xs font-medium mb-2 text-gray-700">
                      Password must contain:
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.minLength ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span className={passwordValidation.minLength ? "text-green-600" : "text-gray-500"}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasUppercase ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span className={passwordValidation.hasUppercase ? "text-green-600" : "text-gray-500"}>
                          One uppercase letter (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasLowercase ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span className={passwordValidation.hasLowercase ? "text-green-600" : "text-gray-500"}>
                          One lowercase letter (a-z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasNumber ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}>
                          One number (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasSymbol ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span className={passwordValidation.hasSymbol ? "text-green-600" : "text-gray-500"}>
                          One symbol (!@#$%^&* etc.)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Confirm Password
                </label>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>

                  <Input
                    type={showPasswordConfirmation ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwordConfirmation}
                    onChange={(e) => {
                      const value = e.target.value
                      setPasswordConfirmation(value)

                      if (
                        fieldErrors.password_confirmation &&
                        value === password
                      ) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev }
                          delete updated.password_confirmation
                          return updated
                        })
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({
                        ...prev,
                        password_confirmation: true,
                      }))
                      if (passwordConfirmation !== password) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          password_confirmation: ["Passwords do not match."],
                        }))
                      }
                    }}
                    disabled={loading}
                    className={`h-10 pl-10 pr-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] ${touched.password_confirmation &&
                      getFieldError("password_confirmation")
                      ? "border-red-500"
                      : ""
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordConfirmation(!showPasswordConfirmation)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {touched.password_confirmation && (
                  <FormTooltipError
                    message={getFieldError("password_confirmation")}
                    onClose={() =>
                      setFieldErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.password_confirmation
                        return updated
                      })
                    }
                  />
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isPasswordValid || password !== passwordConfirmation}
                className="w-full h-10 font-medium rounded-lg bg-[#7B0F2B] hover:bg-[#5E0C20] text-white disabled:opacity-50"
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-black/80">
              © 2026 ABIC Realty & Consultancy Corporation
            </p>
          </div>
        </div>
      </div>

      <LoadingModal
        isOpen={showLoadingModal}
        title="Resetting Password"
        message="Please wait while we reset your password..."
      />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50/50">Loading...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  )
}
