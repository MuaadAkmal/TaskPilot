"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { ThemeToggle } from "./theme-toggle";
import {
  UserButton,
  SignInButton,
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/nextjs";
import {
  FolderKanban,
  CheckCircle2,
  BellOff,
  ChevronDown,
  Sparkles,
  BarChart3,
  Layers,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  currentProject: ProjectCode;
}

export function Header({ currentProject }: HeaderProps) {
  const pathname = usePathname();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [emailAlertsOptIn, setEmailAlertsOptIn] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>("engineer@taskpilot.io");
  const [userTitle, setUserTitle] = useState<string>("Senior Operations Engineer");

  const activeProject = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];

  useEffect(() => {
    if (clerkUser) {
      const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
      if (primaryEmail) setUserEmail(primaryEmail);
      if (clerkUser.fullName) setUserTitle(clerkUser.fullName);
    }
  }, [clerkUser]);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`/api/users?email=${userEmail}`);
        const data = await res.json();
        if (data.user) {
          setEmailAlertsOptIn(data.user.receiveEmailAlerts);
          if (data.user.title) setUserTitle(data.user.title);
        }
      } catch (err) {
        // Fallback
      }
    }
    loadUser();
  }, [userEmail]);

  const toggleEmailOptIn = async () => {
    const nextVal = !emailAlertsOptIn;
    setEmailAlertsOptIn(nextVal);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: "Current Engineer",
          title: userTitle,
          receiveEmailAlerts: nextVal,
          projects: ["CMS_VAL_FS", "ASR", "CIAS"],
        }),
      });

      if (res.ok) {
        if (nextVal) {
          toast.success("Subscribed to Team Email Alerts");
        } else {
          toast.info("Opted out of Email Alerts");
        }
      }
    } catch (err) {
      toast.error("Failed to update notification preferences.");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left Section: Minimal Brand & Project Switcher */}
        <div className="flex items-center space-x-5">
          <Link href={`/?project=${currentProject}`} className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center text-white shadow-sm transition group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              TaskPilot
            </span>
          </Link>

          {/* Clean Minimal Project Selector */}
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex items-center space-x-2 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{activeProject.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {projectMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                {PROJECTS.map((proj) => (
                  <Link
                    key={proj.code}
                    href={`${pathname}?project=${proj.code}`}
                    onClick={() => setProjectMenuOpen(false)}
                    className={`block px-3 py-2 text-xs transition ${
                      proj.code === currentProject
                        ? "bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{proj.name}</span>
                      <span className="text-[10px] text-slate-400">{proj.badge}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href={`/?project=${currentProject}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              pathname === "/"
                ? "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/activity"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 ${
              pathname === "/activity"
                ? "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Today's Activity</span>
          </Link>
          <Link
            href={`/stats?project=${currentProject}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 ${
              pathname === "/stats"
                ? "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Analytics</span>
          </Link>
          <Link
            href={`/agent?project=${currentProject}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 ${
              pathname === "/agent"
                ? "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Agent Studio</span>
          </Link>
        </nav>

        {/* Right Section: Notification Tick, Theme Toggle & Profile */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Command Trigger */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs"
            title="Global Command Palette (Cmd + K / Ctrl + K)"
          >
            <span className="text-[11px]">Search</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>
          {/* Notification Opt-In Checkbox Button */}
          <button
            onClick={toggleEmailOptIn}
            title={emailAlertsOptIn ? "Email alerts active (Click to opt out)" : "Email alerts disabled (Click to receive)"}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              emailAlertsOptIn
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 hover:bg-slate-800"
                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-600 hover:border-slate-300"
            }`}
          >
            {emailAlertsOptIn ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span className="text-[11px]">Alerts ON</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Alerts OFF</span>
              </>
            )}
          </button>

          {/* Dark Mode Switcher */}
          <ThemeToggle />

          {/* Authentication & Profile */}
          <SignedIn>
            <div className="flex items-center space-x-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-lg",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition">
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
