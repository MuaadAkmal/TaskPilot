"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ProjectCode, PROJECTS, TSPS, LSAS } from "@/lib/project-config";
import { Bot, Send, Sparkles, BookOpen, ShieldCheck, Zap, History, FileText } from "lucide-react";
import { marked } from "marked";

function AgentStudioContent() {
  const searchParams = useSearchParams();
  const currentProject = (searchParams.get("project") as ProjectCode) || "CMS_VAL_FS";
  const activeProjectMeta = PROJECTS.find((p) => p.code === currentProject) || PROJECTS[0];

  const [input, setInput] = useState("");
  const [tsp, setTsp] = useState("");
  const [lsa, setLsa] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "agent"; text: string; matches?: any[] }>>([
    {
      sender: "agent",
      text: `### 🤖 Welcome to TaskPilot Diagnostic Studio for **${activeProjectMeta.name}**\n\nI am your dedicated **Google ADK Diagnostic Agent**. My knowledge is strictly isolated to **${activeProjectMeta.name}**.\n\n**How I can assist you:**\n- 🔍 **Incident Matching**: Describe symptoms (e.g. *"Optical loss on BSNL Kolkata"* or *"BGP hold timer expired"*) to retrieve past verified solutions.\n- 📋 **Step-by-Step Diagnostic Tree**: I provide targeted commands and troubleshooting sequences.\n- 💡 **SOP & Documentation Lookup**: Ask about standard operating procedures and best practices for this project.`,
    },
  ]);

  const handleQuery = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          project: currentProject,
          tsp: tsp || undefined,
          lsa: lsa || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: data.answer,
            matches: data.matches,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: "Encountered an issue searching the knowledge base.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "Failed to connect to the agent reasoning service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const PROMPT_SUGGESTIONS = [
    `How did we resolve optical power loss on Airtel in Delhi?`,
    `What is the troubleshooting procedure for BGP neighbor flap in Mumbai?`,
    `Cell site gateway radius authentication failure on Vi in Karnataka`,
    `DWDM 100G transponder CFP2 replacement steps`,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header currentProject={currentProject} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Studio Title */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Agent Diagnostic Studio</span>
                <span className="text-xs px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                  {activeProjectMeta.badge} Scoped
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Interactive diagnostic reasoning with historical knowledge retrieval
              </p>
            </div>
          </div>
        </div>

        {/* Studio Main Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[580px]">
          {/* Left 3 Cols: Chat & Diagnostic Reasoning */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-3 text-xs">
              <span className="font-semibold text-slate-600 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Knowledge Scope:</span>
              </span>
              <select
                value={tsp}
                onChange={(e) => setTsp(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="">Any TSP</option>
                {TSPS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={lsa}
                onChange={(e) => setLsa(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="">Any LSA Circle</option>
                {LSAS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "agent" && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`text-xs p-4 rounded-2xl max-w-[85%] ${
                      m.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-sm font-medium"
                        : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs markdown-content leading-relaxed"
                    }`}
                    dangerouslySetInnerHTML={{ __html: marked.parse(m.text) }}
                  />

                  {m.sender === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold shadow-xs">
                      U
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-xs text-indigo-700 bg-indigo-50/60 p-4 rounded-2xl rounded-tl-none border border-indigo-200 w-fit">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Reasoning over {activeProjectMeta.name} records and synthesizing diagnosis...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuery();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Describe symptoms or ask how a problem was fixed in ${activeProjectMeta.name}...`}
                className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center space-x-2"
              >
                <span>Ask Agent</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right 1 Col: Quick Prompt Templates & Project SOPs */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Diagnostic Queries</span>
              </h3>
              <div className="space-y-2">
                {PROMPT_SUGGESTIONS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuery(p)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-[11px] text-slate-700 transition leading-snug"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Project Knowledge Base</span>
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Knowledge scoped to <strong>{activeProjectMeta.name}</strong>.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>OTDR Fiber Testing SOP</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Indexed</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>BGP CoPP Hardening Guide</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Indexed</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>DWDM CFP2 Module Replacement</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Indexed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AgentStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Agent Studio...</div>}>
      <AgentStudioContent />
    </Suspense>
  );
}
