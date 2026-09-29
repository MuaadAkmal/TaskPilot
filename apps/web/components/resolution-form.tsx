"use client";

import React, { useState, useEffect } from "react";
import { ProjectCode, PROJECTS, STATUS_OPTIONS, LEA_RAISED_BY_OPTIONS } from "@/lib/project-config";
import { Plus, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ResolutionFormProps {
  project: ProjectCode;
  onRecordCreated: () => void;
}

export function ResolutionForm({ project, onRecordCreated }: ResolutionFormProps) {
  const activeProjectMeta = PROJECTS.find((p) => p.code === project) || PROJECTS[0];

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [primaryFieldVal, setPrimaryFieldVal] = useState<string>(activeProjectMeta.fields.primaryOptions[0]);
  const [secondaryFieldVal, setSecondaryFieldVal] = useState<string>(activeProjectMeta.fields.secondaryOptions[0]);
  const [status, setStatus] = useState<string>("RESOLVED");
  const [raisedByName, setRaisedByName] = useState<string>(LEA_RAISED_BY_OPTIONS[0]);
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [solution, setSolution] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [resolvedAt, setResolvedAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setPrimaryFieldVal(activeProjectMeta.fields.primaryOptions[0]);
    setSecondaryFieldVal(activeProjectMeta.fields.secondaryOptions[0]);
  }, [project, activeProjectMeta]);

  useEffect(() => {
    const now = new Date();
    const past45m = new Date(now.getTime() - 45 * 60 * 1000);
    setResolvedAt(formatDateForInput(now));
    setCreatedAt(formatDateForInput(past45m));
  }, []);

  function formatDateForInput(date: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setProblemDescription("");
    setSolution("");
    setRemarks("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!problemDescription.trim() || !solution.trim()) {
      toast.error("Please provide both problem description and solution.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          tsp: primaryFieldVal,
          lsa: secondaryFieldVal,
          status,
          raisedByName,
          problemDescription,
          solution,
          remarks,
          createdAt,
          resolvedAt,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Logged Incident #${data.task.id}`);
        handleReset();
        onRecordCreated();
      } else {
        toast.error(data.error || "Failed to record resolution.");
      }
    } catch (err) {
      toast.error("Network error when submitting record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card mb-6 transition-all overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Minimal Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            New Resolution Entry
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            ({activeProjectMeta.name})
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            <span>Ctrl + Enter</span>
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {activeProjectMeta.fields.primaryFieldLabel}
              </label>
              <select
                value={primaryFieldVal}
                onChange={(e) => setPrimaryFieldVal(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
              >
                {activeProjectMeta.fields.primaryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {activeProjectMeta.fields.secondaryFieldLabel}
              </label>
              <select
                value={secondaryFieldVal}
                onChange={(e) => setSecondaryFieldVal(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
              >
                {activeProjectMeta.fields.secondaryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Request Raised By (LEA)
              </label>
              <select
                value={raisedByName}
                onChange={(e) => setRaisedByName(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
              >
                {LEA_RAISED_BY_OPTIONS.map((lea) => (
                  <option key={lea} value={lea}>
                    {lea}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Solution Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Problem Description & Symptoms
              </label>
              <textarea
                rows={2}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Observed alarms, error logs, or symptoms..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Verified Solution Applied
              </label>
              <textarea
                rows={2}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Exact commands executed or fix implemented..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-mono"
                required
              />
            </div>
          </div>

          {/* Remarks & Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks / Follow-up notes (optional)..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-slate-900 font-medium text-xs px-4 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
              >
                <span>{isSubmitting ? "Saving..." : "Log Resolution"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
