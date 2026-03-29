"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          const role = data.user?.role;
          if (role === "admin_head") {
            router.push("/admin");
          } else if (role === "super_admin") {
            router.push("/super-admin");
          } else if (role === "accountant") {
            router.push("/accountant");
          } else {
            router.push("/login");
          }
        } else {
          // Temporarily redirect to admindevelopment
          router.push("/admin");
        }
      } catch (err) {
        // Temporarily redirect to admindevelopment
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (loading) {
    return <div style={{ padding: 40 }}>Redirecting...</div>;
  }

  return null;
}
