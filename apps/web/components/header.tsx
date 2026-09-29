"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PROJECTS, ProjectCode } from "@/lib/project-config";
import { Plane, Bot, Table as TableIcon, Bell, ChevronDown, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  currentProject: ProjectCode;
}

export function Header({ currentProject }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeProject = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];

  const handleProjectChange = (code: ProjectCode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", code);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3 sticky top-0 z-40 flex items-center justify-between shadow-md">
      {/* Left: Brand + Project Selector */}
      <div className="flex items-center space-x-6">
        <Link href={`/?project=${currentProject}`} className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-500 transition">
            <Plane className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight flex items-center space-x-1.5">
              <span>TaskPilot</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-700/60 rounded">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Incident & Knowledge Copilot</p>
          </div>
        </Link>

        {/* Global Project Dropdown Selector */}
        <div className="relative group">
          <div className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 cursor-pointer transition">
            <span className="text-xs text-slate-400 font-medium">Project:</span>
            <span className="text-xs font-semibold text-white">{activeProject.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              Select Workspace Project
            </div>
            {PROJECTS.map((p) => (
              <button
                key={p.code}
                onClick={() => handleProjectChange(p.code)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition ${
                  p.code === currentProject ? "bg-indigo-950/60 text-indigo-300 font-semibold" : "text-slate-300"
                }`}
              >
                <div>
                  <div>{p.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{p.description}</div>
                </div>
                {p.code === currentProject && <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Navigation Links */}
      <nav className="flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-800">
        <Link
          href={`/?project=${currentProject}`}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            pathname === "/" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Resolution Records</span>
        </Link>
        <Link
          href={`/agent?project=${currentProject}`}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            pathname === "/agent" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Agent Studio</span>
        </Link>
      </nav>

      {/* Right: User Attribution / Live Sync */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 text-[11px]">Sync: Supabase</span>
        </div>

        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
            OP
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">Ops Engineer</div>
            <div className="text-[10px] text-slate-400">Team NOC Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
}
