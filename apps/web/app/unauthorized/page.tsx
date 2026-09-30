"use client";

import React from "react";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "your account";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          The email <strong className="text-slate-200">{email}</strong> is authenticated, but is not present in the internal <strong className="text-slate-200">Employee Directory Database</strong>.
        </p>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 mb-6 text-left text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">What to do:</p>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            <li>Contact your administrator to add your email to the database.</li>
            <li>Or sign in with an authorized employee email address.</li>
          </ul>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <SignOutButton redirectUrl="/sign-in">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
