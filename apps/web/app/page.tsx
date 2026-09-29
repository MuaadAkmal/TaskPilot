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
import { Users, Layers, BookOpen, Clock } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const rawProject = searchParams.get("project") as ProjectCode;
  // Support CMS and legacy CMS_VAL_FS interchangeably
  const currentProject: ProjectCode = (rawProject === "CMS_VAL_FS" ? "CMS" : rawProject) || "CMS";

  const [activeTab, setActiveTab] = useState<"workspace" | "team" | "documents">("workspace");
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

  // CMS, TSOC, and MCX have active forms & tables enabled
  const hasActiveTable =
    currentProject === "CMS" ||
    (currentProject as string) === "CMS_VAL_FS" ||
    currentProject === "TSOC" ||
    currentProject === "MCX";

  const fetchTasks = useCallback(async () => {
    if (!hasActiveTable) return;
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
  }, [currentProject, hasActiveTable, page, search, tsp, lsa, startDate, endDate, sort]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const activeProjectMeta =
    PROJECTS.find((p) => p.code === currentProject) ||
    PROJECTS.find((p) => p.code === "CMS") ||
    PROJECTS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] transition-colors">
      <Header currentProject={currentProject} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Page Header & Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">
                Workspace
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              {activeProjectMeta.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeProjectMeta.description}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "workspace"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{hasActiveTable ? "Resolutions & Table" : "Overview"}</span>
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

        {/* Tab 1: Primary Workspace Area */}
        {activeTab === "workspace" && (
          <>
            {hasActiveTable ? (
              <>
                {/* Active form + paginated resolution table for CMS, TSOC & MCX */}
                <ResolutionForm project={currentProject} onRecordCreated={fetchTasks} />
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
            ) : (
              /* Other modules (CDR, IPDR, CIAS, ASR): Clean placeholder awaiting custom schema discussion */
              <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeProjectMeta.name} Module Workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  The custom operational data structure and workflows for <strong>{activeProjectMeta.name}</strong> will be configured during the next phase.
                </p>

                <div className="mt-5 flex items-center justify-center space-x-3">
                  <button
                    onClick={() => setActiveTab("team")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View Assigned Engineers</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("documents")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Docs & Runbooks</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Assigned Team Members */}
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
