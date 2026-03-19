import { useState, useEffect } from "react";

interface User {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
}

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (res.ok && data.success) {
          setUser(data.user || null);
        } else {
          setError(data.message || "Failed to fetch user");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const isViewOnly = true//user?.role === "super_admin_viewer";

  return {
    user,
    isLoading,
    error,
    isViewOnly,
  };
}
