import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let docMemoryStore: any[] = [];

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

      return NextResponse.json({ documents });
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
    const folder = searchParams.get("folder");
    const project = searchParams.get("project");

    if (folder && project) {
      // Delete all documents in this folder for the project
      try {
        await prisma.projectDocument.deleteMany({
          where: { project, folder },
        });
      } catch (dbErr) {
        console.warn("DB doc folder delete error:", dbErr);
      }
      docMemoryStore = docMemoryStore.filter(
        (d) => !(d.project === project && (d.folder || "General") === folder)
      );
      return NextResponse.json({ success: true, folder, project });
    }

    if (!id) {
      return NextResponse.json({ error: "Document ID or (folder and project) is required." }, { status: 400 });
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
