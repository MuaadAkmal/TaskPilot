"use client";

import React, { useState } from "react";
import { MockTask } from "@/lib/store";
import { TSPS, LSAS, STATUS_OPTIONS } from "@/lib/project-config";
import { formatDowntime } from "@/lib/utils";
import {
  Search,
  Calendar,
  Download,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
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
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sort,
  setSort,
}: ResolutionTableProps) {
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<MockTask | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<MockTask | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // CSV Export
  const handleExportCSV = (scope: "filtered" | "all") => {
    const dataToExport = scope === "filtered" ? tasks : allTasks;
    if (dataToExport.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const rows = dataToExport.map((t) => ({
      "Ticket ID": t.id,
      Project: t.project,
      TSP: t.tsp,
      LSA: t.lsa,
      Status: t.status,
      "Raised By": t.raisedByName,
      "Created At": t.createdAt,
      "Resolved At": t.resolvedAt || "",
      "Downtime (Minutes)": t.downtimeMinutes || 0,
      "Problem Description": t.problemDescription,
      "Solution Applied": t.solution,
      Remarks: t.remarks || "",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `taskpilot_resolutions_${scope}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
    toast.success(`Exported ${dataToExport.length} records to CSV.`);
  };

  // PDF Report Export
  const handleExportPDF = () => {
    const dataToExport = allTasks.length > 0 ? allTasks : tasks;
    if (dataToExport.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    // Document Title
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("TaskPilot - Incident & Resolution Knowledge Report", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${dataToExport.length}`, 14, 22);

    const tableRows = dataToExport.map((t) => [
      t.id,
      t.tsp,
      t.lsa,
      t.status,
      t.problemDescription.slice(0, 60) + "...",
      t.solution.slice(0, 60) + "...",
      formatDowntime(t.downtimeMinutes),
      t.raisedByName.split(" ")[0],
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["ID", "TSP", "LSA", "Status", "Problem", "Solution Applied", "Downtime", "Raised By"]],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save(`taskpilot_report_${Date.now()}.pdf`);
    setExportMenuOpen(false);
    toast.success("PDF Report generated successfully.");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Controls & Filter Toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2.5 items-center justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problem, fix, remarks, TSP, LSA..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TSP filter */}
          <select
            value={tsp}
            onChange={(e) => setTsp(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            <option value="ALL">All TSPs</option>
            {TSPS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* LSA filter */}
          <select
            value={lsa}
            onChange={(e) => setLsa(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            <option value="ALL">All LSAs (22 Circles)</option>
            {LSAS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            <option value="resolvedAt_desc">Latest Resolved</option>
            <option value="resolvedAt_asc">Oldest Resolved</option>
            <option value="downtime_desc">Highest Downtime</option>
            <option value="downtime_asc">Lowest Downtime</option>
            <option value="tsp_asc">Sort TSP (A-Z)</option>
            <option value="lsa_asc">Sort LSA (A-Z)</option>
          </select>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center space-x-1.5 text-xs bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-2 rounded-xl shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold">Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Export Options</div>
                <button
                  onClick={() => handleExportCSV("filtered")}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV (Current View)</span>
                </button>
                <button
                  onClick={() => handleExportCSV("all")}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV (All Records)</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2 text-slate-700 border-t border-slate-100"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export PDF Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0">
            <tr>
              <th className="py-3 px-3.5 w-16">ID</th>
              <th className="py-3 px-3 w-28">TSP / LSA</th>
              <th className="py-3 px-4">Problem & Solution Overview</th>
              <th className="py-3 px-3 w-24 text-center">Status</th>
              <th className="py-3 px-3 w-24">Downtime</th>
              <th className="py-3 px-3 w-28">Raised By</th>
              <th className="py-3 px-3 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No matching resolution records found</p>
                  <p className="text-[11px] mt-0.5">Try adjusting your search filters or record a new task above.</p>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-indigo-50/30 transition">
                  {/* ID */}
                  <td className="py-3 px-3.5 font-mono font-bold text-indigo-600 text-xs">
                    #{task.id}
                  </td>

                  {/* TSP & LSA */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 text-xs">{task.tsp}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{task.lsa}</div>
                  </td>

                  {/* Problem & Solution */}
                  <td className="py-3 px-4 max-w-xs md:max-w-sm">
                    <div className="font-medium text-slate-900 line-clamp-1 mb-0.5">
                      {task.problemDescription}
                    </div>
                    <div className="text-[11px] text-emerald-800 line-clamp-1 bg-emerald-50/60 px-2 py-0.5 rounded border border-emerald-100">
                      <strong className="font-semibold text-emerald-900">Fix:</strong> {task.solution}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {task.status}
                    </span>
                  </td>

                  {/* Downtime */}
                  <td className="py-3 px-3 font-medium text-slate-700">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                      {formatDowntime(task.downtimeMinutes)}
                    </span>
                  </td>

                  {/* Raised By */}
                  <td className="py-3 px-3 text-slate-600 text-[11px]">
                    {task.raisedByName}
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => setSelectedTaskForDetail(task)}
                        title="View Full Details"
                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedTaskForEdit(task)}
                        title="Edit Resolution"
                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
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

      {/* Pagination Footer (Exactly 8 entries per page) */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing <strong>{tasks.length > 0 ? (page - 1) * 8 + 1 : 0}</strong> -{" "}
          <strong>{Math.min(page * 8, total)}</strong> of <strong>{total}</strong> records (8 per page)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="px-2 text-xs font-bold text-slate-700">
            Page {page} of {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
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

      {/* Detail Modal */}
      {selectedTaskForDetail && (
        <ResolutionDetailModal
          task={selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
        />
      )}
    </div>
  );
}
