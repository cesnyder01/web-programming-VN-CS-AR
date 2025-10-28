import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    setError("");
    try {
      login(email.trim(), password.trim());
      navigate("/committees");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-peach via-cream to-sand">
      <div className="absolute inset-0 opacity-70">
        <div className="mx-auto h-full max-w-5xl translate-y-10 rounded-full bg-white/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-14 md:px-10">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-5 py-2 text-sm font-semibold text-wine shadow-soft transition hover:-translate-y-0.5"
        >
          ← Back to landing
        </Link>

        <div className="mt-12 grid flex-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="card hidden h-full flex-col justify-between bg-white/80 p-10 text-wine lg:flex">
            <div>
              <span className="badge">Robert&apos;s Rules</span>
              <h1 className="mt-6 text-3xl font-bold md:text-4xl">
                Welcome back to orderly collaboration.
              </h1>
              <p className="mt-4 text-base text-wine/70">
                Keep motions organized, track discussions, and capture every decision with clarity.
                Use your registered email to sign in and rejoin your committees.
              </p>
            </div>
            <div className="mt-12 space-y-4 text-sm text-wine/70">
              <div className="rounded-2xl border border-cream/80 bg-peach/30 p-4">
                <p className="font-semibold text-wine">Need an account?</p>
                <p className="mt-1">
                  <Link to="/register" className="font-semibold text-rose hover:text-wine">
                    Register here
                  </Link>{" "}
                  and invite teammates to your committee workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4">
                <p className="font-semibold text-wine">Forgot your password?</p>
                <p className="mt-1">Reach out to the chair to reset access for now.</p>
              </div>
            </div>
          </section>

          <form
            onSubmit={onSubmit}
            className="card w-full max-w-xl border border-cream/70 bg-white/90 p-8 shadow-soft"
          >
            <div className="space-y-1 text-center lg:text-left">
              <span className="badge mx-auto lg:mx-0">Log in</span>
              <h2 className="text-2xl font-semibold text-wine">Sign in to your workspace</h2>
              <p className="text-sm text-text/65">
                Enter the email and password you used during registration.
              </p>
            </div>

            {error && (
              <p className="mt-6 rounded-2xl border border-rose/40 bg-rose/20 px-4 py-3 text-sm text-wine">
                {error}
              </p>
            )}

            <div className="mt-8 space-y-6">
              <label className="block text-sm font-semibold text-wine" htmlFor="login-email">
                Email
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="login-password">
                Password
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Enter your password"
                  required
                />
              </label>
            </div>

            <button type="submit" className="btn-primary mt-8 w-full justify-center">
              Log in
            </button>

            <p className="mt-6 text-center text-sm text-text/70">
              New to the platform?{" "}
              <Link to="/register" className="font-semibold text-wine hover:text-rose">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
