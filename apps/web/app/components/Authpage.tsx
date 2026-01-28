"use client";

import { useState } from "react";

export function Authpage({
  isSignin,
  onSuccess,
  onClose,
}: {
  isSignin: boolean;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/${
          isSignin ? "signin" : "signup"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            isSignin
              ? { email, password }
              : { email, password, name }
          ),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Authentication failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
      <div className="w-[360px] rounded-xl bg-white shadow-xl p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold text-gray-900">
          {isSignin ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isSignin
            ? "Login to save and collaborate"
            : "Sign up to save and share your canvas"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {!isSignin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isSignin
              ? "Sign in"
              : "Sign up"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {isSignin ? "New here?" : "Already have an account?"}{" "}
          <span className="text-indigo-600 font-medium cursor-pointer">
            {isSignin ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}
