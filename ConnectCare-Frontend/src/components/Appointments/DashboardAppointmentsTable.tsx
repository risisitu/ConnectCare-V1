import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import VideoCallModal from "../../components/VideoCall/VideoCallModal";
import { useAuth } from "../../components/auth/useAuth";


interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    appointment_type: string;
    video_call_link: string | null;
    reason: string | null;
    patient_first_name: string;
    patient_last_name: string;
    has_report?: boolean;
}

type FilterType = "today" | "yesterday" | "upcoming" | "all";

export default function DashboardAppointmentsTable() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filter, setFilter] = useState<FilterType>("upcoming");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Video Call
    const [videoCallOpen, setVideoCallOpen] = useState(false);
    const [callTarget, setCallTarget] = useState<{ id: string; name: string } | undefined>(undefined);
    const [callAppointmentId, setCallAppointmentId] = useState<string | undefined>(undefined);
    const { user } = useAuth();


    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const userStr = localStorage.getItem("user");
                if (!userStr) {
                    throw new Error("User not found");
                }
                const user = JSON.parse(userStr);
                const doctorId = user.id;

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/doctors/${doctorId}/appointments`
                );
                const result = await response.json();

                if (result.success) {
                    // Check which appointments have reports
                    const appointmentsWithReports = result.data;
                    const reportRes = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (reportRes.ok) {
                        const reportData = await reportRes.json();
                        const reportAppIds = new Set(reportData.data.map((r: any) => r.appointment_id));
                        setAppointments(appointmentsWithReports.map((app: any) => ({
                            ...app,
                            has_report: reportAppIds.has(app.id)
                        })));
                    } else {
                        setAppointments(appointmentsWithReports);
                    }
                } else {
                    setError("Failed to fetch appointments");
                }
            } catch (err) {
                console.error("Error fetching appointments:", err);
                setError("Error fetching appointments");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const getFilteredAppointments = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        return appointments.filter((app) => {
            const appDate = new Date(app.appointment_date);
            // Reset time for date comparison
            const appDateOnly = new Date(
                appDate.getFullYear(),
                appDate.getMonth(),
                appDate.getDate()
            );

            switch (filter) {
                case "today":
                    return appDateOnly.getTime() === today.getTime();
                case "yesterday":
                    return appDateOnly.getTime() === yesterday.getTime();
                case "upcoming":
                    return appDateOnly.getTime() >= today.getTime();
                case "all":
                default:
                    return true;
            }
        });
    };

    const filteredAppointments = getFilteredAppointments();

    // Helper to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const initiateCall = (app: Appointment) => {
        // Target is patient
        const targetId = app.patient_id;
        const targetName = `${app.patient_first_name} ${app.patient_last_name}`;

        setCallTarget({ id: targetId, name: targetName });
        setCallAppointmentId(app.id);
        setVideoCallOpen(true);
    };


    if (loading) return <div>Loading appointments...</div>;

    if (error) return <div>{error}</div>;

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Appointments
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-gray-900">
                        {(["today", "yesterday", "upcoming", "all"] as FilterType[]).map(
                            (f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f
                                        ? "bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-white"
                                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                >
                                    {f}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Patient
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Date & Time
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Type
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Action
                            </TableCell>
                        </TableRow>

                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredAppointments.length === 0 ? (
                            <TableRow>
                                <TableCell className="py-4 text-center text-gray-500" colSpan={4}>
                                    No appointments found for this filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAppointments.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell className="py-3">
                                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                            {app.patient_first_name} {app.patient_last_name}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        <div>
                                            <div>{formatDate(app.appointment_date)}</div>
                                            <div className="text-xs text-gray-400">
                                                {app.appointment_time}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 capitalize">
                                        {app.appointment_type}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        <Badge
                                            size="sm"
                                            color={
                                                app.status === "scheduled"
                                                    ? "success"
                                                    : app.status === "pending"
                                                        ? "warning"
                                                        : "error"
                                            }
                                        >
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        <div className="flex flex-col gap-2">
                                            {(() => {
                                                const appDate = new Date(app.appointment_date);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const appDateOnly = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
                                                const isPast = appDateOnly.getTime() < today.getTime();
                                                const isCompleted = app.status === 'completed';

                                                if (!isPast && !isCompleted) {
                                                    return (
                                                        <button
                                                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1 w-fit"
                                                            onClick={() => initiateCall(app)}
                                                        >
                                                            <span>📹</span> Call
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <VideoCallModal
                isOpen={videoCallOpen}
                onClose={() => setVideoCallOpen(false)}
                localUser={user ? { id: user.id || "unknown", name: user.name || user.email || "Doctor" } : { id: "doc", name: "Doctor" }}
                targetUser={callTarget}
                appointmentId={callAppointmentId}
            />
        </div>
    );


}
