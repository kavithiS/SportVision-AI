"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "AI Sport Detection",
    desc: "Gemini 2.5 Flash instantly identifies the sport, scene and context.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: "Private Upload History",
    desc: "Every analyzed image is saved in a personal, secure history.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: "No Password Required",
    desc: "Secured by your Google account. One click and you're in.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
      </svg>
    ),
    title: "100% Free",
    desc: "No credit card, no trial. Upload and analyze for free.",
  },
];

export default function SignUpPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard/history");
  }, [status, router]);

  async function handleSignUp() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard/history" });
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-950 text-white flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1fr_420px] gap-16 items-center">

        {/* Left — feature / brand panel */}
        <div className="hidden md:flex flex-col space-y-8">
          {/* Logo */}
        

          {/* Heading block */}
          <div>
            <h2 className="text-4xl font-bold tracking-tighter leading-tight mb-3">
              Your AI sports<br />
              <span className="text-slate-400">analyst, for free.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Upload any image. Our AI identifies the sport, analyzes the scene, and saves your history — all in seconds.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{f.title}</p>
                  <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sign-up card */}
        <div className="w-full">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-8">
            <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span className="text-lg font-bold"><span className="text-emerald-400">SportVision</span> AI</span>
          </div>

          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
            {/* Top shimmer line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tighter mb-1.5">Create your account</h1>
              <p className="text-slate-500 text-sm">Free forever. No credit card needed.</p>
            </div>

            {/* Mobile feature bullets */}
            <div className="md:hidden mb-6 space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400 flex-shrink-0">{f.icon}</span>
                  <span className="text-slate-300 font-medium">{f.title}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-slate-600 uppercase tracking-widest">sign up with</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all duration-200 shadow-lg shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.015] active:scale-[0.985]"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading ? "Creating account…" : "Sign up with Google"}
            </button>

            <p className="mt-5 text-center text-xs text-slate-600">
              By signing up you agree to our{" "}
              <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-300 transition-colors">Terms</span>
              {" "}&amp;{" "}
              <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-300 transition-colors">Privacy Policy</span>.
            </p>

            <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors tracking-wide">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
