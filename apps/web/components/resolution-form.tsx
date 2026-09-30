"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ProjectCode,
  PROJECTS,
  STATUS_OPTIONS,
  CMS_LSA_LIST,
  CMS_LSA_TSP_MAP,
  CMS_LSA_FULL_NAMES,
} from "@/lib/project-config";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ResolutionFormProps {
  project: ProjectCode;
  onRecordCreated: () => void;
}

export function ResolutionForm({ project, onRecordCreated }: ResolutionFormProps) {
  const { user: clerkUser } = useUser();
  const activeProjectMeta = PROJECTS.find((p) => p.code === project) || PROJECTS[0];
  const raisedByList = activeProjectMeta.fields.raisedByOptions || [];

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [tspVal, setTspVal] = useState<string>("");
  const [lsaVal, setLsaVal] = useState<string>("");
  const [status, setStatus] = useState<string>("RESOLVED");
  const [raisedByName, setRaisedByName] = useState<string>(raisedByList[0] || "DOT");
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [solution, setSolution] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [resolvedAt, setResolvedAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isCMS = project === "CMS" || (project as string) === "CMS_VAL_FS";
  const isTsoc = project === "TSOC";
  const isMcx = project === "MCX";
  const isCias = project === "CIAS";
  const isCdrOrIpdr = project === "CDR" || project === "IPDR";
  const isAsr = project === "ASR";

  // When project or activeProjectMeta changes, initialize LSA & TSP
  useEffect(() => {
    if (isCMS) {
      const defaultLsa = CMS_LSA_LIST[0] || "AP";
      setLsaVal(defaultLsa);
      const availableTsps = CMS_LSA_TSP_MAP[defaultLsa] || ["AT"];
      setTspVal(availableTsps[0]);
    } else if (isCdrOrIpdr) {
      const defaultLsa = CMS_LSA_LIST[0] || "AP";
      setLsaVal(defaultLsa);
      setTspVal(activeProjectMeta.fields.primaryOptions[0] || "Airtel");
    } else {
      setTspVal(activeProjectMeta.fields.primaryOptions[0] || "");
      setLsaVal(activeProjectMeta.fields.secondaryOptions[0] || "");
    }
    setRaisedByName(activeProjectMeta.fields.raisedByOptions[0] || "DOT");
  }, [project, isCMS, isCdrOrIpdr, activeProjectMeta]);

  // When LSA changes, automatically adjust available TSPs for CMS
  const handleLsaChange = (newLsa: string) => {
    setLsaVal(newLsa);
    if (isCMS) {
      const availableTsps = CMS_LSA_TSP_MAP[newLsa] || [];
      if (!availableTsps.includes(tspVal)) {
        setTspVal(availableTsps[0] || "");
      }
    }
  };

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
      const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;
      const primaryName = clerkUser?.fullName || clerkUser?.firstName;
      const storedEmail = primaryEmail || (typeof window !== "undefined" ? localStorage.getItem("user_email") || "engineer@taskpilot.io" : "engineer@taskpilot.io");
      const storedName = primaryName || (typeof window !== "undefined" ? localStorage.getItem("user_name") || storedEmail.split("@")[0] : "Lead Operator");

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          tsp: tspVal || "General",
          lsa: lsaVal || "All",
          status,
          raisedByName,
          createdByName: storedName,
          createdByEmail: storedEmail,
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

  // Determine current available TSP options
  const currentTspOptions = isCMS
    ? CMS_LSA_TSP_MAP[lsaVal] || ["AT", "BS", "RC", "RI", "VO", "TA"]
    : activeProjectMeta.fields.primaryOptions;

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
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            New Resolution Entry
          </span>
          <span className="text-xs text-slate-400 font-normal">
            ({activeProjectMeta.name})
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            <span>Ctrl + Enter</span>
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isCMS ? (
              <>
                {/* CMS Dependent LSA -> TSP selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    LSA (Circle)
                  </label>
                  <select
                    value={lsaVal}
                    onChange={(e) => handleLsaChange(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-semibold"
                  >
                    {CMS_LSA_LIST.map((lsa) => (
                      <option key={lsa} value={lsa}>
                        {CMS_LSA_FULL_NAMES[lsa] || lsa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    TSP (Provider in {lsaVal})
                  </label>
                  <select
                    value={tspVal}
                    onChange={(e) => setTspVal(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-semibold"
                  >
                    {currentTspOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={resolvedAt}
                    onChange={(e) => setResolvedAt(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-4 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Request Raised By (LEA)
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      Selected: <strong className="text-indigo-600 dark:text-indigo-400">{raisedByName}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                    {raisedByList.map((lea) => {
                      const isSelected = raisedByName === lea;
                      return (
                        <button
                          key={lea}
                          type="button"
                          onClick={() => setRaisedByName(lea)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-center border ${
                            isSelected
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs font-semibold"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750"
                          }`}
                        >
                          {lea}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : isCdrOrIpdr ? (
              <>
                {/* CDR / IPDR Layout: LSA, TSP, DATE, STATUS, REQUEST RAISED BY */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    LSA (Circle)
                  </label>
                  <select
                    value={lsaVal}
                    onChange={(e) => handleLsaChange(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {CMS_LSA_LIST.map((l) => (
                      <option key={l} value={l}>
                        {CMS_LSA_FULL_NAMES[l] || l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    TSP (Provider in {lsaVal})
                  </label>
                  <select
                    value={tspVal}
                    onChange={(e) => setTspVal(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-semibold"
                  >
                    {currentTspOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={resolvedAt}
                    onChange={(e) => setResolvedAt(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Request Raised By (LEA)
                  </label>
                  <select
                    value={raisedByName}
                    onChange={(e) => setRaisedByName(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {raisedByList.map((lea) => (
                      <option key={lea} value={lea}>
                        {lea}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : isCias ? (
              <>
                {/* CIAS Layout: Device Location, Status, Request Raised By, Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Device Location
                  </label>
                  <select
                    value={tspVal}
                    onChange={(e) => setTspVal(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {activeProjectMeta.fields.primaryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Request Raised By
                  </label>
                  <select
                    value={raisedByName}
                    onChange={(e) => setRaisedByName(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {raisedByList.map((lea) => (
                      <option key={lea} value={lea}>
                        {lea}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={resolvedAt}
                    onChange={(e) => setResolvedAt(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </>
            ) : isAsr ? (
              <>
                {/* ASR Layout: Date & Time, Speech Pipeline / Component, Status, Request Raised By */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={resolvedAt}
                    onChange={(e) => setResolvedAt(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Speech Component / Pipeline
                  </label>
                  <select
                    value={tspVal}
                    onChange={(e) => setTspVal(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {activeProjectMeta.fields.primaryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Logged By / Raised By
                  </label>
                  <select
                    value={raisedByName}
                    onChange={(e) => setRaisedByName(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {raisedByList.map((lea) => (
                      <option key={lea} value={lea}>
                        {lea}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* TSOC / MCX Layout: Date & Time, Status, Request Raised By */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={resolvedAt}
                    onChange={(e) => setResolvedAt(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Request Raised By
                  </label>
                  <select
                    value={raisedByName}
                    onChange={(e) => setRaisedByName(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-medium"
                  >
                    {raisedByList.map((lea) => (
                      <option key={lea} value={lea}>
                        {lea}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Description & Solution Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {isAsr
                  ? "Task Done *"
                  : isCias
                  ? "Problem"
                  : isTsoc || isMcx || isCdrOrIpdr
                  ? "Problem Description"
                  : "Problem description / Activity Detail"}
              </label>
              <textarea
                rows={2}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder={
                  isAsr
                    ? "Speech processing task, model tuning, acoustic calibration, or maintenance done..."
                    : "Observed alarms, incident details, or symptoms..."
                }
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {isAsr ? "Inference *" : "Solution"}
              </label>
              <textarea
                rows={2}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder={
                  isAsr
                    ? "Inference latency, WER (Word Error Rate), model output observations, or conclusion..."
                    : "Exact commands executed or fix implemented..."
                }
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition font-mono"
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
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 transition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-3.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-slate-900 font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-1.5"
              >
                <span>{isSubmitting ? "Saving..." : "Log Entry"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
