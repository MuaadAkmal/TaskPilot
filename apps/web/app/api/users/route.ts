import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users - List users or query single user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const clerkId = searchParams.get("clerkId");

    if (email || clerkId) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(clerkId ? [{ clerkId }] : []),
          ],
        },
      });
      return NextResponse.json({ user });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create or update user profile & notification settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clerkId = "user_demo_1",
      email,
      name,
      title,
      projects = ["CMS_VAL_FS", "ASR", "CIAS"],
      role = "ENGINEER",
      receiveEmailAlerts = true,
      alertOnProjects = "ALL",
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const projectsJson = Array.isArray(projects) ? JSON.stringify(projects) : projects;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        clerkId,
        name,
        title,
        projects: projectsJson,
        role,
        receiveEmailAlerts,
        alertOnProjects: typeof alertOnProjects === "string" ? alertOnProjects : JSON.stringify(alertOnProjects),
        updatedAt: new Date(),
      },
      create: {
        clerkId,
        email,
        name,
        title,
        projects: projectsJson,
        role,
        receiveEmailAlerts,
        alertOnProjects: typeof alertOnProjects === "string" ? alertOnProjects : JSON.stringify(alertOnProjects),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to save user profile" }, { status: 500 });
  }
}

// PATCH /api/users - Quick toggle for email notifications
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, receiveEmailAlerts } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        receiveEmailAlerts: Boolean(receiveEmailAlerts),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/users error:", error);
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 });
  }
}
