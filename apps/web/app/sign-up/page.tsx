"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const isPlaceholder = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

  if (isPlaceholder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">TaskPilot Registration</h2>
          <p className="text-xs text-slate-600 mb-6">
            Clerk is in Development / Local mode. To enable live registration, add your Clerk credentials to <code>apps/web/.env</code>.
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
      <SignUp routing="hash" />
    </div>
  );
}
