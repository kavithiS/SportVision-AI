"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/dashboard/history", label: "History" },
];

function AuthDropdown({ session }: { session: any }) {
  const [open, setOpen] = useState(false);

  function maskEmail(email?: string) {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
    return `${visible}…@${domain}`;
  }

  function initials(name?: string, email?: string) {
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (email) return (email[0] || 'U').toUpperCase();
    return 'U';
  }

  const displayName = session.user?.name || session.user?.email?.split('@')[0];
  const masked = maskEmail(session.user?.email);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-3 pl-2 pr-2 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] transition-all"
        aria-haspopup="menu"
        aria-expanded={open}
        title={session.user?.email}
      >
        {session.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? 'avatar'}
            className="w-9 h-9 rounded-full object-cover"
            onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-sm font-semibold">
            {initials(session.user?.name, session.user?.email)}
          </div>
        )}

        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-sm text-white font-medium truncate max-w-[120px]">{displayName}</span>
          <span className="text-xs text-slate-400">{masked}</span>
        </div>

        <svg className={`w-4 h-4 text-slate-300 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M6 8l4 4 4-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950 border border-white/[0.04] shadow-lg py-2 z-40">
          <div className="px-4 py-3 border-b border-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-semibold">{initials(session.user?.name, session.user?.email)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{displayName}</div>
                <div className="text-xs text-slate-400 truncate">{masked}</div>
              </div>
            </div>
          </div>
          <Link href="/dashboard/history" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.03]">Dashboard</Link>
          <Link href="/upload" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.03]">New Upload</Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.03]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight select-none group"
        >
          <svg className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <span className="text-emerald-400 group-hover:text-emerald-300 transition-colors">SportVision</span>
          <span className="text-white">AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Auth section (redesigned): avatar + dropdown on desktop, compact on mobile */}
        <div className="hidden sm:flex items-center gap-3 relative">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-slate-800/80 animate-pulse" />
          ) : session ? (
            <AuthDropdown session={session} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm px-4 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] font-medium transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/20 hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/[0.06] transition"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-slate-300 transition-transform duration-200 origin-center ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-slate-300 transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-slate-300 transition-transform duration-200 origin-center ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-950/80 backdrop-blur-lg px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium py-1.5 ${
                pathname === href ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              {label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-sm py-2 rounded-lg bg-slate-800 text-slate-200 text-left px-3"
            >
              Sign out ({session.user?.email})
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-sm py-2 px-3 rounded-lg border border-slate-700 text-slate-300 text-center font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="block text-sm py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
