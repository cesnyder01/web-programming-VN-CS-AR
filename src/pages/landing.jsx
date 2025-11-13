import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const featureCards = [
  {
    title: "Run Hybrid Meetings",
    text: "Coordinate synchronous and asynchronous discussions while keeping every voice in order.",
  },
  {
    title: "Guide Motions Easily",
    text: "Raise, amend, postpone, or revisit motions with built-in guardrails inspired by RONR.",
  },
  {
    title: "Record Decisions",
    text: "Capture debate summaries, final votes, and outcomes so committees never lose context.",
  },
];

export default function Landing() {
  const { appData } = useAuth();
  const isLoggedIn = appData?.auth?.isLoggedIn;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-peach via-cream to-sand">
      <div className="absolute inset-0 opacity-70">
        <div className="mx-auto h-full max-w-5xl translate-y-6 rounded-full bg-white/40 blur-3xl" />
      </div>

      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 md:px-8">
          <Link to="/" className="flex items-center gap-3 rounded-full bg-white/60 px-4 py-2 text-lg font-semibold text-wine shadow-soft backdrop-blur">
            <span className="badge">RONR</span>
            <span>Rules of Order</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link to="/committees" className="btn-primary">
                Enter Workspace
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="relative z-10 px-6 pb-24 pt-10 sm:pt-16 md:px-8">
        <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="badge">Final Project • CSCI 432</span>
            <h1 className="text-4xl font-bold text-wine sm:text-5xl">
              Modern Committees guided by Robert&apos;s Rules.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text/80 lg:mx-0">
              Build order, transparency, and inclusion into every meeting. Designed for teams who
              need structured motions, rich discussion threads, and accountable vote records—online
              or in person.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              {isLoggedIn ? (
                <Link to="/committees" className="btn-primary">
                  Continue to Committees
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">
                    Create an Account
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    I already have access
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="card relative overflow-hidden border border-peach/60 bg-white/80 p-10">
            <div className="absolute right-10 top-8 flex items-center gap-2 text-sm font-semibold text-rose/80">
              <span className="inline-flex h-2 w-2 rounded-full bg-rose" />
              Live Agenda
            </div>
            <h2 className="text-xl font-semibold text-wine">Upcoming Session</h2>
            <p className="mt-1 text-sm text-text/70">Strategic Planning Committee • Oct 2</p>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "Motion: Adopt the hybrid charter",
                  description: "Requires majority vote • discussion limited to 10 minutes per speaker",
                },
                {
                  title: "Special motion: Suspend debate rules",
                  description: "Needs 2/3 vote • no discussion",
                },
                {
                  title: "Review: Sustainability task force summary",
                  description: "Chair notes and decision history",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-cream/70 bg-peach/30 p-4 shadow-inner"
                >
                  <h3 className="text-base font-semibold text-wine">{item.title}</h3>
                  <p className="mt-1 text-sm text-text/70">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose/40 bg-rose/10 p-4">
              <div className="h-10 w-10 rounded-full bg-rose/40" />
              <div>
                <p className="text-sm font-semibold text-wine">Chair Control Center</p>
                <p className="text-xs text-text/60">
                  Toggle offline mode, speaking order, and vote thresholds with one panel.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-wine sm:text-3xl">
            Built for orderly collaboration
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-text/70">
            The platform adapts Robert&apos;s Rules with flexible controls so hybrid and asynchronous
            committees can stay aligned.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="card h-full border border-wine/10 bg-white/80 p-7 text-center">
                <h3 className="text-lg font-semibold text-wine">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text/70">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-cream/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-text/70 md:flex-row md:px-8">
          <p>© {new Date().getFullYear()} RONR Platform • CSCI 432 Final Project</p>
          <div className="flex items-center gap-4">
            <Link to="/register" className="hover:text-wine">
              Register
            </Link>
            <Link to="/login" className="hover:text-wine">
              Log In
            </Link>
            {isLoggedIn && (
              <Link to="/committees" className="hover:text-wine">
                Committees
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
