"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { CommandPalette } from "@/components/command-palette";
import { PROJECTS, ProjectCode } from "@/lib/project-config";
import { MockTask } from "@/lib/store";
import { formatDateDDMMYYYY } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function ActivityPage() {
  const [tasks, setTasks] = useState<MockTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTodayActivity = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all projects data for today
      const res = await fetch(`/api/tasks?pageSize=500&startDate=${today.toISOString()}`);
      const data = await res.json();
      
      let allTasks: MockTask[] = data.allMatchingTasks || data.tasks || [];

      // If no tasks created today yet, fetch recent 150 tasks so user can inspect live stream
      if (allTasks.length === 0) {
        const fallbackRes = await fetch(`/api/tasks?pageSize=150&sort=resolvedAt_desc`);
        const fallbackData = await fallbackRes.json();
        allTasks = fallbackData.allMatchingTasks || fallbackData.tasks || [];
      }

      setTasks(allTasks);
    } catch (err) {
      toast.error("Failed to load today's activity stream.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayActivity();
  }, []);

  // Filter tasks based on selected project, status, and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchProject = selectedProject === "ALL" || t.project === selectedProject || (selectedProject === "CMS" && t.project === ("CMS_VAL_FS" as any));
      const matchStatus = selectedStatus === "ALL" || t.status === selectedStatus;
      const matchSearch =
        !searchQuery ||
        t.problemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tsp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.lsa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.createdByName && t.createdByName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.raisedByName && t.raisedByName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchProject && matchStatus && matchSearch;
    });
  }, [tasks, selectedProject, selectedStatus, searchQuery]);

  // Aggregate stats
  const totalCount = tasks.length;
  const resolvedCount = tasks.filter((t) => t.status === "RESOLVED").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;

  // Unique contributors / operators
  const activeContributors = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      const name = t.createdByName || t.raisedByName || "NOC Operator";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  // Project breakdown
  const projectStats = useMemo(() => {
    return PROJECTS.map((proj) => {
      const count = tasks.filter((t) =>
        proj.code === "CMS" ? t.project === "CMS" || t.project === ("CMS_VAL_FS" as any) : t.project === proj.code
      ).length;
      return {
        ...proj,
        count,
      };
    });
  }, [tasks]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Resolved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 mr-1 animate-pulse" />
            In Progress
          </span>
        );
      case "PENDING":
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Header currentProject={"CMS"} />
      <CommandPalette currentProject={"CMS"} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Today's Cross-Project Activity
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>LIVE FEED</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Centralized real-time operational stream tracking all entries, status updates, and logged operators across all 7 projects.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchTodayActivity}
              className="px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition flex items-center space-x-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
              <span>Refresh Activity</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Recorded Today
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center">
              <span>Across 7 telecom & security projects</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Resolved Incidents</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">
              {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% resolution efficiency
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active In Progress</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{inProgressCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Under investigation by shift leads</div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Operators</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {activeContributors.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Contributing to today's logs</div>
          </div>
        </div>

        {/* Project Snapshot Cards Grid */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Project Health Breakdown
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {projectStats.map((proj) => (
              <button
                key={proj.code}
                onClick={() => setSelectedProject(selectedProject === proj.code ? "ALL" : proj.code)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedProject === proj.code
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-card text-slate-900 dark:text-slate-100"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">{proj.name}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm ${
                      selectedProject === proj.code
                        ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {proj.badge}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-bold">{proj.count}</span>
                  <span className="text-[10px] opacity-70">entries</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stream Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problem, TSP, circle, or operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">All Projects ({tasks.length})</option>
              {PROJECTS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="RESOLVED">Resolved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {/* Live Timeline Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Activity Stream
              </span>
              <span className="text-xs text-slate-400">({filteredTasks.length} events)</span>
            </div>
            <span className="text-[11px] text-slate-400">Sorted by most recent</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No activity matching current filters
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Try clearing your search query or changing filters.</p>
              </div>
            ) : (
              filteredTasks.map((item) => {
                const projectMeta = PROJECTS.find((p) => p.code === item.project) || PROJECTS[0];
                const resolvedDate = item.resolvedAt ? new Date(item.resolvedAt) : new Date(item.createdAt);
                const timeString = resolvedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateString = formatDateDDMMYYYY(resolvedDate);

                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Time / Project Badge */}
                      <div className="shrink-0 flex flex-col items-center">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {timeString}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{dateString}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                            {projectMeta.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {item.tsp}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">{item.lsa}</span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{item.id}</span>
                        </div>

                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                          {item.problemDescription}
                        </p>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Solution: </span>
                          {item.solution}
                        </div>

                        {/* User / Operator Tracking Attribution */}
                        <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-400">
                          <span className="flex items-center space-x-1">
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              Logged by: {item.createdByName || item.raisedByName || "NOC Operator"}
                            </span>
                            {item.createdByEmail && (
                              <span className="text-slate-400">({item.createdByEmail})</span>
                            )}
                          </span>
                          {item.downtimeMinutes ? (
                            <>
                              <span>•</span>
                              <span>Downtime: {item.downtimeMinutes}m</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge & direct link to project */}
                    <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-start gap-2">
                      {getStatusBadge(item.status)}
                      <Link
                        href={`/?project=${item.project}`}
                        className="opacity-0 group-hover:opacity-100 transition text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center space-x-1 hover:underline"
                      >
                        <span>Open in {projectMeta.badge}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
