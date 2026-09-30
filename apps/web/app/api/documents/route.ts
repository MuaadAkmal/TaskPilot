import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let docMemoryStore: any[] = [
  {
    id: "doc-cms-1",
    project: "CMS",
    title: "Central Monitoring System Standard Operating Procedure",
    category: "SOP",
    content: "NOC escalation protocols and circuit alarm triage matrix across telecom circles.",
    fileUrl: "https://wiki.internal/cms/sop-v1",
    version: "1.2.0",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc-cdr-1",
    project: "CDR",
    title: "CDR Ingestion Stream Architecture & Mediation Rules",
    category: "ARCHITECTURE",
    content: "Parsing schemas, carrier file delivery timers, and mediation queue retention parameters.",
    fileUrl: "https://wiki.internal/cdr/mediation-architecture",
    version: "2.0.1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc-ipdr-1",
    project: "IPDR",
    title: "IPDR Streaming & Packet Flow Verification Guide",
    category: "TROUBLESHOOTING_GUIDE",
    content: "Step-by-step diagnostic guide for IPDR collector packet loss and timestamp synchronization.",
    fileUrl: "https://wiki.internal/ipdr/packet-diagnostics",
    version: "1.1.0",
    createdAt: new Date().toISOString(),
  },
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
    id: "doc-mcx-1",
    project: "MCX",
    title: "MCX Floor Control Server & PTT Gateway Configuration",
    category: "SOP",
    content: "Mission Critical Push-to-Talk server parameters and multicast cluster redundancy guide.",
    fileUrl: "https://wiki.internal/mcx/ptt-gateway",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc-tsoc-1",
    project: "TSOC",
    title: "TSOC SS7 & Diameter Threat Response Playbook",
    category: "TROUBLESHOOTING_GUIDE",
    content: "Immediate containment and perimeter ACL rule injection runbook for signaling attack alerts.",
    fileUrl: "https://wiki.internal/tsoc/signaling-playbook",
    version: "3.2.0",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc-asr-1",
    project: "ASR",
    title: "Automatic Speech Recognition Pipeline Failover Runbook",
    category: "TROUBLESHOOTING_GUIDE",
    content: "Runbook for GPU node recovery and realtime speech acoustic model inference failover.",
    fileUrl: "https://wiki.internal/asr/runbooks/failover",
    version: "1.0.2",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawProject = searchParams.get("project") || "CMS";
    const folder = searchParams.get("folder");
    const project = rawProject === "CMS_VAL_FS" ? "CMS" : rawProject;

    try {
      const whereClause: any = {
        project: { in: project === "CMS" ? ["CMS", "CMS_VAL_FS"] : [project] },
      };
      if (folder && folder !== "ALL") {
        whereClause.folder = folder;
      }

      const documents = await prisma.projectDocument.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });

      if (documents.length > 0) {
        return NextResponse.json({ documents });
      }
    } catch (dbErr) {
      console.warn("DB doc query error, falling back to memory:", dbErr);
    }

    const filtered = docMemoryStore.filter((d) => {
      const matchProject = project === "CMS" ? d.project === "CMS" || d.project === "CMS_VAL_FS" : d.project === project;
      if (!matchProject) return false;
      if (folder && folder !== "ALL") return d.folder === folder;
      return true;
    });

    return NextResponse.json({ documents: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, title, category, folder, content, fileUrl, fileSize, fileType, version } = body;

    if (!project || !title || !content) {
      return NextResponse.json({ error: "Project, title, and description/content are required." }, { status: 400 });
    }

    const targetProject = project === "CMS_VAL_FS" ? "CMS" : project;
    const assignedFolder = folder?.trim() || "General";

    const newDoc = {
      id: `doc-${Date.now()}`,
      project: targetProject,
      title,
      category: category || "SOP",
      folder: assignedFolder,
      content,
      fileUrl: fileUrl || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      version: version || "1.0.0",
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await prisma.projectDocument.create({
        data: {
          project: targetProject,
          title,
          category: category || "SOP",
          folder: assignedFolder,
          content,
          fileUrl: fileUrl || null,
          fileSize: fileSize || null,
          fileType: fileType || null,
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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, category, folder, content, fileUrl, fileSize, fileType, version } = body;

    if (!id || !title || !content) {
      return NextResponse.json({ error: "Document ID, title, and content are required." }, { status: 400 });
    }

    const assignedFolder = folder?.trim() || "General";

    try {
      const updated = await prisma.projectDocument.update({
        where: { id },
        data: {
          title,
          category: category || "SOP",
          folder: assignedFolder,
          content,
          fileUrl: fileUrl !== undefined ? fileUrl : undefined,
          fileSize: fileSize !== undefined ? fileSize : undefined,
          fileType: fileType !== undefined ? fileType : undefined,
          version: version || "1.0.0",
        },
      });
      return NextResponse.json({ document: updated });
    } catch (dbErr) {
      console.warn("DB doc update error, updating in memory fallback:", dbErr);
      const idx = docMemoryStore.findIndex((d) => d.id === id);
      if (idx !== -1) {
        docMemoryStore[idx] = {
          ...docMemoryStore[idx],
          title,
          category: category || docMemoryStore[idx].category,
          folder: assignedFolder,
          content,
          fileUrl: fileUrl !== undefined ? fileUrl : docMemoryStore[idx].fileUrl,
          fileSize: fileSize !== undefined ? fileSize : docMemoryStore[idx].fileSize,
          fileType: fileType !== undefined ? fileType : docMemoryStore[idx].fileType,
          version: version || docMemoryStore[idx].version,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json({ document: docMemoryStore[idx] });
      }
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    try {
      await prisma.projectDocument.delete({
        where: { id },
      });
    } catch (dbErr) {
      console.warn("DB doc delete error, removing from memory store:", dbErr);
    }

    docMemoryStore = docMemoryStore.filter((d) => d.id !== id);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete document" }, { status: 500 });
  }
}
