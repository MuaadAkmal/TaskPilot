"use client";

import React from "react";
import { MockTask } from "@/lib/store";
import { formatDowntime } from "@/lib/utils";
import { X, CheckCircle2, Clock, MapPin, User, FileText } from "lucide-react";

interface ResolutionDetailModalProps {
  task: MockTask;
  onClose: () => void;
}

export function ResolutionDetailModal({ task, onClose }: ResolutionDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-600 text-white rounded">
              #{task.id}
            </span>
            <h3 className="font-bold text-sm">Resolution Incident Details</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">TSP Provider</span>
              <span className="font-bold text-slate-800 text-xs">{task.tsp}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">LSA Circle</span>
              <span className="font-bold text-slate-800 text-xs">{task.lsa}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Downtime</span>
              <span className="font-bold text-indigo-700 text-xs">{formatDowntime(task.downtimeMinutes)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {task.status}
              </span>
            </div>
          </div>

          {/* Problem */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1 text-slate-500">
              Problem & Observed Symptoms
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-900">
              {task.problemDescription}
            </div>
          </div>

          {/* Solution */}
          <div>
            <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Remediation Applied</span>
            </h4>
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 whitespace-pre-wrap leading-relaxed text-emerald-950 font-medium">
              {task.solution}
            </div>
          </div>

          {/* Remarks */}
          {task.remarks && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1 text-slate-500">
                Remarks & Observations
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                {task.remarks}
              </div>
            </div>
          )}

          {/* Footer attribution */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div>Reported by: <strong className="text-slate-600">{task.raisedByName}</strong></div>
            <div>Resolved at: <strong className="text-slate-600">{new Date(task.resolvedAt || task.createdAt).toLocaleString()}</strong></div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
