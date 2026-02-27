"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Welcome to SportVision AI</h1>

      {session ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg">Signed in as {session.user?.email}</p>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => signOut()}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      )}
    </main>
  );
}