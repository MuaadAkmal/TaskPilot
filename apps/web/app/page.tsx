"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ResolutionForm } from "@/components/resolution-form";
import { ResolutionTable } from "@/components/resolution-table";
import { CopilotDrawer } from "@/components/copilot-drawer";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { MockTask } from "@/lib/store";
import { RotateCw } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header currentProject={currentProject} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Minimal Page Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              {activeProjectMeta.name} Resolutions
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeProjectMeta.description}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400">
              {total} entries
            </span>
            <button
              onClick={fetchTasks}
              className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition"
              title="Refresh"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 1. Minimal Collapsible Form */}
        <ResolutionForm project={currentProject} onRecordCreated={fetchTasks} />

        {/* 2. Minimal Resolution Table (8 items/page) */}
        <ResolutionTable
          currentProject={currentProject}
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
