"use client";

import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

//  Types 

type FileKind = "image" | "video" | "other";
type SelectedFile = { file: File; url: string; kind: FileKind };

type AnalysisResult = {
  sport: string;
  description?: string;
  confidence: "high" | "medium" | "low";
  details?: string;
};

type UploadedFile = {
  name: string;
  size: number;
  type: string;
  status: "saved" | "rejected";
  analysis?: AnalysisResult;
  reason?: string;
};

type UploadResponse = { success: boolean; files: UploadedFile[] };
type Phase = "idle" | "uploading" | "analyzing" | "done" | "error";
interface UploadState {
  phase: Phase;
  progress?: number;
  result?: UploadResponse;
  errorMsg?: string;
}

//  Constants 

const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function getKind(type: string): FileKind {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return "other";
}

//  Component 

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ phase: "idle" });
  const [guest, setGuest] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => selected.forEach((s) => URL.revokeObjectURL(s.url));
  }, [selected]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const valid: SelectedFile[] = [];
      const rej: string[] = [];
      for (const f of arr) {
        if (!ACCEPTED_MIME.has(f.type)) {
          rej.push(`${f.name}  unsupported format. Use JPEG, PNG, GIF, or WebP.`);
          continue;
        }
        if (f.size > 50 * 1024 * 1024) {
          rej.push(`${f.name}  exceeds 50 MB limit.`);
          continue;
        }
        if (selected.some((s) => s.file.name === f.name && s.file.size === f.size)) continue;
        valid.push({ file: f, url: URL.createObjectURL(f), kind: getKind(f.type) });
      }
      setRejected(rej);
      if (valid.length) setSelected((s) => [...s, ...valid]);
    },
    [selected]
  );

  function removeFile(i: number) {
    setSelected((s) => {
      URL.revokeObjectURL(s[i].url);
      return s.filter((_, idx) => idx !== i);
    });
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };

  async function doUpload() {
    if (!selected.length) return;
    setUploadState({ phase: "uploading", progress: 0 });
    const fd = new FormData();
    selected.forEach((s) => fd.append("files", s.file));

    try {
      const resp = await new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const p = Math.round((e.loaded / e.total) * 100);
            setUploadState({ phase: "uploading", progress: p });
            if (p === 100) setUploadState({ phase: "analyzing" });
          }
        };
        xhr.onload = () => {
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(parsed);
            else reject(parsed);
          } catch {
            reject({ success: false, files: [] });
          }
        };
        xhr.onerror = () => reject({ success: false, files: [] });
        xhr.send(fd);
      });
      setSelected([]);
      setUploadState({ phase: "done", result: resp });
    } catch (err: any) {
      setUploadState({ phase: "error", errorMsg: err?.message || "Upload failed." });
    }
  }

  //  Render 

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-emerald-400/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  const isProcessing = uploadState.phase === "uploading" || uploadState.phase === "analyzing";

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-500/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-400 tracking-widest uppercase">Powered by Gemini 2.5 Flash</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
            Analyze a{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Sport
            </span>{" "}Image
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Drop an image and let Gemini AI identify the sport instantly.
          </p>
        </div>

        {/* Auth gate */}
        {status === "unauthenticated" && !guest ? (
          <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-10 sm:p-14 text-center shadow-2xl">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tighter mb-2">Sign in to save history</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Analyses are stored to MongoDB. Guests can try without saving.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => signIn("google", { callbackUrl: "/upload" })}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all duration-200 shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.99]"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
              <button
                onClick={() => setGuest(true)}
                className="px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14] text-slate-400 hover:text-slate-200 text-sm font-medium transition-all duration-200"
              >
                Continue as guest
              </button>
            </div>
          </div>
        ) : (
          <>
            {session && (
              <p className="text-xs text-slate-500 text-center -mt-6 mb-8">
                Signed in as <span className="text-slate-400">{session.user?.email}</span>
              </p>
            )}

            {/*  High-Tech Scanning State  */}
            {isProcessing && (
              <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden">
                {/* Image preview with scanning overlay */}
                {selected[0] && (
                  <div className="relative aspect-video bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected[0].url}
                      alt="Scanning"
                      className="w-full h-full object-cover opacity-60"
                    />
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    {/* Grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    {/* Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
                  </div>
                )}

                {/* Status panel */}
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                      <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-b-emerald-500/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-2">
                    {uploadState.phase === "uploading" ? "Uploading" : "Analyzing with Gemini AI"}
                    <span className="inline-flex ml-1">
                      <span className="animate-[pulse_1s_ease-in-out_infinite]">.</span>
                      <span className="animate-[pulse_1s_ease-in-out_0.2s_infinite]">.</span>
                      <span className="animate-[pulse_1s_ease-in-out_0.4s_infinite]">.</span>
                    </span>
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {uploadState.phase === "analyzing"
                      ? "Gemini 2.5 Flash is identifying the sport, equipment, and context"
                      : `Transferring your image... ${uploadState.progress ?? 0}%`}
                  </p>

                  {/* Progress bar */}
                  {uploadState.phase === "uploading" && (
                    <div className="mt-6 max-w-xs mx-auto">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          style={{ width: `${uploadState.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Skeleton pulse for analyzing state */}
                  {uploadState.phase === "analyzing" && (
                    <div className="mt-6 max-w-sm mx-auto space-y-3">
                      <div className="h-3 bg-slate-800 rounded-full animate-pulse" />
                      <div className="h-3 bg-slate-800 rounded-full w-3/4 mx-auto animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <div className="h-3 bg-slate-800 rounded-full w-1/2 mx-auto animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/*  Dropzone  */}
            {!isProcessing && uploadState.phase !== "done" && (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-16 sm:p-20 flex flex-col items-center transition-all duration-300 group ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/[0.06] shadow-[0_0_0_6px_rgba(16,185,129,0.08),0_0_80px_rgba(16,185,129,0.12)]"
                    : "border-slate-600 bg-slate-900/20 hover:border-emerald-500/40 hover:bg-slate-900/40 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.05)]"
                }`}
              >
                {/* Inner glow ring on hover/drag */}
                <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none ${
                  isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)]`} />

                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={Array.from(ACCEPTED_MIME).join(",")}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />

                {/* Upload icon */}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-300 ${
                  isDragging
                    ? "bg-emerald-500/20 border-emerald-500/40 scale-110"
                    : "bg-white/[0.03] border-white/[0.08] group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25"
                }`}>
                  <svg className={`w-10 h-10 transition-all duration-300 ${
                    isDragging ? "text-emerald-400 scale-110" : "text-slate-500 group-hover:text-emerald-400"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <p className={`text-lg font-semibold tracking-tight mb-2 transition-colors duration-200 ${
                  isDragging ? "text-emerald-300" : "text-white"
                }`}>
                  {isDragging ? "Release to upload" : "Drop images here"}
                </p>
                <p className="text-slate-500 text-sm mb-5">
                  or{" "}
                  <span className="text-emerald-400 group-hover:text-emerald-300 underline underline-offset-2 transition-colors">
                    browse files
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {["JPEG", "PNG", "GIF", "WebP"].map((fmt) => (
                    <span key={fmt} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-500 text-xs font-medium">
                      {fmt}
                    </span>
                  ))}
                  <span className="text-slate-600 text-xs ml-1">· max 50 MB</span>
                </div>
              </div>
            )}

            {/* Rejected files */}
            {rejected.length > 0 && !isProcessing && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                {rejected.map((r, i) => (
                  <p key={i} className="text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {r}
                  </p>
                ))}
              </div>
            )}

            {/* File list + Analyse button */}
            {selected.length > 0 && !isProcessing && uploadState.phase !== "done" && (
              <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {selected.length} file{selected.length !== 1 ? "s" : ""} ready
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <ul className="divide-y divide-white/[0.06]">
                  {selected.map((s, i) => (
                    <li key={s.url} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 ring-1 ring-white/[0.06]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.url} alt={s.file.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.file.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{Math.round(s.file.size / 1024)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="p-5">
                  <button
                    onClick={doUpload}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold tracking-tight transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 hover:scale-[1.01] flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Analyse with AI
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {uploadState.phase === "error" && (
              <div className="mt-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-300 font-semibold">Upload failed</p>
                    <p className="text-red-400/70 text-sm mt-1">{uploadState.errorMsg}</p>
                  </div>
                </div>
              </div>
            )}

            {/*  Stunning Result Cards  */}
            {uploadState.phase === "done" && uploadState.result && (
              <div className="space-y-6">
                {/* Success header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Analysis Complete</h2>
                    <p className="text-slate-400 text-sm">{uploadState.result.files.length} image{uploadState.result.files.length !== 1 ? 's' : ''} processed</p>
                  </div>
                </div>

                {uploadState.result.files.map((file, idx) => {
                  const analysis: AnalysisResult | null = file.analysis ?? null;
                  const isQuotaErr =
                    analysis?.description?.toLowerCase().includes("quota") ||
                    analysis?.description?.toLowerCase().includes("rate limit") ||
                    analysis?.details?.toLowerCase().includes("quota");
                  const hasRealAnalysis = analysis && analysis.sport && analysis.sport !== "Unknown";

                  const confidenceStyles: Record<string, string> = {
                    high: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                    medium: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
                    low: "bg-red-500/10 text-red-400 ring-red-500/20",
                  };

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                      {/* File header */}
                      <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{file.name}</p>
                            {file.size && (
                              <p className="text-xs text-slate-500">{Math.round(file.size / 1024)} KB</p>
                            )}
                          </div>
                        </div>
                        {analysis && !isQuotaErr && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${confidenceStyles[analysis.confidence] ?? confidenceStyles.low}`}>
                            {analysis.confidence} confidence
                          </span>
                        )}
                      </div>

                      {/* Analysis body */}
                      <div className="p-6">
                        {isQuotaErr ? (
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-amber-400 font-semibold">API rate limit reached</p>
                              <p className="text-amber-300/70 text-sm mt-1">{analysis?.description}</p>
                              <p className="text-slate-500 text-xs mt-3">
                                Wait a moment or{" "}
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                                  upgrade your plan
                                </a>
                              </p>
                            </div>
                          </div>
                        ) : hasRealAnalysis ? (
                          <div className="space-y-4">
                            {/* Sport badge - glowing */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                              <span className="text-emerald-400 font-bold tracking-tight">{analysis!.sport}</span>
                            </div>

                            {/* Description */}
                            {analysis!.description && (
                              <p className="text-slate-300 leading-relaxed tracking-tight">{analysis!.description}</p>
                            )}

                            {/* Details */}
                            {analysis!.details && (
                              <div className="pt-4 border-t border-slate-800/50">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Visual Evidence</p>
                                <p className="text-slate-400 text-sm leading-relaxed">{analysis!.details}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 text-slate-500">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                            </div>
                            <span className="text-sm">
                              {analysis?.details
                                ? `Analysis error: ${analysis.details.slice(0, 120)}`
                                : "AI analysis unavailable  check Gemini API configuration."}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Upload another */}
                <button
                  onClick={() => { setUploadState({ phase: "idle" }); setRejected([]); }}
                  className="w-full py-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 text-slate-300 font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload another image
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS for scanning animation */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </main>
  );
}
