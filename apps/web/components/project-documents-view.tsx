"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ProjectCode, PROJECTS } from "@/lib/project-config";
import {
  FileText,
  ExternalLink,
  Plus,
  BookOpen,
  Folder,
  FolderPlus,
  FolderOpen,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  UploadCloud,
  File,
  Layers,
  Search,
  HardDrive,
  ChevronRight,
  Database,
  Link as LinkIcon,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectDocumentsViewProps {
  project: ProjectCode;
}

export function ProjectDocumentsView({ project }: ProjectDocumentsViewProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);

  // Folder & Filter State
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("SOP");
  const [docFolder, setDocFolder] = useState<string>("General");
  const [content, setContent] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [version, setVersion] = useState<string>("1.0.0");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // File Upload State (for S3 storage attachments)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeProjectMeta = PROJECTS.find((p) => p.code === project) || PROJECTS[0];

  // Only derive folders dynamically from documents and user-created custom folders
  const allAvailableFolders = useMemo(() => {
    const fromDocs = Array.from(new Set(documents.map((d) => d.folder || "General")));
    const merged = Array.from(new Set([...customFolders, ...fromDocs]));
    const list = merged.filter(Boolean);
    if (!list.includes("General") && list.length === 0) {
      return ["General"];
    }
    return list;
  }, [customFolders, documents]);

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
    setSelectedFolder("ALL");
  }, [project]);

  const openAddModal = (initialFolder?: string) => {
    setEditingDoc(null);
    setTitle("");
    setCategory("SOP");
    setDocFolder(initialFolder && initialFolder !== "ALL" ? initialFolder : allAvailableFolders[0] || "General");
    setContent("");
    setFileUrl("");
    setVersion("1.0.0");
    setUploadedFile(null);
    setUploadProgress(0);
    setShowAddModal(true);
  };

  const openEditModal = (doc: any) => {
    setEditingDoc(doc);
    setTitle(doc.title || "");
    setCategory(doc.category || "SOP");
    setDocFolder(doc.folder || "General");
    setContent(doc.content || "");
    setFileUrl(doc.fileUrl || "");
    setVersion(doc.version || "1.0.0");
    setUploadedFile(null);
    setShowAddModal(true);
  };

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (!allAvailableFolders.includes(trimmed)) {
      setCustomFolders((prev) => [...prev, trimmed]);
      setSelectedFolder(trimmed);
      toast.success(`Folder "${trimmed}" created.`);
    } else {
      setSelectedFolder(trimmed);
    }
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const handleDeleteFolder = async (fName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docCount = documents.filter((d) => (d.folder || "General") === fName).length;
    const confirmMsg = docCount > 0
      ? `Are you sure you want to delete folder "${fName}" and all ${docCount} file(s) inside it?`
      : `Are you sure you want to delete folder "${fName}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/documents?folder=${encodeURIComponent(fName)}&project=${project}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Folder "${fName}" deleted.`);
        setCustomFolders((prev) => prev.filter((f) => f !== fName));
        if (selectedFolder === fName) {
          setSelectedFolder("ALL");
        }
        fetchDocs();
      } else {
        toast.error("Failed to delete folder.");
      }
    } catch {
      toast.error("Network error deleting folder.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setUploadedFile(file);
      if (!title) {
        // Auto-fill title from filename
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      // If user hasn't put a fileUrl, generate S3-compliant reference path
      if (!fileUrl) {
        const sanitized = file.name.replace(/\s+/g, "-").toLowerCase();
        setFileUrl(`s3://taskpilot-documents/${project.toLowerCase()}/${sanitized}`);
      }
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide a title and document summary.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalFileUrl = fileUrl.trim() || null;
      let finalFileSize = uploadedFile ? uploadedFile.size : undefined;
      let finalFileType = uploadedFile ? uploadedFile.type : undefined;

      // If user attached a file, upload to S3 endpoint first
      if (uploadedFile) {
        toast.info("Uploading file to S3 bucket...");
        const s3FormData = new FormData();
        s3FormData.append("file", uploadedFile);
        s3FormData.append("project", project);
        s3FormData.append("folder", docFolder);

        const uploadRes = await fetch("/api/s3/upload", {
          method: "POST",
          body: s3FormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalFileUrl = uploadData.fileUrl || uploadData.s3Uri || finalFileUrl;
          finalFileSize = uploadData.fileSize || finalFileSize;
          finalFileType = uploadData.fileType || finalFileType;
        } else {
          console.warn("S3 upload returned non-200, continuing with document record save.");
        }
      }

      const payload = {
        project,
        title: title.trim(),
        category,
        folder: docFolder.trim() || "General",
        content: content.trim(),
        fileUrl: finalFileUrl,
        fileSize: finalFileSize,
        fileType: finalFileType,
        version: version.trim() || "1.0.0",
      };

      if (editingDoc) {
        const res = await fetch("/api/documents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDoc.id,
            ...payload,
          }),
        });

        if (res.ok) {
          toast.success("Document updated successfully.");
          setShowAddModal(false);
          setEditingDoc(null);
          fetchDocs();
        } else {
          const errData = await res.json();
          toast.error(errData.error || "Failed to update document.");
        }
      } else {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success("Document added to folder successfully.");
          setShowAddModal(false);
          fetchDocs();
        } else {
          const errData = await res.json();
          toast.error(errData.error || "Failed to save document.");
        }
      }
    } catch (err) {
      toast.error("Network error saving document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesFolder =
        selectedFolder === "ALL" || (doc.folder || "General") === selectedFolder;
      const matchesSearch =
        searchQuery.trim() === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.fileUrl && doc.fileUrl.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFolder && matchesSearch;
    });
  }, [documents, selectedFolder, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-card p-5 mb-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {activeProjectMeta.name} File Explorer & Knowledge Hub
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                S3 & Docs
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Folder hierarchies, architectural diagrams, model files, and S3-backed documents for {activeProjectMeta.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewFolderInput(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => openAddModal(selectedFolder)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload / Add Doc</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Folder Tree + Right File Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Folder Navigation */}
        <div className="lg:col-span-1 space-y-2 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Folder Structure
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {allAvailableFolders.length} folders
            </span>
          </div>

          {/* All Files Tab */}
          <button
            onClick={() => setSelectedFolder("ALL")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedFolder === "ALL"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="truncate">All Project Files</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{documents.length}</span>
          </button>

          {/* Folder List */}
          <div className="space-y-0.5 pt-1">
            {allAvailableFolders.map((fName) => {
              const count = documents.filter((d) => (d.folder || "General") === fName).length;
              const isSelected = selectedFolder === fName;
              return (
                <div
                  key={fName}
                  onClick={() => setSelectedFolder(fName)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition group ${
                    isSelected
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {isSelected ? (
                      <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500/70" />
                    )}
                    <span className="truncate">{fName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">{count}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFolder(fName, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 rounded transition"
                      title={`Delete folder "${fName}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Folder Inline Form */}
          {showNewFolderInput && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 mb-1.5 focus:outline-none focus:border-amber-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowNewFolderInput(false);
                }}
              />
              <div className="flex items-center justify-end space-x-1">
                <button
                  onClick={() => setShowNewFolderInput(false)}
                  className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-2 py-0.5 text-[10px] bg-amber-500 text-white rounded font-medium hover:bg-amber-600"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* S3 Storage Status Box */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>Storage Provider</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Target S3 Bucket: <code className="font-mono text-indigo-600 dark:text-indigo-400">s3://taskpilot-documents/{project.toLowerCase()}</code>
            </p>
          </div>
        </div>

        {/* Right Area: Document Search & Explorer Grid */}
        <div className="lg:col-span-3 space-y-3">
          {/* Search & Breadcrumb Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 pl-1">
              <span className="font-medium text-slate-900 dark:text-slate-100">{activeProjectMeta.name}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {selectedFolder === "ALL" ? "All Files" : selectedFolder}
              </span>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files & links in folder..."
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Files Grid */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading folder files...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8">
              <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-600 dark:text-slate-300">
                No documents found in {selectedFolder === "ALL" ? "this project" : `folder "${selectedFolder}"`}.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload files, attachments, or add documentation links directly into this folder.
              </p>
              <button
                onClick={() => openAddModal(selectedFolder)}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Document Here</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 truncate">
                          📁 {doc.folder || "General"}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {doc.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] font-mono text-slate-400 mr-1">v{doc.version || "1.0.0"}</span>
                        <button
                          onClick={() => openEditModal(doc)}
                          className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
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
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                      {doc.content}
                    </p>
                  </div>

                  {doc.fileUrl && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <a
                        href={doc.fileUrl.startsWith("http") ? doc.fileUrl : undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[85%]"
                        title={doc.fileUrl}
                      >
                        {doc.fileUrl.startsWith("s3://") ? (
                          <HardDrive className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate font-mono">{doc.fileUrl}</span>
                      </a>
                      {doc.fileSize && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(doc.fileSize / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card w-full max-w-lg p-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingDoc ? "Edit Document / S3 Link" : "Add / Upload Document to Folder"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {editingDoc
                ? `Update details and folder placement for ${activeProjectMeta.name}.`
                : `Upload files to S3 bucket or log links/documents for ${activeProjectMeta.name}.`}
            </p>

            <form onSubmit={handleSaveDocument} className="space-y-3.5">
              {/* File Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mx-auto mb-1 transition" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {uploadedFile ? uploadedFile.name : "Click to select a file for S3 upload"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {uploadedFile
                    ? `${(uploadedFile.size / 1024).toFixed(1)} KB — Ready to attach`
                    : "PDFs, Architecture schemas, audio logs, model configs, or Word docs"}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Speech Model Deployment Runbook"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Folder *
                  </label>
                  <select
                    value={docFolder}
                    onChange={(e) => setDocFolder(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 font-medium text-amber-700 dark:text-amber-400"
                  >
                    {allAvailableFolders.map((f) => (
                      <option key={f} value={f}>
                        📁 {f}
                      </option>
                    ))}
                  </select>
                </div>

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
                    <option value="MODEL_SPEC">Model & Audio Spec</option>
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
                  S3 Bucket URI or Resource URL
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder={`s3://taskpilot-documents/${project.toLowerCase()}/runbook.pdf or https://wiki.internal/...`}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Summary & Notes *
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

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Database className="w-3 h-3 text-indigo-400" />
                  <span>Bucket: s3://taskpilot-documents</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDoc(null);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition flex items-center space-x-1.5"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{editingDoc ? "Update Document" : "Save to Folder"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
