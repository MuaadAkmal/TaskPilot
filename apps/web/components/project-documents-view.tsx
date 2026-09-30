"use client";

import React, { useState, useEffect } from "react";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import {
  FileText,
  ExternalLink,
  Plus,
  BookOpen,
  FolderGit2,
  CheckCircle2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectDocumentsViewProps {
  project: ProjectCode;
}

export function ProjectDocumentsView({ project }: ProjectDocumentsViewProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("SOP");
  const [content, setContent] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [version, setVersion] = useState<string>("1.0.0");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeProjectMeta = PROJECTS.find((p) => p.code === project) || PROJECTS[0];

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?project=${project}`);
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [project]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide a title and document summary.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          title,
          category,
          content,
          fileUrl,
          version,
        }),
      });

      if (res.ok) {
        toast.success("Document / Link added successfully.");
        setTitle("");
        setContent("");
        setFileUrl("");
        setShowAddModal(false);
        fetchDocs();
      } else {
        toast.error("Failed to save document.");
      }
    } catch (err) {
      toast.error("Network error saving document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {activeProjectMeta.name} Knowledge Base & SOPs
            </h2>
            <p className="text-[11px] text-slate-400">
              Architecture links, runbooks, and troubleshooting documents for {activeProjectMeta.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Doc / Link</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No documentation or reference links logged yet for {activeProjectMeta.name}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {doc.category}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono text-slate-400">v{doc.version || "1.0.0"}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete document "${doc.title}"?`)) return;
                        try {
                          const res = await fetch(`/api/documents?id=${doc.id}`, { method: "DELETE" });
                          if (res.ok) {
                            toast.success("Document removed.");
                            fetchDocs();
                          } else {
                            toast.error("Failed to delete document.");
                          }
                        } catch {
                          toast.error("Network error deleting document.");
                        }
                      }}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {doc.content}
                </p>
              </div>

              {doc.fileUrl && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-full"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{doc.fileUrl}</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card w-full max-w-md p-5 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Add Documentation or Link
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add runbook links, wiki URLs, or architecture notes for {activeProjectMeta.name}.
            </p>

            <form onSubmit={handleAddDocument} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CIAS Firewall Recovery SOP"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  >
                    <option value="SOP">SOP / Runbook</option>
                    <option value="ARCHITECTURE">Architecture</option>
                    <option value="TROUBLESHOOTING_GUIDE">Troubleshooting Guide</option>
                    <option value="CHANGELOG">Changelog</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Resource URL / Link (Optional)
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://wiki.internal/cias/sop or google drive link"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Description / Content *
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Key instructions, prerequisites, or summary..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition"
                >
                  {isSubmitting ? "Saving..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
