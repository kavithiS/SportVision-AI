"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATS = [
  { value: "2.5 Flash", label: "Gemini Model" },
  { value: "< 5s", label: "Analysis Time" },
  { value: "100%", label: "Free Forever" },
];

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
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

        {/* Left — welcome back panel */}
        <div className="hidden md:flex flex-col space-y-8">
          {/* Logo */}
       

          {/* Heading block */}
          <div>
            <h2 className="text-4xl font-bold tracking-tighter leading-tight mb-3">
              Welcome back.<br />
              <span className="text-slate-400">Ready to analyze?</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Sign in to access your personal AI sports dashboard and pick up right where you left off.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] transition-colors">
                <p className="text-emerald-400 font-bold text-xl tracking-tight">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              &ldquo;Incredible accuracy — it identified the exact sport and even the player positions instantly.&rdquo;
            </p>
            <p className="text-slate-600 text-xs mt-3">&mdash; SportVision User</p>
          </div>
        </div>

        {/* Right — sign-in card */}
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
              <h1 className="text-2xl font-bold tracking-tighter mb-1.5">Sign in to your account</h1>
              <p className="text-slate-500 text-sm">Sign in to continue to your dashboard.</p>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-slate-600 uppercase tracking-widest">continue with</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <button
              onClick={handleSignIn}
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
              {loading ? "Signing in…" : "Sign in with Google"}
            </button>

            <p className="mt-5 text-center text-xs text-slate-600">
              By signing in you agree to our{" "}
              <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-300 transition-colors">Terms</span>
              {" "}&amp;{" "}
              <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-300 transition-colors">Privacy Policy</span>.
            </p>

            <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  Create one →
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
