"use client";

import React, { useState } from "react";
import { MockTask } from "@/lib/store";
import {
  STATUS_OPTIONS,
  CMS_LEA_RAISED_BY_OPTIONS,
  CMS_LSA_LIST,
  CMS_LSA_TSP_MAP,
  CMS_LSA_FULL_NAMES,
  PROJECTS,
} from "@/lib/project-config";
import { X, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ResolutionEditModalProps {
  task: MockTask;
  onClose: () => void;
  onSaved: () => void;
}

export function ResolutionEditModal({ task, onClose, onSaved }: ResolutionEditModalProps) {
  const activeProjectMeta = PROJECTS.find((p) => p.code === task.project) || PROJECTS[0];
  const raisedByList = activeProjectMeta.fields.raisedByOptions || CMS_LEA_RAISED_BY_OPTIONS;

  const isCMS = task.project === "CMS" || (task.project as string) === "CMS_VAL_FS";
  const isCdrOrIpdr = task.project === "CDR" || task.project === "IPDR";

  const [tsp, setTsp] = useState(task.tsp);
  const [lsa, setLsa] = useState(task.lsa);
  const [status, setStatus] = useState<MockTask["status"]>(task.status);
  const [raisedByName, setRaisedByName] = useState(task.raisedByName || raisedByList[0]);
  const [problemDescription, setProblemDescription] = useState(task.problemDescription);
  const [solution, setSolution] = useState(task.solution);
  const [remarks, setRemarks] = useState(task.remarks || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleLsaChange = (newLsa: string) => {
    setLsa(newLsa);
    if (isCMS || isCdrOrIpdr) {
      const availableTsps = CMS_LSA_TSP_MAP[newLsa] || [];
      if (!availableTsps.includes(tsp)) {
        setTsp(availableTsps[0] || "");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          tsp,
          lsa,
          status,
          raisedByName,
          problemDescription,
          solution,
          remarks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Updated Incident #${task.id}`);
        onSaved();
      } else {
        toast.error(data.error || "Failed to update record.");
      }
    } catch (err) {
      toast.error("Network error saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentTspOptions =
    isCMS || isCdrOrIpdr
      ? CMS_LSA_TSP_MAP[lsa] || ["AT", "BS", "RC", "RI", "VO", "TA"]
      : activeProjectMeta.fields.primaryOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-slate-400">#{task.id}</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Edit Resolution Record
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {isCMS || isCdrOrIpdr ? (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    LSA (Service Circle)
                  </label>
                  <select
                    value={lsa}
                    onChange={(e) => handleLsaChange(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-semibold"
                  >
                    {CMS_LSA_LIST.map((l) => (
                      <option key={l} value={l}>
                        {CMS_LSA_FULL_NAMES[l] || l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    TSP (Provider in {lsa})
                  </label>
                  <select
                    value={tsp}
                    onChange={(e) => setTsp(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-semibold"
                  >
                    {currentTspOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {activeProjectMeta.fields.primaryFieldLabel}
                  </label>
                  <select
                    value={tsp}
                    onChange={(e) => setTsp(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {activeProjectMeta.fields.primaryOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {activeProjectMeta.fields.secondaryFieldLabel}
                  </label>
                  <select
                    value={lsa}
                    onChange={(e) => setLsa(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {activeProjectMeta.fields.secondaryOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MockTask["status"])}
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
                Request Raised By
              </label>
              <select
                value={raisedByName}
                onChange={(e) => setRaisedByName(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
              >
                {raisedByList.map((lea) => (
                  <option key={lea} value={lea}>
                    {lea}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              Problem description / Activity Detail
            </label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              Solution Applied
            </label>
            <textarea
              rows={3}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-xs px-4 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
