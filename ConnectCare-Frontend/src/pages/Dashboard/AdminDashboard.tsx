import React, { useEffect, useState } from "react";
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

export default function AdminDashboard() {
    const [doctors, setDoctors] = useState<UserRow[]>([]);
    const [patients, setPatients] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        fetchUsers();
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

            {renderTable(doctors, "Doctors", "doctor")}
            {renderTable(patients, "Patients", "patient")}
        </div>
    );
}
