"use client";

import React, { useState } from "react";
import { MockTask } from "@/lib/store";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { formatDowntime } from "@/lib/utils";
import {
  Search,
  Download,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { ResolutionEditModal } from "./resolution-edit-modal";
import { ResolutionDetailModal } from "./resolution-detail-modal";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ResolutionTableProps {
  currentProject: ProjectCode;
  tasks: MockTask[];
  allTasks: MockTask[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRefresh: () => void;
  search: string;
  setSearch: (val: string) => void;
  tsp: string;
  setTsp: (val: string) => void;
  lsa: string;
  setLsa: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
}

export function ResolutionTable({
  currentProject,
  tasks,
  allTasks,
  total,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  search,
  setSearch,
  tsp,
  setTsp,
  lsa,
  setLsa,
  sort,
  setSort,
}: ResolutionTableProps) {
  const activeProjectMeta = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<MockTask | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<MockTask | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isTsoc = currentProject === "TSOC";
  const isMcx = currentProject === "MCX";
  const isCias = currentProject === "CIAS";

  const handleExportCSV = (scope: "filtered" | "all") => {
    const dataToExport = scope === "filtered" ? tasks : allTasks;
    if (dataToExport.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const rows = dataToExport.map((t) => {
      if (isCias) {
        return {
          "Ticket ID": t.id,
          "Device Location": t.tsp,
          Status: t.status,
          "Request Raised By": t.raisedByName,
          Date: t.resolvedAt || t.createdAt,
          Problem: t.problemDescription,
          Solution: t.solution,
          Remarks: t.remarks || "",
        };
      }
      if (isTsoc || isMcx) {
        return {
          "Ticket ID": t.id,
          DATE: t.resolvedAt || t.createdAt,
          STATUS: t.status,
          "REQUEST RAISED BY": t.raisedByName,
          "PROBLEM DESCRIPTION": t.problemDescription,
          SOLUTION: t.solution,
          REMARKS: t.remarks || "",
        };
      }
      return {
        "Ticket ID": t.id,
        Project: t.project,
        [activeProjectMeta.fields.primaryFieldLabel]: t.tsp,
        [activeProjectMeta.fields.secondaryFieldLabel]: t.lsa,
        Status: t.status,
        "Request Raised By": t.raisedByName,
        "Created At": t.createdAt,
        "Resolved At": t.resolvedAt || "",
        "Downtime (Minutes)": t.downtimeMinutes || 0,
        "Problem description / Activity Detail": t.problemDescription,
        "Solution Applied": t.solution,
        Remarks: t.remarks || "",
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `taskpilot_${currentProject}_${scope}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
    toast.success(`Exported ${dataToExport.length} records.`);
  };

  const handleExportPDF = () => {
    const dataToExport = allTasks.length > 0 ? allTasks : tasks;
    if (dataToExport.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TaskPilot - ${activeProjectMeta.name} Incident Report`, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${dataToExport.length}`, 14, 21);

    if (isCias) {
      const tableRows = dataToExport.map((t) => [
        t.id,
        t.tsp,
        t.status,
        t.raisedByName,
        new Date(t.resolvedAt || t.createdAt).toLocaleDateString(),
        t.problemDescription.slice(0, 40) + "...",
        t.solution.slice(0, 40) + "...",
        t.remarks || "-",
      ]);

      autoTable(doc, {
        startY: 26,
        head: [["ID", "Device Location", "Status", "Request Raised By", "Date", "Problem", "Solution", "Remarks"]],
        body: tableRows,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    } else {
      const tableRows = dataToExport.map((t) => [
        t.id,
        new Date(t.resolvedAt || t.createdAt).toLocaleDateString(),
        t.status,
        t.raisedByName,
        t.problemDescription.slice(0, 45) + "...",
        t.solution.slice(0, 45) + "...",
        t.remarks || "-",
      ]);

      autoTable(doc, {
        startY: 26,
        head: [["ID", "DATE", "STATUS", "REQUEST RAISED BY", "PROBLEM DESCRIPTION", "SOLUTION", "REMARKS"]],
        body: tableRows,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    doc.save(`taskpilot_${currentProject}_report_${Date.now()}.pdf`);
    setExportMenuOpen(false);
    toast.success("PDF generated.");
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden flex flex-col">
      {/* Minimal Filter Toolbar */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeProjectMeta.name}...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={tsp}
            onChange={(e) => setTsp(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
          >
            <option value="ALL">All {activeProjectMeta.fields.primaryFieldLabel}</option>
            {activeProjectMeta.fields.primaryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
          >
            <option value="resolvedAt_desc">Latest Date</option>
            <option value="resolvedAt_asc">Oldest Date</option>
            <option value="downtime_desc">Downtime (High)</option>
            <option value="downtime_asc">Downtime (Low)</option>
          </select>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center space-x-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleExportCSV("filtered")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>CSV (Current View)</span>
                </button>
                <button
                  onClick={() => handleExportCSV("all")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>CSV (All Records)</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>PDF Summary</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clean Minimal Table */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs">
          <thead>
            {isCias ? (
              /* CIAS Exact Column Layout: Device Location, Status, Request Raised By, Date, Problem, Solution, Remarks */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-32">Device Location</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
                <th className="py-2.5 px-3 w-36">Request Raised By</th>
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-4">Problem</th>
                <th className="py-2.5 px-4">Solution</th>
                <th className="py-2.5 px-3 w-32">Remarks</th>
                <th className="py-2.5 px-3 w-16 text-right"></th>
              </tr>
            ) : isTsoc || isMcx ? (
              /* TSOC / MCX Exact Column Layout: DATE, STATUS, REQUEST RAISED BY, PROBLEM DESCRIPTION, SOLUTION, REMARKS */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-28">DATE</th>
                <th className="py-2.5 px-3 w-24 text-center">STATUS</th>
                <th className="py-2.5 px-3 w-36">REQUEST RAISED BY</th>
                <th className="py-2.5 px-4">PROBLEM DESCRIPTION</th>
                <th className="py-2.5 px-4">SOLUTION</th>
                <th className="py-2.5 px-3 w-32">REMARKS</th>
                <th className="py-2.5 px-3 w-16 text-right"></th>
              </tr>
            ) : (
              /* Standard CMS Column Layout */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-32">{activeProjectMeta.fields.primaryFieldLabel}</th>
                <th className="py-2.5 px-4">Resolution Details</th>
                <th className="py-2.5 px-3 w-20 text-center">Status</th>
                <th className="py-2.5 px-3 w-20">Downtime</th>
                <th className="py-2.5 px-3 w-24">Raised By</th>
                <th className="py-2.5 px-3 w-16 text-right"></th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={isCias ? 9 : 8} className="py-14 text-center text-slate-400 dark:text-slate-500">
                  <Filter className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No records found</p>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group">
                  {/* ID */}
                  <td className="py-3 px-3.5 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                    #{task.id}
                  </td>

                  {isCias ? (
                    <>
                      {/* Device Location */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {task.tsp}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                          {task.status}
                        </span>
                      </td>

                      {/* Request Raised By */}
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {task.raisedByName}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(task.resolvedAt || task.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Problem */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-normal text-slate-800 dark:text-slate-200 line-clamp-2">
                          {task.problemDescription}
                        </p>
                      </td>

                      {/* Solution */}
                      <td className="py-3 px-4 max-w-xs font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        <p className="line-clamp-2">{task.solution}</p>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[120px] truncate">
                        {task.remarks || "-"}
                      </td>
                    </>
                  ) : isTsoc || isMcx ? (
                    <>
                      {/* DATE */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(task.resolvedAt || task.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                          {task.status}
                        </span>
                      </td>

                      {/* REQUEST RAISED BY */}
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {task.raisedByName}
                      </td>

                      {/* PROBLEM DESCRIPTION */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-normal text-slate-800 dark:text-slate-200 line-clamp-2">
                          {task.problemDescription}
                        </p>
                      </td>

                      {/* SOLUTION */}
                      <td className="py-3 px-4 max-w-xs font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        <p className="line-clamp-2">{task.solution}</p>
                      </td>

                      {/* REMARKS */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[120px] truncate">
                        {task.remarks || "-"}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* TSP / Category */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{task.tsp}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{task.lsa}</div>
                      </td>

                      {/* Problem & Solution */}
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-normal text-slate-800 dark:text-slate-200 line-clamp-1">{task.problemDescription}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Fix:</span> {task.solution}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                          {task.status}
                        </span>
                      </td>

                      {/* Downtime */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {formatDowntime(task.downtimeMinutes)}
                      </td>

                      {/* Raised By */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[100px]">
                        {task.raisedByName}
                      </td>
                    </>
                  )}

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setSelectedTaskForDetail(task)}
                        title="View"
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedTaskForEdit(task)}
                        title="Edit"
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px]">
          {tasks.length > 0 ? (page - 1) * 8 + 1 : 0}-{Math.min(page * 8, total)} of {total} records
        </span>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 px-1">
            {page} / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedTaskForEdit && (
        <ResolutionEditModal
          task={selectedTaskForEdit}
          onClose={() => setSelectedTaskForEdit(null)}
          onSaved={() => {
            setSelectedTaskForEdit(null);
            onRefresh();
          }}
        />
      )}

      {selectedTaskForDetail && (
        <ResolutionDetailModal
          task={selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
        />
      )}
    </div>
  );
}
