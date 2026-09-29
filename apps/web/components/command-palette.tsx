"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  Plus,
  FolderKanban,
  Activity,
  BarChart3,
  Bot,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { PROJECTS, ProjectCode } from "@/lib/project-config";
import { useTheme } from "next-themes";

interface CommandPaletteProps {
  currentProject: ProjectCode;
  onOpenNewEntry?: () => void;
}

export function CommandPalette({ currentProject, onOpenNewEntry }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (action: () => void) => {
    setIsOpen(false);
    setQuery("");
    action();
  };

  const filteredProjects = PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, project, or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          {(!query || "new incident create add resolution".includes(query.toLowerCase())) && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <button
                onClick={() =>
                  handleSelect(() => {
                    if (onOpenNewEntry) onOpenNewEntry();
                    else router.push(`/?project=${currentProject}#new-entry`);
                  })
                }
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition group text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      New Incident Entry
                    </div>
                    <div className="text-[10px] text-slate-400">Log a new resolution in {currentProject}</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition" />
              </button>
            </div>
          )}

          {/* Navigation Views */}
          {(!query || "today activity analytics agent copilot dashboard".includes(query.toLowerCase())) && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Views & Dashboards
              </div>
              <button
                onClick={() => handleSelect(() => router.push("/activity"))}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <span>Today's Cross-Project Activity</span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded-full">
                        LIVE
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">Central real-time timeline across all 7 projects</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleSelect(() => router.push(`/stats?project=${currentProject}`))}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Analytics & Performance Insights
                    </div>
                    <div className="text-[10px] text-slate-400">Charts, downtime trends, and circle breakdowns</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleSelect(() => router.push(`/agent?project=${currentProject}`))}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      AI Troubleshooting Copilot
                    </div>
                    <div className="text-[10px] text-slate-400">Query documentation, SOPs, and similar past incidents</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}

          {/* Switch Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Project ({filteredProjects.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {filteredProjects.map((proj) => (
                  <button
                    key={proj.code}
                    onClick={() => handleSelect(() => router.push(`/?project=${proj.code}`))}
                    className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition text-left ${
                      proj.code === currentProject
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FolderKanban className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 ml-2">{proj.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme Switcher */}
          {(!query || "theme dark light mode".includes(query.toLowerCase())) && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Theme Preferences
              </div>
              <div className="flex items-center space-x-1.5 px-2">
                <button
                  onClick={() => handleSelect(() => setTheme("light"))}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => handleSelect(() => setTheme("dark"))}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => handleSelect(() => setTheme("system"))}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>System</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Press</span>
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
              ↑
            </kbd>
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
              ↓
            </kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Command className="w-3 h-3 text-slate-400" />
            <span>TaskPilot Quick Command</span>
          </div>
        </div>
      </div>
    </div>
  );
}
