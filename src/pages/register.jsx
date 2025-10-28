import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    setError("");
    try {
      register(name.trim(), email.trim(), password.trim());
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
          <section className="card hidden h-full flex-col justify-between bg-white/85 p-10 text-wine lg:flex">
            <div>
              <span className="badge">Set up your space</span>
              <h1 className="mt-6 text-3xl font-bold md:text-4xl">
                Run meetings with confidence and structure.
              </h1>
              <p className="mt-4 text-base text-wine/70">
                Create your account to start inviting members, assigning roles, and raising motions
                that stay on track—whether you meet in person or asynchronously.
              </p>
            </div>
            <ul className="mt-12 space-y-4 text-sm text-wine/75">
              <li className="flex items-start gap-3 rounded-2xl border border-cream/70 bg-peach/30 p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-wine" />
                <div>
                  <p className="font-semibold text-wine">Structured Committees</p>
                  <p className="mt-1">Define membership, roles, and permissions in seconds.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-rose/40 bg-rose/10 p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose" />
                <div>
                  <p className="font-semibold text-wine">Motion Tracking</p>
                  <p className="mt-1">Raise motions, manage debate, and record outcomes seamlessly.</p>
                </div>
              </li>
            </ul>
          </section>

          <form
            onSubmit={onSubmit}
            className="card w-full max-w-xl border border-cream/70 bg-white/90 p-8 shadow-soft"
          >
            <div className="space-y-1 text-center lg:text-left">
              <span className="badge mx-auto lg:mx-0">Create Account</span>
              <h2 className="text-2xl font-semibold text-wine">Start your committee workspace</h2>
              <p className="text-sm text-text/65">
                Complete the details below to get access to the RONR platform.
              </p>
            </div>

            {error && (
              <p className="mt-6 rounded-2xl border border-rose/40 bg-rose/20 px-4 py-3 text-sm text-wine">
                {error}
              </p>
            )}

            <div className="mt-8 space-y-6">
              <label className="block text-sm font-semibold text-wine" htmlFor="register-name">
                Full name
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Jane Chair"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="register-email">
                Email
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="register-password">
                Password
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Create a secure password"
                  required
                />
              </label>
            </div>

            <button type="submit" className="btn-primary mt-8 w-full justify-center">
              Sign up
            </button>

            <p className="mt-6 text-center text-sm text-text/70">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-wine hover:text-rose">
                Log in instead
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
