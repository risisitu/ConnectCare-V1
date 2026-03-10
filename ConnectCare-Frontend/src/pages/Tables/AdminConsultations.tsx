import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface Appointment {
    id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    doctor_specialization: string;
    patient_first_name: string;
    patient_last_name: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
    status: string;
    reason: string;
}

export default function AdminConsultations() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    // Modals state
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setIsLoading(true);
            setError("");
            // Using standard localhost:3000 mapping, wait, let's use the current window location or hardcoded URL usually used in the project
            // It's probably http://localhost:3000 or similar.
            const token = localStorage.getItem("token") || "";

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/consultations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch consultations");
            }

            const data = await response.json();
            if (data.success) {
                setAppointments(data.data);
            } else {
                setError(data.error || "Failed to fetch consultations");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelClick = (app: Appointment) => {
        setSelectedAppointment(app);
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedAppointment) return;

        setIsCancelling(true);
        try {
            const token = localStorage.getItem("token") || "";

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/consultations/${selectedAppointment.id}/cancel`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (response.ok && data.success) {
                // Remove or update the appointment in standard list
                fetchAppointments();
                setIsCancelModalOpen(false);
                setSelectedAppointment(null);
            } else {
                alert(data.error || "Failed to cancel appointment");
            }
        } catch (err: any) {
            alert("Error cancelling appointment: " + err.message);
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "scheduled":
                return <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Scheduled</span>;
            case "completed":
                return <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Completed</span>;
            case "cancelled":
                return <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Cancelled</span>;
            default:
                return <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">{status}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <>
            <PageMeta
                title="Admin Consultations | Connect Care"
                description="View and manage all consultations"
            />
            <PageBreadcrumb pageTitle="All Consultations" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Platform Consultations</h3>
                    <button onClick={fetchAppointments} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition">
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-500/10">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Doctor</th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Patient</th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Admin Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Loading consultations...</td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No consultations found.</td>
                                </tr>
                            ) : (
                                appointments.map((app) => (
                                    <tr key={app.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">
                                            <div>{formatDate(app.appointment_date)}</div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs">{app.appointment_time}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            Dr. {app.doctor_first_name} {app.doctor_last_name}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {app.patient_first_name} {app.patient_last_name}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                            {app.appointment_type}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            {getStatusBadge(app.status)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedAppointment(app); setIsDetailsModalOpen(true); }}
                                                    className="rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                                                >
                                                    View Details
                                                </button>
                                                {app.status === "scheduled" && (
                                                    <button
                                                        onClick={() => handleCancelClick(app)}
                                                        className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {isDetailsModalOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Consultation Details</h3>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">Doctor Info</p>
                                <p className="font-medium text-gray-900 dark:text-white">Dr. {selectedAppointment.doctor_first_name} {selectedAppointment.doctor_last_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedAppointment.doctor_specialization}</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">Patient Info</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.patient_first_name} {selectedAppointment.patient_last_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">Time</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{formatDate(selectedAppointment.appointment_date)}</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.appointment_time}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">Status</p>
                                    <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <p className="text-xs uppercase text-blue-600 dark:text-blue-400 font-semibold mb-1">Reason for Visit</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{selectedAppointment.reason}</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => { setIsDetailsModalOpen(false); setSelectedAppointment(null); }}
                                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {isCancelModalOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4 dark:bg-red-500/20">
                            <svg className="h-7 w-7 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Cancel Consultation?</h3>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to cancel the appointment between Dr. {selectedAppointment.doctor_last_name} and {selectedAppointment.patient_first_name}? This action cannot be undone and both parties will be notified.
                        </p>
                        <div className="flex gap-3">
                            <button
                                disabled={isCancelling}
                                onClick={() => { setIsCancelModalOpen(false); setSelectedAppointment(null); }}
                                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isCancelling}
                                onClick={confirmCancel}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 flex justify-center items-center transition disabled:opacity-50"
                            >
                                {isCancelling ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    "Yes, Cancel It"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
