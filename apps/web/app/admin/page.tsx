"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { PROJECTS, ProjectCode } from "@/lib/project-config";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  Briefcase,
  Mail,
  UserCheck,
  Building,
  KeyRound,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface DBUser {
  id: string;
  clerkId: string | null;
  email: string;
  name: string | null;
  employeeId: string | null;
  pbx: string | null;
  title: string | null;
  role: "ADMIN" | "TEAM_LEAD" | "ENGINEER";
  projects: string;
  receiveEmailAlerts: boolean;
  alertOnProjects: string;
  createdAt: string;
}

export default function AdminPanelPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<DBUser | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for creating / editing user
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formPbx, setFormPbx] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "TEAM_LEAD" | "ENGINEER">("ENGINEER");
  const [formAlerts, setFormAlerts] = useState(false);
  const [formProjects, setFormProjects] = useState<string[]>([]);

  // 1. Check Admin Authorization
  useEffect(() => {
    async function verifyAdmin() {
      if (!clerkLoaded) return;
      if (!clerkUser) {
        router.push("/sign-in");
        return;
      }

      try {
        const res = await fetch("/api/auth/sync");
        const data = await res.json();

        if (data.allowed && data.user && data.user.role === "ADMIN") {
          setIsAdmin(true);
          fetchUsers();
        } else {
          toast.error("Access denied. Admin privileges required.");
          router.push("/");
        }
      } catch (err) {
        toast.error("Authorization check failed.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    verifyAdmin();
  }, [clerkLoaded, clerkUser, router]);

  // 2. Load all users from DB
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      toast.error("Failed to load user directory");
    }
  };

  const handleOpenEdit = (user: DBUser) => {
    setSelectedUserForEdit(user);
    setFormEmail(user.email);
    setFormName(user.name || "");
    setFormEmployeeId(user.employeeId || "");
    setFormPbx(user.pbx || "");
    setFormTitle(user.title || "");
    setFormRole(user.role);
    setFormAlerts(user.receiveEmailAlerts);
    try {
      setFormProjects(JSON.parse(user.projects || "[]"));
    } catch {
      setFormProjects([]);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUserForEdit(null);
    setFormEmail("");
    setFormName("");
    setFormEmployeeId("");
    setFormPbx("");
    setFormTitle("Operations Specialist");
    setFormRole("ENGINEER");
    setFormAlerts(false);
    setFormProjects(PROJECTS.map((p) => p.code));
    setIsNewUserModalOpen(true);
  };

  const toggleProjectAssignment = (pCode: string) => {
    setFormProjects((prev) =>
      prev.includes(pCode) ? prev.filter((c) => c !== pCode) : [...prev, pCode]
    );
  };

  const selectAllProjects = () => {
    setFormProjects(PROJECTS.map((p) => p.code));
  };

  const clearAllProjects = () => {
    setFormProjects([]);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUserForEdit?.id,
          email: formEmail.trim().toLowerCase(),
          name: formName.trim() || null,
          employeeId: formEmployeeId.trim() || null,
          pbx: formPbx.trim() || null,
          title: formTitle.trim() || null,
          role: formRole,
          receiveEmailAlerts: formAlerts,
          projects: formProjects,
          alertOnProjects: "ALL",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          selectedUserForEdit
            ? `Updated user ${data.user.email}`
            : `Created user ${data.user.email}`
        );
        setSelectedUserForEdit(null);
        setIsNewUserModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to save user");
      }
    } catch (err) {
      toast.error("Network error saving user");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAlertQuick = async (user: DBUser) => {
    const nextVal = !user.receiveEmailAlerts;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          receiveEmailAlerts: nextVal,
        }),
      });

      if (res.ok) {
        toast.success(
          nextVal
            ? `Alerts enabled for ${user.email}`
            : `Alerts disabled for ${user.email}`
        );
        fetchUsers();
      }
    } catch (err) {
      toast.error("Failed to toggle alert status");
    }
  };

  const handleDeleteUser = async (user: DBUser) => {
    if (!confirm(`Are you sure you want to remove user "${user.email}" from the directory?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Removed user ${user.email}`);
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (err) {
      toast.error("Network error deleting user");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (u.name || "").toLowerCase();
      const email = u.email.toLowerCase();
      const empId = (u.employeeId || "").toLowerCase();
      const title = (u.title || "").toLowerCase();
      const pbx = (u.pbx || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        empId.includes(q) ||
        title.includes(q) ||
        pbx.includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header currentProject={"CMS_VAL_FS" as ProjectCode} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Administration & User Access</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold">
                    Admin Portal
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage whitelist directory, assign projects, configure titles, PBX, and broadcast alert subscriptions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUsers}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-xs"
              title="Refresh User List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Authorized User</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-card mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, employee ID, PBX..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="ADMIN">Admins</option>
                <option value="TEAM_LEAD">Team Leads</option>
                <option value="ENGINEER">Engineers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-3">Emp ID</th>
                  <th className="py-3 px-3">PBX</th>
                  <th className="py-3 px-3">Title / Designation</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Assigned Projects</th>
                  <th className="py-3 px-3 text-center">Alerts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    let assignedProjList: string[] = [];
                    try {
                      assignedProjList = JSON.parse(user.projects || "[]");
                    } catch {
                      assignedProjList = [];
                    }

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                              {(user.name || user.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {user.name || "Unnamed User"}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {user.employeeId || "—"}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {user.pbx || "—"}
                        </td>

                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {user.title || "Operations Specialist"}
                        </td>

                        <td className="py-3 px-3">
                          {user.role === "ADMIN" ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[10px]">
                              <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>ADMIN</span>
                            </span>
                          ) : user.role === "TEAM_LEAD" ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                              TEAM LEAD
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                              ENGINEER
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {assignedProjList.length === PROJECTS.length ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                                All Projects ({assignedProjList.length})
                              </span>
                            ) : assignedProjList.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">None</span>
                            ) : (
                              assignedProjList.map((pCode) => (
                                <span
                                  key={pCode}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                                >
                                  {pCode}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleAlertQuick(user)}
                            title={
                              user.receiveEmailAlerts
                                ? "Alerts ON (Click to disable)"
                                : "Alerts OFF (Click to enable)"
                            }
                            className={`p-1.5 rounded-lg border transition ${
                              user.receiveEmailAlerts
                                ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            {user.receiveEmailAlerts ? (
                              <Bell className="w-3.5 h-3.5" />
                            ) : (
                              <BellOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                              title="Edit User & Permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                              title="Revoke User Whitelist Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create or Edit User */}
        {(isNewUserModalOpen || selectedUserForEdit) && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedUserForEdit ? "Edit User Permissions" : "Add Authorized User to Directory"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure title, employee details, assigned projects, and alert preferences.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserForEdit(null);
                    setIsNewUserModalOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. engineer@domain.in"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      disabled={Boolean(selectedUserForEdit)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3494"
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      PBX Extension
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9622"
                      value={formPbx}
                      onChange={(e) => setFormPbx(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Designation / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior NOC Engineer"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Role & Permissions
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="ENGINEER">ENGINEER (Standard Operator)</option>
                      <option value="TEAM_LEAD">TEAM LEAD (Supervisor)</option>
                      <option value="ADMIN">ADMIN (Full System Control)</option>
                    </select>
                  </div>
                </div>

                {/* Email Alert Toggle */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Team Incident Broadcast Alerts
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When enabled, this user receives broadcast emails whenever a ticket is resolved.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAlerts}
                    onChange={(e) => setFormAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Assigned Projects Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Assigned Project Scopes
                    </label>
                    <div className="space-x-2 text-[10px]">
                      <button
                        type="button"
                        onClick={selectAllProjects}
                        className="text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearAllProjects}
                        className="text-slate-500 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROJECTS.map((proj) => {
                      const isAssigned = formProjects.includes(proj.code);
                      return (
                        <div
                          key={proj.code}
                          onClick={() => toggleProjectAssignment(proj.code)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition select-none flex items-center justify-between ${
                            isAssigned
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 font-semibold"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <span className="truncate">{proj.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAssigned ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForEdit(null);
                      setIsNewUserModalOpen(false);
                    }}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : selectedUserForEdit ? "Update User" : "Add Authorized User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
