import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let docMemoryStore: any[] = [
  {
    id: "doc-cias-1",
    project: "CIAS",
    title: "CIAS Core Network Topology & WAF Architecture",
    category: "ARCHITECTURE",
    content: "Detailed diagram and IP routing matrix for CIAS firewall perimeter and IPS gateways.",
    fileUrl: "https://docs.internal/cias/network-topology-v2.pdf",
    version: "2.1.0",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc-cias-2",
    project: "CIAS",
    title: "Zero-Trust Access Token Rotation SOP",
    category: "SOP",
    content: "Step-by-step standard operating procedure for emergency credential reset and SSL revocation.",
    fileUrl: "https://wiki.internal/cias/sop/token-rotation",
    version: "1.4.0",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc-asr-1",
    project: "ASR",
    title: "ASR Speech-to-Text Pipeline Failover Runbook",
    category: "TROUBLESHOOTING_GUIDE",
    content: "Runbook for node recovery when ASR transcriber latency exceeds 1500ms threshold.",
    fileUrl: "https://wiki.internal/asr/runbooks/failover",
    version: "1.0.2",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project = searchParams.get("project") || "CIAS";

    try {
      const documents = await prisma.projectDocument.findMany({
        where: { project },
        orderBy: { createdAt: "desc" },
      });

      if (documents.length > 0) {
        return NextResponse.json({ documents });
      }
    } catch (dbErr) {
      console.warn("DB doc query error, falling back to memory:", dbErr);
    }

    const filtered = docMemoryStore.filter((d) => d.project === project);
    return NextResponse.json({ documents: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, title, category, content, fileUrl, version } = body;

    if (!project || !title || !content) {
      return NextResponse.json({ error: "Project, title, and description/content are required." }, { status: 400 });
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      project,
      title,
      category: category || "SOP",
      content,
      fileUrl: fileUrl || null,
      version: version || "1.0.0",
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await prisma.projectDocument.create({
        data: {
          project,
          title,
          category: category || "SOP",
          content,
          fileUrl: fileUrl || null,
          version: version || "1.0.0",
        },
      });
      return NextResponse.json({ document: created }, { status: 201 });
    } catch (dbErr) {
      console.warn("DB doc insert error, saving to memory fallback:", dbErr);
      docMemoryStore.unshift(newDoc);
      return NextResponse.json({ document: newDoc }, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create document" }, { status: 500 });
  }
}
