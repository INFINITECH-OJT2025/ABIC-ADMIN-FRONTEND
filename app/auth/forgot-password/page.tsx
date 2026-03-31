"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import FormTooltipError from "@/components/ui/form-tooltip-error"
import LoadingModal from "@/components/app/LoadingModal"
import { toast } from "sonner"
import { Mail } from "lucide-react"
import { validateEmail } from "@/lib/validators"

export default function ForgotPasswordPage() {
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

  const [authChecking, setAuthChecking] = useState(true)
  const [email, setEmail] = useState("")

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
        // Not logged in, stay on page
      }

      setAuthChecking(false)
    }

    checkAuth()
  }, [router])

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean }>({})

  const getFieldError = (field: string) =>
    fieldErrors[field]?.[0] ?? ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({ email: true })
    setFieldErrors({})
    setLoading(true)
    setShowLoadingModal(true)

    const validation = validateEmail(email)

    if (!validation.isValid) {
      setFieldErrors({ email: [validation.message!] })
      setLoading(false)
      setShowLoadingModal(false)
      return
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Page-URL": typeof window !== 'undefined' ? window.location.href : '',
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      setShowLoadingModal(false)

      if (res.ok && data.success) {
        showToast(
          "Reset Link Sent",
          "Please check your email for reset instructions.",
          "success"
        )

        setTimeout(() => {
          router.push("/login")
        }, 1500)
      } else {
        if (data.errors) setFieldErrors(data.errors)

        // User-friendly messages for specific cases
        let toastTitle = "Failed to Send Reset Link"
        let toastMessage = data.message || "Something went wrong."

        if (res.status === 429) {
          toastTitle = "Too Many Requests"
          toastMessage =
            data.retry_after != null
              ? `Please wait ${data.retry_after} seconds before trying again.`
              : "Please wait a moment before trying again."
        } else if (res.status === 422 && data.errors?.email) {
          toastMessage = data.errors.email[0] ?? toastMessage
        }

        showToast(toastTitle, toastMessage, "error")
      }
    } catch {
      setShowLoadingModal(false)
      showToast("Network Error", "Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (authChecking) return null

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
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-600">
                  Enter your email to receive a reset link
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
                  Email Address
                </label>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>

                  <Input
                    type="email"
                    placeholder="Enter your email address"
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
                        setFieldErrors({ email: [validation.message!] })
                      }
                    }}
                    disabled={loading}
                    className={`h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] ${touched.email && getFieldError("email")
                        ? "border-red-500"
                        : ""
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 font-medium rounded-lg bg-[#7B0F2B] hover:bg-[#5E0C20] text-white"
              >
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
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
        title="Sending Reset Link"
        message="Please wait while we send the reset instructions..."
      />
    </div>
  )
}
