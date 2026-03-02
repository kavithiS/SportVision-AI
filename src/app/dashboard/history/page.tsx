import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserUploads } from "@/lib/db-utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  // Users must be signed in to see history
  if (!session?.user?.email) {
    return (
      <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
        {/* Ambient lighting */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md px-4">
            {/* Lock icon */}
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Sign in to view history</h2>
            <p className="text-slate-400 text-base mb-8 leading-relaxed">
              Your upload history is saved when you&apos;re signed in with Google. All analyses are private to your account.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 hover:scale-[1.02]"
            >
              Sign in with Google
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let uploads: Awaited<ReturnType<typeof getUserUploads>> = [];
  let fetchError = "";

  try {
    const userId = (session.user as any).id as string | undefined;
    if (userId) {
      uploads = await getUserUploads(userId);
    }
  } catch (err: any) {
    fetchError = err?.message ?? "Unknown error";
    console.error("HistoryPage DB error:", err);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">

        {/* Page header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-2">
                Your Upload History
              </h1>
              <p className="text-slate-500 text-base">
                Review your AI-analyzed sports moments
              </p>
            </div>
            {uploads.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 text-sm font-medium">
                  {uploads.length} {uploads.length === 1 ? "upload" : "uploads"}
                </span>
                <Link
                  href="/upload"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-medium transition-colors"
                >
                  + New Upload
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-red-300 font-medium">Could not load history</p>
                <p className="text-red-400/70 text-sm mt-1">{fetchError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {uploads.length === 0 && !fetchError && (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32">
            {/* Empty state illustration */}
            <div className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-center">No uploads yet</h3>
            <p className="text-slate-400 text-center max-w-sm mb-8">
              Upload your first sports image and let our AI identify the sport, equipment, and context.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Upload your first image
            </Link>
          </div>
        )}

        {/* 3-column responsive grid */}
        {uploads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.07)]"
              >
                {/* Image */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.imageUrl}
                    alt={u.sportName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  {/* Sport badge overlapping bottom-left of image */}
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {u.sportName || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Card body — flex-grow so footer always sits at bottom */}
                <div className="flex flex-col flex-1 p-5">
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 flex-1">
                    {u.description || (
                      <span className="text-slate-600 italic">No description available.</span>
                    )}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
