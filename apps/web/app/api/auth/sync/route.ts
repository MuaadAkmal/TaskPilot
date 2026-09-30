import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "No email associated with account" }, { status: 400 });
    }

    // 1. Check if user exists in our PostgreSQL User / Employee directory
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { clerkId: clerkUser.id }
        ]
      }
    });

    const isAdminUser = email.includes("mdak") || email.startsWith("mdak");

    // 2. If user exists, ensure Clerk ID and Admin roles are synced
    if (dbUser) {
      const targetRole = isAdminUser ? "ADMIN" : dbUser.role;
      if (dbUser.clerkId !== clerkUser.id || (isAdminUser && dbUser.role !== "ADMIN")) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkId: clerkUser.id,
            name: clerkUser.fullName || dbUser.name,
            role: targetRole,
          }
        });
      }

      return NextResponse.json({
        allowed: true,
        user: dbUser,
      });
    }

    // 3. If admin email (mdak), auto-provision as ADMIN even if not pre-seeded
    if (isAdminUser) {
      const newAdmin = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: email,
          name: clerkUser.fullName || "M D A K (Admin)",
          title: "System Administrator",
          role: "ADMIN",
          receiveEmailAlerts: false, // Disabled by default
          projects: JSON.stringify(["CMS_VAL_FS", "ASR", "CIAS", "TSOC", "CDR", "IPDR", "MCX"]),
          alertOnProjects: "ALL",
        }
      });

      return NextResponse.json({
        allowed: true,
        user: newAdmin,
      });
    }

    // 4. User is NOT in the database directory -> Not allowed
    return NextResponse.json({
      allowed: false,
      message: "Your email is not registered in the TaskPilot Employee Directory. Please contact an administrator.",
      email,
    }, { status: 403 });

  } catch (error: any) {
    console.error("Auth sync error:", error);
    return NextResponse.json({ error: error.message || "Authentication sync failed" }, { status: 500 });
  }
}
