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
  const router = useRouter();

  // If already logged in → redirect
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) router.push("/tasks");
    });
  }, [router]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        alert(error.message);
      } else {
        router.push("/tasks");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Account created! Please check your email to confirm (if required).");
      }
    }

    setLoading(false);
  });

  return (
    <div className="flex justify-center mt-16">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...register("email")}
              type="email"
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              {...register("password")}
              type="password"
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-blue-600 text-white"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-4 text-sm text-center">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-blue-600 underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-blue-600 underline"
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
