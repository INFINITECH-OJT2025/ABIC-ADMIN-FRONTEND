"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormTooltipError from "@/components/ui/form-tooltip-error"
import LoadingModal from '@/components/app/LoadingModal'
import { toast } from "sonner"
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter();
  const showToast = (title: string, description: string, type: "success" | "error" | "warning") => {
    if (type === "success") {
      toast.success(title, { description });
      return;
    }

    if (type === "warning") {
      toast.warning(title, { description });
      return;
    }

    toast.error(title, { description });
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<{
    current_password?: boolean
    new_password?: boolean
    new_password_confirmation?: boolean
  }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
  });

  useEffect(() => {
    const validatePassword = (password: string) => {
      setPasswordValidation({
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      });
    };
    validatePassword(newPassword);
  }, [newPassword]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: 'include' });
        if (!res.ok) router.push("/login");
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ current_password: true, new_password: true, new_password_confirmation: true });
    setLoading(true);
    setFieldErrors({});
    setShowLoadingModal(true);

    if (newPassword !== confirmPassword) {
      setShowLoadingModal(false);
      showToast("Validation Error", "New passwords do not match", "error");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setShowLoadingModal(false);
      showToast("Validation Error", "Password does not meet all requirements", "error");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Page-URL": typeof window !== 'undefined' ? window.location.href : '',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();
      setShowLoadingModal(false);

      if (res.ok && data.success) {
        showToast(
          "Password Changed",
          "Your password has been successfully updated! Redirecting to login...",
          "success"
        );
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setFieldErrors(data.errors || {});
        showToast(
          "Password Change Failed",
          data.message || "Failed to change password",
          "error"
        );
      }
    } catch {
      setShowLoadingModal(false);
      showToast("Network Error", "Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string) =>
    fieldErrors[fieldName]?.[0] ?? '';

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(/images/background/bg_login.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:flex-1 relative" />

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-16 relative py-8">

        {/* Logo Top Right */}
        <div className="absolute top-6 right-6 lg:top-12 lg:right-16">
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
                  Change Password
                </h1>
                <p className="text-sm text-gray-600">
                  Set your permanent password for security
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* CURRENT PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    className="h-10 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.current_password &&
                  <FormTooltipError message={getFieldError('current_password')} />
                }
              </div>

              {/* NEW PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, new_password: true }))
                      if (!isPasswordValid && newPassword) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          new_password: ["Password does not meet all requirements"],
                        }))
                      }
                    }}
                    disabled={loading}
                    className={`h-10 pl-10 pr-10 ${touched.new_password && getFieldError('new_password') ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {touched.new_password && (
                  <FormTooltipError
                    message={getFieldError('new_password')}
                    onClose={() =>
                      setFieldErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.new_password
                        return updated
                      })
                    }
                  />
                )}

                {newPassword && (
                  <div className="mt-3 text-xs space-y-1">
                    {Object.entries(passwordValidation).map(([key, value], i) => (
                      <div key={i} className="flex items-center gap-2">
                        {value
                          ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                          : <div className="h-3 w-3 rounded-full border border-gray-300" />
                        }
                        <span className={value ? "text-green-600" : "text-gray-500"}>
                          {key === "minLength" && "At least 8 characters"}
                          {key === "hasUppercase" && "One uppercase letter"}
                          {key === "hasLowercase" && "One lowercase letter"}
                          {key === "hasNumber" && "One number"}
                          {key === "hasSymbol" && "One symbol"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value
                      setConfirmPassword(value)
                      if (fieldErrors.new_password_confirmation && value === newPassword) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev }
                          delete updated.new_password_confirmation
                          return updated
                        })
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, new_password_confirmation: true }))
                      if (confirmPassword && confirmPassword !== newPassword) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          new_password_confirmation: ["Passwords do not match."],
                        }))
                      }
                    }}
                    disabled={loading}
                    className={`h-10 pl-10 pr-10 ${touched.new_password_confirmation && getFieldError('new_password_confirmation') ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {touched.new_password_confirmation && (
                  <FormTooltipError
                    message={getFieldError('new_password_confirmation')}
                    onClose={() =>
                      setFieldErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.new_password_confirmation
                        return updated
                      })
                    }
                  />
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full h-10 font-medium rounded-lg bg-[#7B0F2B] hover:bg-[#5E0C20] text-white"
              >
                {loading ? "Changing Password..." : "Change Password"}
              </Button>

            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/80">
              2026 ABIC Realty & Consultancy Corporation
            </p>
          </div>

        </div>
      </div>

      <LoadingModal
        isOpen={showLoadingModal}
        title="Changing Password"
        message="Please wait while we update your password..."
      />
    </div>
  );
}
