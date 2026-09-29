"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { CommandPalette } from "@/components/command-palette";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { MockTask } from "@/lib/store";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function StatsContent() {
  const searchParams = useSearchParams();
  const currentProject = (searchParams.get("project") as ProjectCode) || "CIAS";

  const [tasks, setTasks] = useState<MockTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAllTasks() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks?project=${currentProject}&pageSize=500`);
        const data = await res.json();
        if (data.allMatchingTasks) {
          setTasks(data.allMatchingTasks);
        } else if (data.tasks) {
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error("Failed to fetch stats tasks:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllTasks();
  }, [currentProject]);

  const activeProjectMeta = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[2];

  // 1. Status Metrics Breakdown
  const stats = useMemo(() => {
    const total = tasks.length;
    const resolved = tasks.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const pending = tasks.filter((t) => t.status === "PENDING_VERIFICATION").length;
    const unresolved = total - resolved;
    const totalDowntime = tasks.reduce((acc, t) => acc + (t.downtimeMinutes || 0), 0);
    const avgDowntime = total > 0 ? Math.round(totalDowntime / total) : 0;

    return { total, resolved, inProgress, pending, unresolved, totalDowntime, avgDowntime };
  }, [tasks]);

  // 2. TSP / Module Breakdown
  const tspChartData = useMemo(() => {
    const counts: Record<string, { total: number; resolved: number; inProgress: number }> = {};
    tasks.forEach((t) => {
      const key = t.tsp || "Other";
      if (!counts[key]) counts[key] = { total: 0, resolved: 0, inProgress: 0 };
      counts[key].total += 1;
      if (t.status === "RESOLVED" || t.status === "CLOSED") counts[key].resolved += 1;
      if (t.status === "IN_PROGRESS") counts[key].inProgress += 1;
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      total: data.total,
      resolved: data.resolved,
      inProgress: data.inProgress,
    }));
  }, [tasks]);

  // 3. LSA / Scope Breakdown
  const lsaChartData = useMemo(() => {
    const counts: Record<string, { total: number; resolved: number; inProgress: number }> = {};
    tasks.forEach((t) => {
      const key = t.lsa || "Other";
      if (!counts[key]) counts[key] = { total: 0, resolved: 0, inProgress: 0 };
      counts[key].total += 1;
      if (t.status === "RESOLVED" || t.status === "CLOSED") counts[key].resolved += 1;
      if (t.status === "IN_PROGRESS") counts[key].inProgress += 1;
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      total: data.total,
      resolved: data.resolved,
      inProgress: data.inProgress,
    }));
  }, [tasks]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] transition-colors">
      <Header currentProject={currentProject} />
      <CommandPalette currentProject={currentProject} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Minimal Page Title */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">
                {activeProjectMeta.badge} Analytics
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              {activeProjectMeta.name} Incident Statistics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-level overview of incident resolution volume, module breakdown, and regional scope metrics.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {stats.total} total recorded issues
            </span>
          </div>
        </div>

        {/* 1. Metric Counter KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          {/* Resolved */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-4">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Resolved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.resolved}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate
            </p>
          </div>

          {/* In Progress */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-4">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.inProgress}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active operational triage
            </p>
          </div>

          {/* Pending Verification / Unresolved */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-4">
            <div className="flex items-center justify-between text-amber-500 dark:text-amber-400 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unresolved / Pending</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.unresolved}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.pending} pending verification
            </p>
          </div>
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Status Breakdown Bar Chart */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {activeProjectMeta.fields.primaryFieldLabel} Distribution
                </h2>
                <p className="text-[11px] text-slate-400">Incident volume grouped by category / module</p>
              </div>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              {tspChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No records to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tspChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Regional / LSA Scope Pie Chart */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {activeProjectMeta.fields.secondaryFieldLabel} Scope Breakdown
                </h2>
                <p className="text-[11px] text-slate-400">Incidents mapped by environment / regional node</p>
              </div>
              <PieIcon className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              {lsaChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No records to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lsaChartData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {lsaChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* 3. Detailed Breakdown Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TSP Wise Table */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {activeProjectMeta.fields.primaryFieldLabel} Wise Table
              </span>
              <span className="text-[11px] text-slate-400">{tspChartData.length} Categories</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3.5">Category</th>
                  <th className="py-2 px-3 text-center">Total</th>
                  <th className="py-2 px-3 text-center">Resolved</th>
                  <th className="py-2 px-3 text-center">In Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tspChartData.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3.5 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">{item.total}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{item.resolved}</td>
                    <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400 font-semibold">{item.inProgress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LSA Wise Table */}
          <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {activeProjectMeta.fields.secondaryFieldLabel} Wise Table
              </span>
              <span className="text-[11px] text-slate-400">{lsaChartData.length} Locations</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3.5">Location / Scope</th>
                  <th className="py-2 px-3 text-center">Total</th>
                  <th className="py-2 px-3 text-center">Resolved</th>
                  <th className="py-2 px-3 text-center">In Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lsaChartData.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3.5 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">{item.total}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{item.resolved}</td>
                    <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400 font-semibold">{item.inProgress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Stats...</div>}>
      <StatsContent />
    </Suspense>
  );
}
