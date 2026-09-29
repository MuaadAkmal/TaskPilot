"use client";

import React, { useState, useRef } from "react";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import { Upload, X, FileSpreadsheet, Check, AlertCircle, ArrowRight } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

interface CsvImportModalProps {
  currentProject: ProjectCode;
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export function CsvImportModal({
  currentProject,
  isOpen,
  onClose,
  onImportSuccess,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProjectMeta = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a valid .csv file.");
      return;
    }

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("The CSV file appears to be empty.");
          return;
        }
        setHeaders(results.meta.fields || []);
        setParsedRows(results.data);
      },
      error: (err) => {
        toast.error(`CSV Parsing error: ${err.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    setIsUploading(true);

    try {
      // Map generic CSV columns to TaskPilot task model
      const formattedTasks = parsedRows.map((row) => {
        // Intelligent key finding
        const getVal = (...keys: string[]) => {
          for (const k of keys) {
            for (const header of headers) {
              if (header.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")) {
                return row[header];
              }
            }
          }
          return "";
        };

        const tspVal = getVal("tsp", "telecomprovider", "devicelocation", "primaryoption", "servicecomponent", "category");
        const lsaVal = getVal("lsa", "circle", "servicecircle", "subsystem", "cluster", "system");
        const problemVal = getVal("problemdescription", "problem", "activitydetail", "description", "issue");
        const solutionVal = getVal("solutionapplied", "solution", "resolution", "actiontaken");
        const statusVal = getVal("status") || "RESOLVED";
        const raisedByVal = getVal("requestraisedby", "raisedby", "reportedby", "agency") || "NOC Team";
        const remarksVal = getVal("remarks", "notes", "comment");
        const dateVal = getVal("resolvedat", "date", "createdat", "timestamp");

        return {
          project: currentProject,
          tsp: tspVal || activeProjectMeta.fields.primaryOptions[0] || "ALL",
          lsa: lsaVal || activeProjectMeta.fields.secondaryOptions[0] || "ALL",
          problemDescription: problemVal || "Bulk imported record",
          solution: solutionVal || "Processed during shift",
          status: (() => {
            const up = statusVal.toUpperCase();
            if (up === "PENDING" || up === "PENDING_VERIFICATION" || up === "OPEN") return "PENDING";
            if (up === "IN_PROGRESS" || up === "PROGRESS") return "IN_PROGRESS";
            return "RESOLVED";
          })(),
          raisedByName: raisedByVal,
          remarks: remarksVal || null,
          createdAt: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
          resolvedAt: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
          createdByName: "CSV Importer",
          createdByEmail: "engineer@taskpilot.io",
        };
      });

      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "importTasks",
          project: currentProject,
          tasks: formattedTasks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully imported ${data.count} incident logs into ${activeProjectMeta.name}!`);
        onImportSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to bulk import tasks.");
      }
    } catch (err) {
      toast.error("Network error during bulk import.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card max-w-xl w-full overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Bulk CSV Incident Importer
              </h3>
              <p className="text-[11px] text-slate-400">Target Workspace: {activeProjectMeta.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
            >
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drop your CSV file here
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports standard columns: TSP, LSA, Problem Description, Solution, Status, Raised By
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-2.5 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {parsedRows.length} rows detected • {headers.length} columns
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                    setHeaders([]);
                  }}
                  className="text-xs text-rose-500 hover:underline shrink-0"
                >
                  Change File
                </button>
              </div>

              {/* Data Preview */}
              <div>
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Preview (First 3 rows)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ready to insert</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-40">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        {headers.slice(0, 5).map((h) => (
                          <th key={h} className="p-1.5 font-medium border-b border-slate-200 dark:border-slate-700">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          {headers.slice(0, 5).map((h) => (
                            <td key={h} className="p-1.5 max-w-[120px] truncate text-slate-600 dark:text-slate-400">
                              {r[h] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!file || parsedRows.length === 0 || isUploading}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-xs px-4 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isUploading ? (
              <span>Importing {parsedRows.length} rows...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Import {parsedRows.length} Incidents</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
