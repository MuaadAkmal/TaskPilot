"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const isPlaceholder = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

  if (isPlaceholder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">TaskPilot Authentication</h2>
          <p className="text-xs text-slate-600 mb-6">
            Clerk is in Development / Local mode. To enable live login, add your <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to <code>apps/web/.env</code>.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow hover:bg-indigo-700 transition"
          >
            Enter TaskPilot Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <SignIn routing="hash" />
    </div>
  );
}
