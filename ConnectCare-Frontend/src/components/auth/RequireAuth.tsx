import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";

type Props = { children: ReactNode };

interface StoredUser {
  email: string;
  id: string;
  role: string;
}

/**
 * RequireAuth checks for a `token` in localStorage.
 * - If token exists: renders children
 * - If not or token invalid: redirects to `/signup`
 */
export default function RequireAuth({ children }: Props) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  async function verifyToken() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup", { replace: true });
      return;
    }

    try {
      // Get user details from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("No user data found");
      }

      const user: StoredUser = JSON.parse(userStr);

      // Call verify-token API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          id: user.id,
          role: user.role
        })
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      // Token is valid
      setChecked(true);
    } catch (err) {
      // Clear invalid auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("authChanged"));
      navigate("/signup", { replace: true });
    }
  }

  useEffect(() => {
    verifyToken();
    // We intentionally ignore location in dependency to only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null; // avoid rendering children until check completes

  return <>{children}</>;
}
