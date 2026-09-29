"use client";

import React, { useState } from "react";
import { MockTask } from "@/lib/store";
import { TSPS, LSAS, STATUS_OPTIONS } from "@/lib/project-config";
import { X, Check, Save } from "lucide-react";
import { toast } from "sonner";

interface ResolutionEditModalProps {
  task: MockTask;
  onClose: () => void;
  onSaved: () => void;
}

export function ResolutionEditModal({ task, onClose, onSaved }: ResolutionEditModalProps) {
  const [tsp, setTsp] = useState(task.tsp);
  const [lsa, setLsa] = useState(task.lsa);
  const [status, setStatus] = useState(task.status);
  const [problemDescription, setProblemDescription] = useState(task.problemDescription);
  const [solution, setSolution] = useState(task.solution);
  const [remarks, setRemarks] = useState(task.remarks || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
          problemDescription,
          solution,
          remarks,
        }),
      });

      if (res.ok) {
        toast.success(`Task #${task.id} updated successfully.`);
        onSaved();
      } else {
        toast.error("Failed to update task.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <span>Edit Resolution Record</span>
              <span className="font-mono text-indigo-300">#{task.id}</span>
            </h3>
            <p className="text-[11px] text-slate-400">Update problem diagnostics or resolution remarks</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">TSP Provider</label>
              <select
                value={tsp}
                onChange={(e) => setTsp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TSPS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">LSA Circle</label>
              <select
                value={lsa}
                onChange={(e) => setLsa(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LSAS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Problem Description</label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">Resolution Applied</label>
            <textarea
              rows={3}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl p-3 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Remarks & Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
