"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const router = useRouter();

  // Redirect if logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) router.push("/tasks");
    });
  }, [router]);

  // Auto-hide alert
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setAlert({ type: "error", message: error.message });
      } else {
        setAlert({ type: "success", message: "Login successful! Redirecting..." });
        router.push("/tasks");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setAlert({ type: "error", message: error.message });
      } else {
        setAlert({
          type: "success",
          message: "Account created! Please check your email to confirm.",
        });
      }
    }

    setLoading(false);
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-4 relative">

      {/* ✅ Modern Animated Alert */}
      {alert && (
        <div
          className={`fixed top-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-in fade-in zoom-in slide-in-from-top-3 
            ${alert.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {alert.message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md transition-all">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              required
              placeholder="you@example.com"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
