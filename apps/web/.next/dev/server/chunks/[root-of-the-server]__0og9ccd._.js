module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/tasks/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$resend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/resend.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const project = searchParams.get("project") || "CMS_VAL_FS";
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = parseInt(searchParams.get("pageSize") || "8", 10);
        const search = searchParams.get("search") || "";
        const tsp = searchParams.get("tsp") || "ALL";
        const lsa = searchParams.get("lsa") || "ALL";
        const sort = searchParams.get("sort") || "resolvedAt_desc";
        // 1. Try fetching from SQLite database via Prisma
        try {
            const whereClause = {
                project: project
            };
            if (tsp && tsp !== "ALL") {
                whereClause.tsp = tsp;
            }
            if (lsa && lsa !== "ALL") {
                whereClause.lsa = lsa;
            }
            if (search && search.trim()) {
                const query = search.toLowerCase();
                whereClause.OR = [
                    {
                        problemDescription: {
                            contains: query
                        }
                    },
                    {
                        solution: {
                            contains: query
                        }
                    },
                    {
                        remarks: {
                            contains: query
                        }
                    },
                    {
                        raisedByName: {
                            contains: query
                        }
                    },
                    {
                        tsp: {
                            contains: query
                        }
                    },
                    {
                        lsa: {
                            contains: query
                        }
                    }
                ];
            }
            // Determine orderBy
            let orderBy = {
                resolvedAt: "desc"
            };
            if (sort === "resolvedAt_asc") orderBy = {
                resolvedAt: "asc"
            };
            else if (sort === "downtime_desc") orderBy = {
                downtimeMinutes: "desc"
            };
            else if (sort === "downtime_asc") orderBy = {
                downtimeMinutes: "asc"
            };
            else if (sort === "tsp_asc") orderBy = {
                tsp: "asc"
            };
            const total = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].taskResolution.count({
                where: whereClause
            });
            const tasks = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].taskResolution.findMany({
                where: whereClause,
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize
            });
            const allMatchingTasks = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].taskResolution.findMany({
                where: whereClause,
                orderBy
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                tasks,
                allMatchingTasks,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize) || 1,
                source: "sqlite"
            });
        } catch (dbErr) {
            console.warn("Prisma query fallback to in-memory store:", dbErr);
        }
        // 2. Fallback to in-memory store if DB query fails
        const all = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["taskStore"].getAll(project);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            tasks: all.slice(0, 8),
            allMatchingTasks: all,
            total: all.length,
            page: 1,
            pageSize: 8,
            totalPages: Math.ceil(all.length / 8) || 1,
            source: "memory_store"
        });
    } catch (error) {
        console.error("GET /api/tasks error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch tasks"
        }, {
            status: 500
        });
    }
}
async function POST(req) {
    try {
        const body = await req.json();
        const { project = "CMS_VAL_FS", tsp, lsa, status = "RESOLVED", problemDescription, solution, remarks, raisedByName = "NOC Team", createdAt, resolvedAt } = body;
        if (!problemDescription || !solution) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Problem description and solution are required"
            }, {
                status: 400
            });
        }
        // Calculate downtime duration in minutes
        let downtimeMinutes = 0;
        const start = createdAt ? new Date(createdAt) : new Date(Date.now() - 45 * 60 * 1000);
        const end = resolvedAt ? new Date(resolvedAt) : new Date();
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            downtimeMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
        }
        let newTask = null;
        // 1. Try persisting to SQLite database via Prisma
        try {
            newTask = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].taskResolution.create({
                data: {
                    project,
                    tsp: tsp || "Airtel",
                    lsa: lsa || "Delhi",
                    status,
                    problemDescription,
                    solution,
                    remarks: remarks || "",
                    downtimeMinutes,
                    raisedByName,
                    createdAt: start,
                    resolvedAt: end
                }
            });
        } catch (dbErr) {
            console.warn("Prisma write fallback to in-memory store:", dbErr);
            newTask = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["taskStore"].create({
                project,
                tsp: tsp || "Airtel",
                lsa: lsa || "Delhi",
                status,
                problemDescription,
                solution,
                remarks: remarks || "",
                downtimeMinutes,
                raisedByName,
                docLinks: [],
                createdAt: start.toISOString(),
                resolvedAt: end.toISOString()
            });
        }
        // 2. Dispatch async email notification
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$resend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendResolutionEmailAlert"])({
            task: {
                id: newTask.id.toString(),
                project: newTask.project,
                tsp: newTask.tsp,
                lsa: newTask.lsa,
                status: newTask.status,
                problemDescription: newTask.problemDescription,
                solution: newTask.solution,
                remarks: newTask.remarks,
                downtimeMinutes: newTask.downtimeMinutes,
                raisedByName: newTask.raisedByName
            }
        }).catch((err)=>console.error("Email notification dispatch error:", err));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            task: newTask
        }, {
            status: 201
        });
    } catch (error) {
        console.error("POST /api/tasks error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to create task"
        }, {
            status: 500
        });
    }
}
async function PUT(req) {
    try {
        const body = await req.json();
        const { id, status, problemDescription, solution, remarks } = body;
        if (!id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Task ID is required for update"
            }, {
                status: 400
            });
        }
        try {
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].taskResolution.update({
                where: {
                    id: Number(id)
                },
                data: {
                    status,
                    problemDescription,
                    solution,
                    remarks,
                    updatedAt: new Date()
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                task: updated
            });
        } catch (dbErr) {
            const updated = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["taskStore"].update(id.toString(), {
                status,
                problemDescription,
                solution,
                remarks
            });
            if (!updated) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Task not found"
                }, {
                    status: 404
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                task: updated
            });
        }
    } catch (error) {
        console.error("PUT /api/tasks error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to update task"
        }, {
            status: 500
        });
    }
}
}),
"[project]/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        "query",
        "error",
        "warn"
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/lib/project-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ASR_NODES",
    ()=>ASR_NODES,
    "ASR_SERVICES",
    ()=>ASR_SERVICES,
    "CIAS_DOMAINS",
    ()=>CIAS_DOMAINS,
    "CIAS_ZONES",
    ()=>CIAS_ZONES,
    "LSAS",
    ()=>LSAS,
    "PROJECTS",
    ()=>PROJECTS,
    "STATUS_OPTIONS",
    ()=>STATUS_OPTIONS,
    "TSPS",
    ()=>TSPS
]);
const TSPS = [
    "Airtel",
    "Jio",
    "Vodafone Idea (Vi)",
    "BSNL",
    "MTNL",
    "Tata Tele"
];
const LSAS = [
    "Delhi",
    "Mumbai",
    "Kolkata",
    "Maharashtra",
    "Gujarat",
    "Andhra Pradesh & Telangana",
    "Karnataka",
    "Tamil Nadu (incl. Chennai)",
    "Kerala",
    "Punjab",
    "Haryana",
    "Uttar Pradesh (East)",
    "Uttar Pradesh (West)",
    "Rajasthan",
    "Madhya Pradesh & Chhattisgarh",
    "West Bengal",
    "Bihar & Jharkhand",
    "Odisha",
    "Assam",
    "North East",
    "Jammu & Kashmir",
    "Himachal Pradesh"
];
const ASR_SERVICES = [
    "Dynamic Route Optimizer",
    "Gateway Failover Broker",
    "BGP Multipath Controller",
    "Edge Telemetry Agent",
    "Traffic Shaper Daemon"
];
const ASR_NODES = [
    "DC-North-Primary",
    "DC-North-Secondary",
    "DC-West-Edge01",
    "DC-South-Core02",
    "Edge-POP-Chennai"
];
const CIAS_DOMAINS = [
    "Identity & Access IAM",
    "Hardware Security Module (HSM)",
    "Firewall & WAF Rules",
    "Audit Log Ingestion",
    "Vulnerability Patching"
];
const CIAS_ZONES = [
    "Production DMZ",
    "Internal Core Backbone",
    "Management Subnet OOB",
    "Secure Vault Zone",
    "Partner Peering Hub"
];
const PROJECTS = [
    {
        code: "CMS_VAL_FS",
        name: "CMS VAL & FS",
        badge: "CMS VAL&FS",
        description: "Centralized Monitoring & Field Services for Telecom Circles",
        color: "bg-indigo-600 text-white",
        fields: {
            primaryFieldLabel: "TSP (Telecom Provider)",
            secondaryFieldLabel: "LSA (Service Circle)",
            primaryOptions: TSPS,
            secondaryOptions: LSAS
        }
    },
    {
        code: "ASR",
        name: "ASR (Auto Service Routing)",
        badge: "ASR",
        description: "Automated Service Routing & Node Escalation",
        color: "bg-emerald-600 text-white",
        fields: {
            primaryFieldLabel: "ASR Service Component",
            secondaryFieldLabel: "Target Infrastructure Node",
            primaryOptions: ASR_SERVICES,
            secondaryOptions: ASR_NODES
        }
    },
    {
        code: "CIAS",
        name: "CIAS (Core Infrastructure)",
        badge: "CIAS",
        description: "Core Infrastructure Audit & Security Services",
        color: "bg-amber-600 text-white",
        fields: {
            primaryFieldLabel: "Security Domain / Module",
            secondaryFieldLabel: "Network Zone / Tier",
            primaryOptions: CIAS_DOMAINS,
            secondaryOptions: CIAS_ZONES
        }
    }
];
const STATUS_OPTIONS = [
    {
        value: "RESOLVED",
        label: "Resolved",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
        value: "IN_PROGRESS",
        label: "In Progress",
        color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
        value: "PENDING_VERIFICATION",
        label: "Pending Verification",
        color: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
        value: "CLOSED",
        label: "Closed",
        color: "bg-slate-100 text-slate-800 border-slate-200"
    }
];
}),
"[project]/lib/resend.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendResolutionEmailAlert",
    ()=>sendResolutionEmailAlert
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/resend/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$project$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/project-config.ts [app-route] (ecmascript)");
;
;
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && !resendApiKey.includes("placeholder") ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Resend"](resendApiKey) : null;
async function sendResolutionEmailAlert({ task, teamEmails }) {
    const projectMeta = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$project$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PROJECTS"].find((p)=>p.code === task.project) || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$project$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PROJECTS"][0];
    const recipients = teamEmails && teamEmails.length > 0 ? teamEmails : [
        "team-alerts@taskpilot.internal"
    ];
    const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 24px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">TaskPilot Incident Resolution Alert</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff;">New resolved entry recorded for <strong>${projectMeta.name}</strong></p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.5;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Ticket ID</td>
            <td style="padding: 6px 0; font-weight: 700; color: #4f46e5;">#${task.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">${projectMeta.fields.primaryFieldLabel}</td>
            <td style="padding: 6px 0; font-weight: 600;">${task.tsp}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">${projectMeta.fields.secondaryFieldLabel}</td>
            <td style="padding: 6px 0; font-weight: 600;">${task.lsa}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Raised By</td>
            <td style="padding: 6px 0;">${task.raisedByName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Downtime Duration</td>
            <td style="padding: 6px 0; font-weight: 600; color: #b45309;">${task.downtimeMinutes ? `${task.downtimeMinutes} mins` : "N/A"}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 14px; margin-bottom: 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase;">Problem Description</h3>
          <p style="margin: 0; color: #0f172a;">${task.problemDescription}</p>
        </div>

        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; margin-bottom: 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase;">Verified Solution Applied</h3>
          <p style="margin: 0; color: #064e3b; font-family: monospace;">${task.solution}</p>
        </div>

        ${task.remarks ? `<div style="background-color: #f1f5f9; padding: 12px; margin-bottom: 20px; border-radius: 6px;">
                <strong style="font-size: 12px; color: #475569;">Remarks / Notes:</strong>
                <p style="margin: 4px 0 0 0; color: #334155; font-size: 13px;">${task.remarks}</p>
              </div>` : ""}

        <div style="text-align: center; margin-top: 24px;">
          <a href="http://localhost:3005?project=${task.project}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block;">
            Open in TaskPilot Dashboard
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; color: #94a3b8; font-size: 11px;">
        Sent automatically by TaskPilot Operational Hub. Project: ${projectMeta.name}
      </div>
    </div>
  `;
    if (!resend) {
        console.log(`[Resend Mock Simulation] Alert queued for ${recipients.join(", ")}: Ticket #${task.id} (${task.tsp} - ${task.lsa})`);
        return {
            success: true,
            simulated: true
        };
    }
    try {
        const fromAddress = process.env.RESEND_FROM_EMAIL || "TaskPilot Alerts <onboarding@resend.dev>";
        const response = await resend.emails.send({
            from: fromAddress,
            to: recipients,
            subject: `[TaskPilot - ${projectMeta.badge}] Incident #${task.id} Resolved (${task.tsp} / ${task.lsa})`,
            html: emailHtml
        });
        return {
            success: true,
            response
        };
    } catch (error) {
        console.error("[Resend Error]: Failed to send notification email", error);
        return {
            success: false,
            error
        };
    }
}
}),
"[project]/lib/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "taskStore",
    ()=>taskStore
]);
// Initial realistic dataset for CMS VAL&FS and other projects
const INITIAL_TASKS = [
    {
        id: "TS-1001",
        project: "CMS_VAL_FS",
        tsp: "Airtel",
        lsa: "Delhi",
        status: "RESOLVED",
        problemDescription: "High packet loss (>45%) and latency spikes observed on primary peering interface Gi0/0/3 connecting to Noida Core Ring.",
        solution: "Performed OTDR loop test on the fiber line. Identified optical attenuation at patch bay ODF-2. Cleaned LC connectors and reseated SFP-10G-LR transceiver. Interface link stabilized with 0% packet drop.",
        remarks: "Recommend replacing the patch cord during the next scheduled maintenance window.",
        createdAt: "2026-09-28T08:15:00Z",
        resolvedAt: "2026-09-28T09:05:00Z",
        downtimeMinutes: 50,
        raisedByName: "Sarah Jenkins (NOC Lead)",
        docLinks: [
            "https://wiki.novasmart.internal/sops/fiber-otdr-guide"
        ],
        updatedAt: "2026-09-28T09:05:00Z"
    },
    {
        id: "TS-1002",
        project: "CMS_VAL_FS",
        tsp: "Jio",
        lsa: "Mumbai",
        status: "RESOLVED",
        problemDescription: "BGP neighbor adjacency flapping continuously every 90 seconds with AS65020 under high peak subscriber load.",
        solution: "Inspected BGP debug logs; hold timer expired due to CPU throttling under DDoS traffic. Configured BGP Control Plane Policing (CoPP) and adjusted hold timer from 90s to 180s.",
        remarks: "Applied coordinated policy across peer edge routers BKC-PE-01 and BKC-PE-02.",
        createdAt: "2026-09-28T11:30:00Z",
        resolvedAt: "2026-09-28T12:45:00Z",
        downtimeMinutes: 75,
        raisedByName: "Rahul Sharma (Sr. Network Specialist)",
        docLinks: [
            "https://wiki.novasmart.internal/sops/bgp-copp-hardening"
        ],
        updatedAt: "2026-09-28T12:45:00Z"
    },
    {
        id: "TS-1003",
        project: "CMS_VAL_FS",
        tsp: "Vodafone Idea (Vi)",
        lsa: "Karnataka",
        status: "RESOLVED",
        problemDescription: "Multiple cell site gateways in Bangalore East failing radius authentication for operational L2TP tunnels.",
        solution: "Discovered expired certificate on secondary FreeRADIUS server. Regenerated SSL certificate and re-synced cluster with primary authentication daemon.",
        remarks: "Automated alert hook created to notify NOC 30 days before future cert expiries.",
        createdAt: "2026-09-28T14:00:00Z",
        resolvedAt: "2026-09-28T14:40:00Z",
        downtimeMinutes: 40,
        raisedByName: "Ananya Iyer (Infra Eng)",
        docLinks: [],
        updatedAt: "2026-09-28T14:40:00Z"
    },
    {
        id: "TS-1004",
        project: "CMS_VAL_FS",
        tsp: "BSNL",
        lsa: "Kolkata",
        status: "RESOLVED",
        problemDescription: "DWDM transponder failure causing 100G transmission circuit down between Howrah and Salt Lake hub.",
        solution: "Dispatched local field team. Swapped faulty client-side 100G CFP2 module on Chassis-4 Slot-2. Realigned optical power to -3.5 dBm.",
        remarks: "Faulty CFP2 sent for RMA with vendor.",
        createdAt: "2026-09-27T18:20:00Z",
        resolvedAt: "2026-09-27T20:10:00Z",
        downtimeMinutes: 110,
        raisedByName: "Subhashis Roy (Field Engineer)",
        docLinks: [],
        updatedAt: "2026-09-27T20:10:00Z"
    },
    {
        id: "TS-1005",
        project: "CMS_VAL_FS",
        tsp: "Airtel",
        lsa: "Maharashtra",
        status: "RESOLVED",
        problemDescription: "IPSec VPN tunnel between Pune regional office and data center failed following upstream ISP gateway reboot.",
        solution: "Cleared dead IKE security association (SA) states and force-triggered phase 1 / phase 2 renegotiation with crypto map update.",
        remarks: "Enabled DPD (Dead Peer Detection) interval at 10 seconds to auto-recover in future.",
        createdAt: "2026-09-27T09:10:00Z",
        resolvedAt: "2026-09-27T09:35:00Z",
        downtimeMinutes: 25,
        raisedByName: "Sarah Jenkins (NOC Lead)",
        docLinks: [],
        updatedAt: "2026-09-27T09:35:00Z"
    },
    {
        id: "TS-1006",
        project: "CMS_VAL_FS",
        tsp: "Tata Tele",
        lsa: "Gujarat",
        status: "RESOLVED",
        problemDescription: "NTP synchronization failure across Ahmedabad aggregation switches leading to syslog timestamp skew.",
        solution: "Reconfigured primary and secondary NTP sources to internal stratum-1 GPS NTP server (10.200.1.50) and removed stale public pool address.",
        remarks: "All 18 aggregation switches confirmed in sync stratum 2.",
        createdAt: "2026-09-26T16:00:00Z",
        resolvedAt: "2026-09-26T16:20:00Z",
        downtimeMinutes: 20,
        raisedByName: "Vikas Patel (SysAdmin)",
        docLinks: [],
        updatedAt: "2026-09-26T16:20:00Z"
    },
    {
        id: "TS-1007",
        project: "CMS_VAL_FS",
        tsp: "Jio",
        lsa: "Andhra Pradesh & Telangana",
        status: "RESOLVED",
        problemDescription: "Voice over LTE (VoLTE) SIP registration errors reported from Hyderabad Cyberabad node.",
        solution: "P-CSCF load balancer session table overflow. Increased connection session limit to 500k and flushed hung TCP half-open states.",
        remarks: "Monitoring SIP INVITE error rates; stabilized below 0.01%.",
        createdAt: "2026-09-26T11:00:00Z",
        resolvedAt: "2026-09-26T12:30:00Z",
        downtimeMinutes: 90,
        raisedByName: "K. Venkatesh (VoIP Ops)",
        docLinks: [],
        updatedAt: "2026-09-26T12:30:00Z"
    },
    {
        id: "TS-1008",
        project: "CMS_VAL_FS",
        tsp: "MTNL",
        lsa: "Delhi",
        status: "RESOLVED",
        problemDescription: "SNMP polling timeout from Cacti & Zabbix monitoring server for Connaught Place core switch stack.",
        solution: "ACL 110 on management interface was missing permit statement for the new monitoring subnet 10.50.22.0/24. Added permit ACE and verified SNMP v3 walkthrough.",
        remarks: "Alarms cleared in monitoring dashboard.",
        createdAt: "2026-09-25T14:15:00Z",
        resolvedAt: "2026-09-25T14:35:00Z",
        downtimeMinutes: 20,
        raisedByName: "Sarah Jenkins (NOC Lead)",
        docLinks: [],
        updatedAt: "2026-09-25T14:35:00Z"
    },
    {
        id: "TS-1009",
        project: "CMS_VAL_FS",
        tsp: "Airtel",
        lsa: "Tamil Nadu (incl. Chennai)",
        status: "RESOLVED",
        problemDescription: "Submarine cable landing station interconnect reporting intermittent CRC errors on 40G link.",
        solution: "Cleaned MPO-12 fiber connector with click-cleaner tool. Replaced worn jumper cord and verified zero CRC increment over 2-hour soaking test.",
        remarks: "Scheduled monthly physical inspection for all MPO jumpers.",
        createdAt: "2026-09-25T10:00:00Z",
        resolvedAt: "2026-09-25T11:15:00Z",
        downtimeMinutes: 75,
        raisedByName: "M. Ramanathan (Optical Lead)",
        docLinks: [],
        updatedAt: "2026-09-25T11:15:00Z"
    },
    {
        id: "TS-2001",
        project: "ASR",
        tsp: "Jio",
        lsa: "Delhi",
        status: "RESOLVED",
        problemDescription: "Automated Service Routing failed to execute automatic rerouting on trunk failure.",
        solution: "Fixed route orchestration policy trigger in ASR engine. Upgraded decision worker thread pool to handle 50 concurrent link failure events.",
        remarks: "ASR failover tested in staging.",
        createdAt: "2026-09-28T09:00:00Z",
        resolvedAt: "2026-09-28T09:45:00Z",
        downtimeMinutes: 45,
        raisedByName: "Alex Chen (ASR Dev)",
        docLinks: [],
        updatedAt: "2026-09-28T09:45:00Z"
    }
];
if (!globalThis.__taskStore) {
    globalThis.__taskStore = [
        ...INITIAL_TASKS
    ];
}
const taskStore = {
    getAll: (project)=>{
        const list = globalThis.__taskStore || [];
        if (project) {
            return list.filter((t)=>t.project === project);
        }
        return list;
    },
    getById: (id)=>{
        return (globalThis.__taskStore || []).find((t)=>t.id === id);
    },
    create: (task)=>{
        const id = `TS-${Math.floor(1000 + Math.random() * 9000)}`;
        const now = new Date().toISOString();
        const newTask = {
            ...task,
            id,
            updatedAt: now
        };
        if (!globalThis.__taskStore) {
            globalThis.__taskStore = [];
        }
        globalThis.__taskStore.unshift(newTask);
        return newTask;
    },
    update: (id, updates)=>{
        const list = globalThis.__taskStore || [];
        const index = list.findIndex((t)=>t.id === id);
        if (index === -1) return null;
        const existing = list[index];
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        list[index] = updated;
        return updated;
    },
    delete: (id)=>{
        const list = globalThis.__taskStore || [];
        const index = list.findIndex((t)=>t.id === id);
        if (index === -1) return false;
        list.splice(index, 1);
        return true;
    }
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0og9ccd._.js.map