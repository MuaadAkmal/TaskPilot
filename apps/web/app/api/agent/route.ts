import { NextRequest, NextResponse } from "next/server";
import { taskStore } from "@/lib/store";
import { ProjectCode } from "@/lib/project-config";

export async function POST(req: NextRequest) {
  try {
    const { query, project = "CMS_VAL_FS", tsp, lsa } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query cannot be empty" }, { status: 400 });
    }

    // 1. Fetch historical tasks strictly scoped to this project
    const allTasks = taskStore.getAll(project as ProjectCode);
    const searchTerms = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    let candidateMatches = allTasks.filter((t) => {
      if (tsp && tsp !== "ALL" && t.tsp !== tsp) return false;
      if (lsa && lsa !== "ALL" && t.lsa !== lsa) return false;

      const searchable = `${t.problemDescription} ${t.solution} ${t.remarks || ""} ${t.tsp} ${t.lsa}`.toLowerCase();
      return searchTerms.some((term: string) => searchable.includes(term));
    });

    if (candidateMatches.length === 0 && (tsp || lsa)) {
      // Fallback search across all TSPs/LSAs within this project
      candidateMatches = allTasks.filter((t) => {
        const searchable = `${t.problemDescription} ${t.solution} ${t.remarks || ""}`.toLowerCase();
        return searchTerms.some((term: string) => searchable.includes(term));
      });
    }

    const matches = candidateMatches.slice(0, 4);

    // 2. Synthesize expert diagnostic answer
    let answerMarkdown = "";
    if (matches.length > 0) {
      const top = matches[0];
      answerMarkdown = `### 🔍 Verified Historical Matches Found for **${project}**\n\n` +
        `**Primary Reference Case: [Ticket #${top.id}]**\n` +
        `- **TSP**: \`${top.tsp}\` | **LSA**: \`${top.lsa}\`\n` +
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
        `3. If confirmed resolved, you can immediately log the record using the submission form or ask me to draft it!`;
    } else {
      answerMarkdown = `### ℹ️ No Direct Historical Match in **${project}**\n\n` +
        `I searched all recorded resolution entries for: *"${query}"*` +
        (tsp ? ` for TSP \`${tsp}\`` : "") +
        (lsa ? ` in LSA \`${lsa}\`` : "") +
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
