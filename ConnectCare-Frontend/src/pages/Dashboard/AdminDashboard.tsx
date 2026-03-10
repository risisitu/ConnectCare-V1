import { useEffect, useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";

type UserRow = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    status: string;
    role: "doctor" | "patient";
};

type StatsData = {
    totalPatients: number;
    totalDoctors: number;
    activeConsultationsToday: number;
    completedConsultationsThisMonth: number;
};

export default function AdminDashboard() {
    const [doctors, setDoctors] = useState<UserRow[]>([]);
    const [patients, setPatients] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StatsData | null>(null);

    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            if (data.success) {
                setDoctors(
                    data.data.doctors.map((d: any) => ({ ...d, role: "doctor" }))
                );
                setPatients(
                    data.data.patients.map((p: any) => ({ ...p, role: "patient" }))
                );
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    const toggleStatus = async (id: string, role: string, currentStatus: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const newStatus = currentStatus === "active" ? "inactive" : "active";

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${role}/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update status");

            const data = await res.json();
            if (data.success) {
                // Update local state
                if (role === "doctor") {
                    setDoctors((prev) =>
                        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
                    );
                } else {
                    setPatients((prev) =>
                        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
                    );
                }
            }
        } catch (err: any) {
            alert("Error updating status: " + err.message);
        }
    };

    const renderTable = (users: UserRow[], title: string, role: string) => (
        <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {title}
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <table className="min-w-[800px] w-full text-left border-collapse">
                        <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                            <tr>
                                <th className="px-5 py-3 font-medium text-gray-500 text-xs dark:text-gray-400">Name</th>
                                <th className="px-5 py-3 font-medium text-gray-500 text-xs dark:text-gray-400">Email</th>
                                <th className="px-5 py-3 font-medium text-gray-500 text-xs dark:text-gray-400">Contact</th>
                                <th className="px-5 py-3 font-medium text-gray-500 text-xs dark:text-gray-400">Status</th>
                                <th className="px-5 py-3 font-medium text-gray-500 text-xs dark:text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                                        {u.first_name} {u.last_name}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {u.email}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {u.phone_number}
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge size="sm" color={u.status === "active" ? "success" : "error"}>
                                            {u.status}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleStatus(u.id, role, u.status)}
                                        >
                                            {u.status === "active" ? "Deactivate" : "Activate"}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-4 text-center text-sm text-gray-500">
                                        No {title.toLowerCase()} found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="p-6 text-center">Loading Admin Dashboard...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                    Admin Dashboard
                </h2>
                <p className="text-sm text-gray-500">Manage all doctors and patients.</p>
            </div>

            {/* Analytics Cards */}
            {stats && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Total Patients */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Patients</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{stats.totalPatients}</p>
                        <p className="mt-1 text-xs text-gray-400">Registered on platform</p>
                    </div>

                    {/* Total Doctors */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Doctors</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{stats.totalDoctors}</p>
                        <p className="mt-1 text-xs text-gray-400">Registered on platform</p>
                    </div>

                    {/* Active Consultations Today */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Today</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10">
                                <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{stats.activeConsultationsToday}</p>
                        <p className="mt-1 text-xs text-gray-400">Scheduled consultations today</p>
                    </div>

                    {/* Completed This Month */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed This Month</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/10">
                                <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{stats.completedConsultationsThisMonth}</p>
                        <p className="mt-1 text-xs text-gray-400">Completed consultations</p>
                    </div>
                </div>
            )}

            {renderTable(doctors, "Doctors", "doctor")}
            {renderTable(patients, "Patients", "patient")}
        </div>
    );
}
