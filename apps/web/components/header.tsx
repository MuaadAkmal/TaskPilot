"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import {
  FolderKanban,
  Bot,
  Database,
  Bell,
  CheckCircle2,
  BellOff,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  currentProject: ProjectCode;
}

export function Header({ currentProject }: HeaderProps) {
  const searchParams = useSearchParams();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [emailAlertsOptIn, setEmailAlertsOptIn] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>("engineer@taskpilot.io");
  const [userTitle, setUserTitle] = useState<string>("Senior Operations Engineer");

  const activeProject = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];

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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left Section: Minimal Brand & Project Switcher */}
        <div className="flex items-center space-x-5">
          <Link href={`/?project=${currentProject}`} className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm transition group-hover:bg-indigo-600">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              TaskPilot
            </span>
          </Link>

          {/* Clean Minimal Project Selector */}
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex items-center space-x-2 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="font-semibold text-slate-900">{activeProject.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {projectMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-200/80 rounded-xl shadow-card py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                {PROJECTS.map((proj) => (
                  <Link
                    key={proj.code}
                    href={`/?project=${proj.code}`}
                    onClick={() => setProjectMenuOpen(false)}
                    className={`block px-3 py-2 text-xs transition ${
                      proj.code === currentProject ? "bg-slate-50 text-indigo-600 font-semibold" : "text-slate-600 hover:bg-slate-50"
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
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-900 bg-slate-100/80 transition"
          >
            Dashboard
          </Link>
          <Link
            href={`/agent?project=${currentProject}`}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Agent Studio</span>
          </Link>
        </nav>

        {/* Right Section: Clean Notification Tick & Profile */}
        <div className="flex items-center space-x-2.5">
          {/* Notification Opt-In Checkbox Button */}
          <button
            onClick={toggleEmailOptIn}
            title={emailAlertsOptIn ? "Email alerts active (Click to opt out)" : "Email alerts disabled (Click to receive)"}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              emailAlertsOptIn
                ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                : "bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300"
            }`}
          >
            {emailAlertsOptIn ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Alerts ON</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Alerts OFF</span>
              </>
            )}
          </button>

          {/* Profile Avatar */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition"
            >
              {userEmail.slice(0, 2).toUpperCase()}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/80 rounded-xl shadow-card p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="pb-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{userEmail}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userTitle}</p>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Email Notifications</span>
                  <input
                    type="checkbox"
                    checked={emailAlertsOptIn}
                    onChange={toggleEmailOptIn}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  Role: <span className="font-semibold text-slate-700">Operations Engineer</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
