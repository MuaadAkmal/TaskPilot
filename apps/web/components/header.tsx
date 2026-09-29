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
  User as UserIcon,
  ChevronDown,
  Layers,
  Settings,
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

  // Fetch user preference on mount
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
        // Fallback to true
      }
    }
    loadUser();
  }, [userEmail]);

  // Toggle Email Alerts preference
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
          toast.success("Subscribed to Team Email Alerts", {
            description: "You will receive email notifications when new incident resolutions are logged.",
          });
        } else {
          toast.info("Opted out of Email Alerts", {
            description: "You will no longer receive broadcast emails for newly logged incidents.",
          });
        }
      }
    } catch (err) {
      toast.error("Failed to update notification preferences.");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Logo & Project Switcher Dropdown */}
        <div className="flex items-center space-x-6">
          <Link href={`/?project=${currentProject}`} className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
                TaskPilot
              </span>
              <span className="block text-[10px] font-semibold text-indigo-600 uppercase tracking-widest -mt-1">
                Ops Platform
              </span>
            </div>
          </Link>

          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span className="text-slate-800 font-bold">{activeProject.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {projectMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Active Workspace
                </div>
                {PROJECTS.map((proj) => (
                  <Link
                    key={proj.code}
                    href={`/?project=${proj.code}`}
                    onClick={() => setProjectMenuOpen(false)}
                    className={`block px-3.5 py-2.5 text-xs hover:bg-slate-50 transition ${
                      proj.code === currentProject ? "bg-indigo-50/60 font-bold text-indigo-700" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{proj.name}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {proj.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">{proj.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href={`/?project=${currentProject}`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Resolutions</span>
          </Link>
          <Link
            href={`/agent?project=${currentProject}`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition flex items-center space-x-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Agent Studio</span>
          </Link>
        </nav>

        {/* Right Section: Notification Tick Mark, DB status & Profile Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Email Notification Opt-In / Opt-Out Tick Mark */}
          <button
            onClick={toggleEmailOptIn}
            title={emailAlertsOptIn ? "Email alerts enabled (Click to opt out)" : "Email alerts disabled (Click to receive)"}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              emailAlertsOptIn
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {emailAlertsOptIn ? (
              <>
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Alerts: Active</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Alerts: Opted Out</span>
              </>
            )}
          </button>

          {/* Database Sync Status */}
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            <Database className="w-3 h-3 text-indigo-600" />
            <span>SQLite Active</span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {userEmail.slice(0, 2).toUpperCase()}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {userEmail.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">{userEmail}</p>
                    <p className="text-[10px] text-slate-500 truncate">{userTitle}</p>
                  </div>
                </div>

                <div className="py-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Team Email Alerts</span>
                    <button
                      onClick={toggleEmailOptIn}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        emailAlertsOptIn ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          emailAlertsOptIn ? "translate-x-4.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    When checked, you will receive email notifications whenever a resolution is recorded for your assigned projects.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Role: <span className="font-bold text-slate-800">Engineer / NOC Lead</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
