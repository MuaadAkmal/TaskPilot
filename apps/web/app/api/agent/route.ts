import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskStore, MockTask } from "@/lib/store";
import { ProjectCode } from "@/lib/project-config";

export async function POST(req: NextRequest) {
  try {
    const { query, project = "CMS", tsp, lsa, chat_history = [] } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query cannot be empty" }, { status: 400 });
    }

    const agentServiceUrl = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || "http://localhost:8000";

    // 1. Attempt to delegate to Python LangChain microservice if reachable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const agentRes = await fetch(`${agentServiceUrl}/agent/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          project,
          tsp,
          lsa,
          chat_history,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        return NextResponse.json(agentData);
      }
    } catch (microserviceErr) {
      // Fall through to live database & knowledge engine
    }

    // 2. Fetch tasks from Prisma PostgreSQL / SQLite database with project scope
    const projectFilter =
      project === "CMS" || project === "CMS_VAL_FS"
        ? { in: ["CMS", "CMS_VAL_FS"] }
        : project;

    let dbTasks: MockTask[] = [];

    try {
      const records = await prisma.taskResolution.findMany({
        where: {
          project: projectFilter,
        },
        orderBy: { resolvedAt: "desc" },
      });

      dbTasks = records.map((t) => ({
        id: t.id.toString(),
        project: t.project as any,
        tsp: t.tsp,
        lsa: t.lsa,
        status: t.status as any,
        raisedByName: t.raisedByName,
        createdByName: t.createdByName || null,
        createdByEmail: t.createdByEmail || null,
        problemDescription: t.problemDescription,
        solution: t.solution,
        remarks: t.remarks,
        createdAt: t.createdAt.toISOString(),
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
        downtimeMinutes: t.downtimeMinutes || 0,
        docLinks: [],
        updatedAt: t.updatedAt.toISOString(),
      }));
    } catch (dbErr) {
      // Fallback to memory store if database is offline
      dbTasks = taskStore.getAll(project as ProjectCode);
    }

    if (dbTasks.length === 0) {
      dbTasks = taskStore.getAll(project as ProjectCode);
    }

    // Search historical records scoped strictly to this project
    const searchTerms = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    let candidateMatches = dbTasks.filter((t) => {
      if (tsp && tsp !== "ALL" && t.tsp.toLowerCase() !== tsp.toLowerCase()) return false;
      if (lsa && lsa !== "ALL" && t.lsa.toLowerCase() !== lsa.toLowerCase()) return false;

      const searchable = `${t.problemDescription} ${t.solution} ${t.remarks || ""} ${t.tsp} ${t.lsa} ${t.raisedByName}`.toLowerCase();
      return searchTerms.some((term: string) => searchable.includes(term));
    });

    if (candidateMatches.length === 0 && (tsp || lsa)) {
      candidateMatches = dbTasks.filter((t) => {
        const searchable = `${t.problemDescription} ${t.solution} ${t.remarks || ""} ${t.raisedByName}`.toLowerCase();
        return searchTerms.some((term: string) => searchable.includes(term));
      });
    }

    const matches = candidateMatches.slice(0, 5);

    let answerMarkdown = "";
    if (matches.length > 0) {
      const top = matches[0];
      answerMarkdown = `### 🔍 Verified Historical Matches Found for **${project}**\n\n` +
        `**Primary Reference Case: [Ticket #${top.id}]**\n` +
        `- **Scope**: \`${top.tsp}\` in \`${top.lsa}\`\n` +
        `- **Reported By**: ${top.raisedByName} (Downtime: ${top.downtimeMinutes ? `${top.downtimeMinutes}m` : 'N/A'})\n\n` +
        `#### 🛠️ Solution Applied Previously:\n` +
        `> ${top.solution}\n\n`;

      if (top.remarks) {
        answerMarkdown += `**Important Engineering Notes/Remarks:**\n*${top.remarks}*\n\n`;
      }

      if (matches.length > 1) {
        answerMarkdown += `#### 📋 Correlated Incidents in ${project}:\n`;
        matches.slice(1).forEach((m) => {
          answerMarkdown += `- **Ticket #${m.id}** (${m.tsp} - ${m.lsa}): *${m.problemDescription.slice(0, 90)}...*\n` +
            `  - *Fix Summary*: ${m.solution.slice(0, 110)}...\n`;
        });
        answerMarkdown += `\n`;
      }

      answerMarkdown += `#### 💡 Recommended Immediate Action Steps:\n` +
        `1. Inspect physical / link layer indicators matching the **Ticket #${top.id}** symptoms.\n` +
        `2. Apply the verified remediation steps above.\n` +
        `3. If confirmed resolved, you can immediately log the record using the submission form!`;
    } else {
      answerMarkdown = `### ℹ️ No Direct Historical Match in **${project}**\n\n` +
        `I searched all recorded resolution entries for: *"${query}"*` +
        (tsp ? ` for \`${tsp}\`` : "") +
        (lsa ? ` in \`${lsa}\`` : "") +
        `.\n\n` +
        `**Recommended Standard Diagnostic Steps:**\n` +
        `1. Check node/interface error counters (CRC, drops, flap timers).\n` +
        `2. Verify whether peer upstream gateways or BGP/MPLS neighbors experienced reboots.\n` +
        `3. Once you isolate and resolve this issue, **record it on the left panel** so your team has instant reference next time!`;
    }

    return NextResponse.json({
      answer: answerMarkdown,
      matches,
      project,
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
