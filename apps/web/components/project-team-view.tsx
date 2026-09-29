"use client";

import React, { useState, useEffect } from "react";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { Users, Mail, ShieldCheck, UserCheck, Bell, BellOff, Sparkles } from "lucide-react";

interface ProjectTeamViewProps {
  project: ProjectCode;
}

export function ProjectTeamView({ project }: ProjectTeamViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const activeProjectMeta = PROJECTS.find((p) => p.code === project) || PROJECTS[0];

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?project=${project}`);
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to load project team:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [project]);

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Active Team Members — {activeProjectMeta.name}
            </h2>
            <p className="text-[11px] text-slate-400">
              Engineers & Leads assigned to {activeProjectMeta.name} triage and resolution
            </p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {users.length} Assigned Engineers
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading team directory...</div>
      ) : users.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No engineers explicitly assigned to {activeProjectMeta.name} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {users.map((u) => {
            const initials = (u.name || u.email || "UN")
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={u.id || u.email}
                className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start space-x-3 hover:border-slate-200 dark:hover:border-slate-700 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {u.name || u.email.split("@")[0]}
                    </p>
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                      {u.role || "ENGINEER"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {u.title || "Operations Specialist"}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 truncate max-w-[130px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{u.email}</span>
                    </span>

                    {u.receiveEmailAlerts ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5" title="Subscribed to team email notifications">
                        <Bell className="w-3 h-3" />
                        <span>Alerts</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center space-x-0.5" title="Opted out from broadcast alerts">
                        <BellOff className="w-3 h-3" />
                        <span>Opted out</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
