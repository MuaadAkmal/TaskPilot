"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ResolutionForm } from "@/components/resolution-form";
import { ResolutionTable } from "@/components/resolution-table";
import { ProjectTeamView } from "@/components/project-team-view";
import { ProjectDocumentsView } from "@/components/project-documents-view";
import { CopilotDrawer } from "@/components/copilot-drawer";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { MockTask } from "@/lib/store";
import { RotateCw, FileCode, Users, Layers, BookOpen } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const currentProject = (searchParams.get("project") as ProjectCode) || "CMS_VAL_FS";

  const [activeTab, setActiveTab] = useState<"resolutions" | "team" | "documents">("resolutions");
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

  // For other projects (CIAS, ASR), show placeholder state for the form per user request:
  // "the form for other projects are acompltly different , so leave it empty for now"
  const isCmsValFs = currentProject === "CMS_VAL_FS";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] transition-colors">
      <Header currentProject={currentProject} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Minimal Page Header & Tab Navigation */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {activeProjectMeta.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeProjectMeta.description}
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("resolutions")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "resolutions"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Resolutions</span>
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "team"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assigned Team</span>
            </button>

            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "documents"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs & Links</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Resolutions & Incidents */}
        {activeTab === "resolutions" && (
          <>
            {/* Show Form only for CMS_VAL_FS; for other projects (CIAS, ASR), leave form empty/placeholder */}
            {isCmsValFs ? (
              <ResolutionForm project={currentProject} onRecordCreated={fetchTasks} />
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-center mb-6">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Custom entry form for <strong>{activeProjectMeta.name}</strong> will be configured to match project schema.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  View recorded incidents, assigned team members, or project documentation using the tabs above.
                </p>
              </div>
            )}

            {/* Table */}
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
          </>
        )}

        {/* Tab 2: Assigned Team Members for Module */}
        {activeTab === "team" && <ProjectTeamView project={currentProject} />}

        {/* Tab 3: Documentation & Links */}
        {activeTab === "documents" && <ProjectDocumentsView project={currentProject} />}
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
