"use client";

import React, { useState } from "react";
import { MockTask } from "@/lib/store";
import {
  ProjectCode,
  PROJECTS,
  CMS_LSA_FULL_NAMES,
  STATUS_OPTIONS,
} from "@/lib/project-config";
import {
  Search,
  Filter,
  Download,
  Calendar,
  X,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
} from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { ResolutionEditModal } from "./resolution-edit-modal";
import { ResolutionDetailModal } from "./resolution-detail-modal";

interface ResolutionTableProps {
  tasks: MockTask[];
  allTasks: MockTask[];
  currentProject: ProjectCode;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  search: string;
  setSearch: (s: string) => void;
  tsp: string;
  setTsp: (t: string) => void;
  lsa: string;
  setLsa: (l: string) => void;
  startDate?: string;
  setStartDate?: (d: string) => void;
  endDate?: string;
  setEndDate?: (d: string) => void;
  sort: string;
  setSort: (s: string) => void;
}

export function ResolutionTable({
  tasks,
  allTasks,
  currentProject,
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
  startDate: propStartDate,
  setStartDate: propSetStartDate,
  endDate: propEndDate,
  setEndDate: propSetEndDate,
  sort,
  setSort,
}: ResolutionTableProps) {
  const activeProjectMeta = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<MockTask | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<MockTask | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isTsoc = currentProject === "TSOC";
  const isMcx = currentProject === "MCX";
  const isCias = currentProject === "CIAS";
  const isCdrOrIpdr = currentProject === "CDR" || currentProject === "IPDR";

  const filterByDateRange = (list: MockTask[]) => {
    if (!startDate && !endDate) return list;
    return list.filter((t) => {
      const taskDate = new Date(t.resolvedAt || t.createdAt).getTime();
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (taskDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (taskDate > end) return false;
      }
      return true;
    });
  };

  const handleExportCSV = (scope: "filtered" | "all" | "custom_range") => {
    let rawList = scope === "filtered" ? tasks : allTasks;
    if (scope === "custom_range") {
      rawList = filterByDateRange(allTasks.length > 0 ? allTasks : tasks);
    }

    if (rawList.length === 0) {
      toast.error("No records found in the specified criteria to export.");
      return;
    }

    const rows = rawList.map((t) => {
      if (isCdrOrIpdr) {
        return {
          "Ticket ID": t.id,
          LSA: t.lsa,
          TSP: t.tsp,
          DATE: t.resolvedAt || t.createdAt,
          STATUS: t.status,
          "REQUEST RAISED BY": t.raisedByName,
          "PROBLEM DESCRIPTION": t.problemDescription,
          SOLUTION: t.solution,
          REMARKS: t.remarks || "",
        };
      }
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
    setDateRangeModalOpen(false);
    toast.success(`Exported ${rawList.length} records to CSV.`);
  };

  const handleExportPDF = (scope: "all" | "custom_range" = "all") => {
    let dataToExport = allTasks.length > 0 ? allTasks : tasks;
    if (scope === "custom_range") {
      dataToExport = filterByDateRange(dataToExport);
    }

    if (dataToExport.length === 0) {
      toast.error("No records found in the specified criteria to export.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`TaskPilot - ${activeProjectMeta.name} Incident Report`, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateRangeNote = startDate || endDate ? ` | Range: ${startDate || 'Start'} to ${endDate || 'Now'}` : '';
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${dataToExport.length}${dateRangeNote}`, 14, 21);

    if (isCdrOrIpdr) {
      const tableRows = dataToExport.map((t) => [
        t.id,
        t.lsa,
        t.tsp,
        new Date(t.resolvedAt || t.createdAt).toLocaleDateString(),
        t.status,
        t.raisedByName,
        t.problemDescription.slice(0, 40) + "...",
        t.solution.slice(0, 40) + "...",
        t.remarks || "-",
      ]);

      autoTable(doc, {
        startY: 26,
        head: [["ID", "LSA", "TSP", "DATE", "STATUS", "RAISED BY", "PROBLEM DESCRIPTION", "SOLUTION", "REMARKS"]],
        body: tableRows,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    } else if (isCias) {
      const tableRows = dataToExport.map((t) => [
        t.id,
        t.tsp,
        t.status,
        t.raisedByName,
        new Date(t.resolvedAt || t.createdAt).toLocaleDateString(),
        t.problemDescription.slice(0, 45) + "...",
        t.solution.slice(0, 45) + "...",
        t.remarks || "-",
      ]);

      autoTable(doc, {
        startY: 26,
        head: [["ID", "DEVICE LOCATION", "STATUS", "RAISED BY", "DATE", "PROBLEM", "SOLUTION", "REMARKS"]],
        body: tableRows,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    } else if (isTsoc || isMcx) {
      const tableRows = dataToExport.map((t) => [
        t.id,
        new Date(t.resolvedAt || t.createdAt).toLocaleDateString(),
        t.status,
        t.raisedByName,
        t.problemDescription.slice(0, 50) + "...",
        t.solution.slice(0, 50) + "...",
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
    } else {
      const tableRows = dataToExport.map((t) => [
        t.id,
        t.tsp,
        t.lsa,
        t.status,
        t.raisedByName,
        new Date(t.resolvedAt || t.createdAt).toLocaleDateString(),
        t.downtimeMinutes ? `${t.downtimeMinutes}m` : "-",
        t.problemDescription.slice(0, 35) + "...",
        t.solution.slice(0, 35) + "...",
      ]);

      autoTable(doc, {
        startY: 26,
        head: [["ID", "TSP", "LSA", "STATUS", "RAISED BY", "RESOLVED AT", "DOWNTIME", "PROBLEM DESCRIPTION / ACTIVITY DETAIL", "SOLUTION"]],
        body: tableRows,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    doc.save(`taskpilot_${currentProject}_report_${Date.now()}.pdf`);
    setExportMenuOpen(false);
    setDateRangeModalOpen(false);
    toast.success(`PDF generated for ${dataToExport.length} records.`);
  };

  const openDateRangePicker = (format: "csv" | "pdf") => {
    setExportFormat(format);
    setDateRangeModalOpen(true);
    setExportMenuOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            Resolved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
            In Progress
          </span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
            Pending
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
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

          {/* Export Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center space-x-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Export
                </div>
                <button
                  onClick={() => handleExportCSV("filtered")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>CSV (Current Page View)</span>
                </button>
                <button
                  onClick={() => handleExportCSV("all")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>CSV (All Records)</span>
                </button>
                <button
                  onClick={() => handleExportPDF("all")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>PDF (All Records)</span>
                </button>

                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800 mt-1">
                  Custom Range Export
                </div>
                <button
                  onClick={() => openDateRangePicker("csv")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center space-x-2 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export CSV by Date Range...</span>
                </button>
                <button
                  onClick={() => openDateRangePicker("pdf")}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center space-x-2 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export PDF by Date Range...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Modal */}
      {dateRangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card max-w-sm w-full overflow-hidden p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Select Date Range
                </h3>
              </div>
              <button
                onClick={() => setDateRangeModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500">
                Matching records: <strong className="text-slate-700 dark:text-slate-200">{filterByDateRange(allTasks.length > 0 ? allTasks : tasks).length}</strong> records found.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDateRangeModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (exportFormat === "csv") {
                    handleExportCSV("custom_range");
                  } else {
                    handleExportPDF("custom_range");
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-xs px-4 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export {exportFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Minimal Table */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs">
          <thead>
            {isCdrOrIpdr ? (
              /* CDR & IPDR Columns: LSA, TSP, DATE, STATUS, REQUEST RAISED BY, PROBLEM DESCRIPTION, SOLUTION, REMARKS */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-28">LSA</th>
                <th className="py-2.5 px-3 w-28">TSP</th>
                <th className="py-2.5 px-3 w-32">DATE</th>
                <th className="py-2.5 px-3 w-24">STATUS</th>
                <th className="py-2.5 px-3 w-36">REQUEST RAISED BY</th>
                <th className="py-2.5 px-3">PROBLEM DESCRIPTION</th>
                <th className="py-2.5 px-3">SOLUTION</th>
                <th className="py-2.5 px-3 w-32">REMARKS</th>
                <th className="py-2.5 px-3 text-right w-16">Actions</th>
              </tr>
            ) : isCias ? (
              /* CIAS Columns: Device Location, Status, Request Raised By, Date, Problem, Solution, Remarks */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-36">Device Location</th>
                <th className="py-2.5 px-3 w-24">Status</th>
                <th className="py-2.5 px-3 w-36">Request Raised By</th>
                <th className="py-2.5 px-3 w-32">Date</th>
                <th className="py-2.5 px-3">Problem</th>
                <th className="py-2.5 px-3">Solution</th>
                <th className="py-2.5 px-3 w-32">Remarks</th>
                <th className="py-2.5 px-3 text-right w-16">Actions</th>
              </tr>
            ) : isTsoc || isMcx ? (
              /* TSOC / MCX Columns: DATE, STATUS, REQUEST RAISED BY, PROBLEM DESCRIPTION, SOLUTION, REMARKS */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-32">DATE</th>
                <th className="py-2.5 px-3 w-24">STATUS</th>
                <th className="py-2.5 px-3 w-36">REQUEST RAISED BY</th>
                <th className="py-2.5 px-3">PROBLEM DESCRIPTION</th>
                <th className="py-2.5 px-3">SOLUTION</th>
                <th className="py-2.5 px-3 w-32">REMARKS</th>
                <th className="py-2.5 px-3 text-right w-16">Actions</th>
              </tr>
            ) : (
              /* Default CMS Columns */
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-14">#</th>
                <th className="py-2.5 px-3 w-24">LSA</th>
                <th className="py-2.5 px-3 w-28">TSP</th>
                <th className="py-2.5 px-3 w-24">Status</th>
                <th className="py-2.5 px-3 w-32">Raised By</th>
                <th className="py-2.5 px-3 w-32">Resolved</th>
                <th className="py-2.5 px-3">Problem description / Activity Detail</th>
                <th className="py-2.5 px-3">Solution</th>
                <th className="py-2.5 px-3 text-right w-16">Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Filter className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">No records matching your search / filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                  onClick={() => setSelectedTaskForDetail(task)}
                >
                  <td className="py-2.5 px-3.5 font-mono text-slate-400 text-[11px]">
                    #{task.id}
                  </td>

                  {isCdrOrIpdr ? (
                    <>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {CMS_LSA_FULL_NAMES[task.lsa] || task.lsa}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {task.tsp}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(task.resolvedAt || task.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(task.status)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {task.raisedByName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {task.problemDescription}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate font-mono text-[11px]">
                        {task.solution}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                        {task.remarks || "-"}
                      </td>
                    </>
                  ) : isCias ? (
                    <>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {task.tsp}
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(task.status)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {task.raisedByName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(task.resolvedAt || task.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {task.problemDescription}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate font-mono text-[11px]">
                        {task.solution}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                        {task.remarks || "-"}
                      </td>
                    </>
                  ) : isTsoc || isMcx ? (
                    <>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(task.resolvedAt || task.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(task.status)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {task.raisedByName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[220px] truncate">
                        {task.problemDescription}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[220px] truncate font-mono text-[11px]">
                        {task.solution}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                        {task.remarks || "-"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {CMS_LSA_FULL_NAMES[task.lsa] || task.lsa}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {task.tsp}
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(task.status)}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {task.raisedByName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(task.resolvedAt || task.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {task.problemDescription}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[180px] truncate font-mono text-[11px]">
                        {task.solution}
                      </td>
                    </>
                  )}

                  {/* Actions Column */}
                  <td
                    className="py-2.5 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setSelectedTaskForEdit(task)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Resolution"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing {tasks.length > 0 ? (page - 1) * 10 + 1 : 0} to{" "}
          {Math.min(page * 10, total)} of {total} entries
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <span className="px-2 text-slate-600 dark:text-slate-300 font-mono">
            {page} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Next
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
