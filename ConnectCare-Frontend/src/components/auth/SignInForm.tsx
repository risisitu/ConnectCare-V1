import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <span className="text-4xl font-bold text-brand-600 dark:text-brand-500">CC</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-white ml-2">ConnectCare+</span>
              </div>
            </div>

            {/* Role toggle */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Sign in as</span>
              <div className="inline-flex p-1 bg-gray-100 rounded-lg dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`px-3 py-1 text-sm rounded-md transition ${role === "patient" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white/90 shadow" : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`px-3 py-1 text-sm rounded-md transition ${role === "doctor" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white/90 shadow" : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`px-3 py-1 text-sm rounded-md transition ${role === "admin" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white/90 shadow" : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  const rolePath = role === "admin" ? "admin" : role === "doctor" ? "doctors" : "patients";
                  const url = `${import.meta.env.VITE_API_URL}/api/${rolePath}/login`;
                  const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.success) {
                    setError(data?.message || "Sign in failed");
                    setLoading(false);
                    return;
                  }

                  const user = data.data || {};
                  if (user.token) localStorage.setItem("token", user.token);
                  localStorage.setItem(
                    "user",
                    JSON.stringify({
                      id: user.id,
                      email: user.email,
                      first_name: user.first_name || "",
                      last_name: user.last_name || "",
                      role,
                    })
                  );
                  window.dispatchEvent(new Event("authChanged"));
                  navigate("/");
                } catch (err: any) {
                  setError(err?.message || "Network error");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </button>
                </div>
                {error && (
                  <div className="text-center">
                    <p className="text-sm text-error-500">{error}</p>
                  </div>
                )}
                <div>
                  <Button type="submit" className="w-full" size="sm" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
