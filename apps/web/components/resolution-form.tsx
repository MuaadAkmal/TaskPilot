"use client";

import React, { useState, useEffect } from "react";
import { ProjectCode, PROJECTS, STATUS_OPTIONS } from "@/lib/project-config";
import { PlusCircle, CornerDownLeft, Sparkles, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ResolutionFormProps {
  project: ProjectCode;
  onRecordCreated: () => void;
}

export function ResolutionForm({ project, onRecordCreated }: ResolutionFormProps) {
  const activeProjectMeta = PROJECTS.find((p) => p.code === project) || PROJECTS[0];

  const [primaryFieldVal, setPrimaryFieldVal] = useState<string>(activeProjectMeta.fields.primaryOptions[0]);
  const [secondaryFieldVal, setSecondaryFieldVal] = useState<string>(activeProjectMeta.fields.secondaryOptions[0]);
  const [status, setStatus] = useState<string>("RESOLVED");
  const [raisedByName, setRaisedByName] = useState<string>("Sarah Jenkins (NOC)");
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [solution, setSolution] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [resolvedAt, setResolvedAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync default options when project changes
  useEffect(() => {
    setPrimaryFieldVal(activeProjectMeta.fields.primaryOptions[0]);
    setSecondaryFieldVal(activeProjectMeta.fields.secondaryOptions[0]);
  }, [project, activeProjectMeta]);

  // Set default timestamps
  useEffect(() => {
    const now = new Date();
    const pastOneHour = new Date(now.getTime() - 45 * 60 * 1000);
    setResolvedAt(formatDateForInput(now));
    setCreatedAt(formatDateForInput(pastOneHour));
  }, []);

  function formatDateForInput(date: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Handle Ctrl + Enter / Cmd + Enter shortcut
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
      toast.error("Please fill in both Problem Description and Solution Applied.");
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
        toast.success(`Resolution recorded successfully (Ticket #${data.task.id})`, {
          description: `Dispatched notification for ${activeProjectMeta.name}.`,
        });
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6" onKeyDown={handleKeyDown}>
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Record Resolved Task</span>
              <span className="text-[10px] font-normal px-2 py-0.2 bg-indigo-800/60 rounded text-indigo-200">
                {activeProjectMeta.name}
              </span>
            </h2>
            <p className="text-[10px] text-indigo-200/80">Log symptoms, verified fixes, and remarks for team reference</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-indigo-200 bg-indigo-900/50 px-2.5 py-1 rounded-lg border border-indigo-700/50">
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Press <strong className="text-white font-mono">Ctrl + Enter</strong> to Save</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Row 1: Dynamic Dropdowns based on active Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {activeProjectMeta.fields.primaryFieldLabel} *
            </label>
            <select
              value={primaryFieldVal}
              onChange={(e) => setPrimaryFieldVal(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {activeProjectMeta.fields.primaryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {activeProjectMeta.fields.secondaryFieldLabel} *
            </label>
            <select
              value={secondaryFieldVal}
              onChange={(e) => setSecondaryFieldVal(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {activeProjectMeta.fields.secondaryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resolution Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Raised By
            </label>
            <input
              type="text"
              value={raisedByName}
              onChange={(e) => setRaisedByName(e.target.value)}
              placeholder="e.g. Sarah Jenkins (NOC Lead)"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Row 2: Problem Description & Solution Applied */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Problem Description & Symptoms *
            </label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder={`Describe error codes, affected components in ${activeProjectMeta.name}, or alarms...`}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Solution Applied *</span>
            </label>
            <textarea
              rows={3}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Specify the exact commands executed, patch applied, or component reconfigured..."
              className="w-full text-xs bg-emerald-50/40 border border-emerald-300 rounded-xl p-3 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              required
            />
          </div>
        </div>

        {/* Row 3: Remarks and Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Remarks & Observations (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Replacement scheduled for next maintenance window"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Created / Incident Start At
            </label>
            <input
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resolved Timestamp
            </label>
            <input
              type="datetime-local"
              value={resolvedAt}
              onChange={(e) => setResolvedAt(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fields</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? "Saving & Notifying..." : "Submit Resolution Record"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
