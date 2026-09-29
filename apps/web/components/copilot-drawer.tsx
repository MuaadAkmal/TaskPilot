"use client";

import React, { useState } from "react";
import { ProjectCode, TSPS, LSAS } from "@/lib/project-config";
import { Bot, X, Send, Sparkles, MessageSquare, ChevronRight, CheckCircle2 } from "lucide-react";
import { marked } from "marked";

interface CopilotDrawerProps {
  project: ProjectCode;
  onRefreshTasks?: () => void;
}

interface Message {
  sender: "user" | "agent";
  text: string;
  matches?: any[];
}

export function CopilotDrawer({ project, onRefreshTasks }: CopilotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [tsp, setTsp] = useState("");
  const [lsa, setLsa] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "agent",
      text: `Hello! I am your **TaskPilot Copilot** for **${project}**.\n\nAsk me about an issue you are troubleshooting (e.g. *"Packet drops on Airtel in Delhi"* or *"BGP timeout"*). I will match historical resolutions in this project and guide your fix!`,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          project,
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
            text: "Sorry, I encountered an error while searching resolution records.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "Network error connecting to Agent service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center space-x-2.5 transition transform hover:scale-105 z-40"
        >
          <Bot className="w-5 h-5" />
          <span className="text-xs font-bold tracking-tight">Copilot Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs flex items-center space-x-1.5">
                  <span>TaskPilot Copilot</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                    {project}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Isolated diagnostic Q&A & historical lookup</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scope Filters */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 text-[11px]">
            <span className="text-slate-500 font-medium">Filter:</span>
            <select
              value={tsp}
              onChange={(e) => setTsp(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 text-[11px] focus:outline-none"
            >
              <option value="">Any TSP</option>
              {TSPS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={lsa}
              onChange={(e) => setLsa(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 text-[11px] focus:outline-none"
            >
              <option value="">Any LSA</option>
              {LSAS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "agent" && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`text-xs p-3.5 rounded-2xl max-w-[85%] ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-sm font-medium"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200/90 shadow-xs markdown-content"
                  }`}
                  dangerouslySetInnerHTML={{ __html: marked.parse(m.text) }}
                />

                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
                    U
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 w-fit">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Searching {project} records & synthesizing solution...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask issue or symptom in ${project}...`}
              className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
