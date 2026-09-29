"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ResolutionForm } from "@/components/resolution-form";
import { ResolutionTable } from "@/components/resolution-table";
import { CopilotDrawer } from "@/components/copilot-drawer";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { MockTask } from "@/lib/store";
import { Sparkles, Layers, RefreshCw } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const currentProject = (searchParams.get("project") as ProjectCode) || "CMS_VAL_FS";

  const [tasks, setTasks] = useState<MockTask[]>([]);
  const [allTasks, setAllTasks] = useState<MockTask[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [tsp, setTsp] = useState<string>("ALL");
  const [lsa, setLsa] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sort, setSort] = useState<string>("resolvedAt_desc");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        project: currentProject,
        page: page.toString(),
        pageSize: "8",
        search,
        tsp,
        lsa,
        startDate,
        endDate,
        sort,
      });

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setTasks(data.tasks || []);
        setAllTasks(data.allMatchingTasks || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProject, page, search, tsp, lsa, startDate, endDate, sort]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const activeProjectMeta = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header currentProject={currentProject} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Project Breadcrumb & Quick Stats */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                Workspace / {activeProjectMeta.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Incident & Task Resolutions
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{activeProjectMeta.description}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700">{total} Total Resolved</span>
            </div>
            <button
              onClick={fetchTasks}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition shadow-xs"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* 1. Inline Form (Top of Table) */}
        <ResolutionForm project={currentProject} onRecordCreated={fetchTasks} />

        {/* 2. Interactive Paginated Table (8 entries per page) */}
        <ResolutionTable
          tasks={tasks}
          allTasks={allTasks}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRefresh={fetchTasks}
          search={search}
          setSearch={setSearch}
          tsp={tsp}
          setTsp={setTsp}
          lsa={lsa}
          setLsa={setLsa}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          sort={sort}
          setSort={setSort}
        />
      </main>

      {/* Floating Copilot Drawer */}
      <CopilotDrawer project={currentProject} onRefreshTasks={fetchTasks} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading TaskPilot...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
