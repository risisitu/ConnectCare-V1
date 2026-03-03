import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface AppointmentHistory {
    id: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
    status: string;
    reason: string;
    report_id: string | null;
    report_status: string | null;
}

interface PatientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string | number | null;
    patientName: string;
}

export default function PatientHistoryModal({ isOpen, onClose, patientId, patientName }: PatientHistoryModalProps) {
    const [history, setHistory] = useState<AppointmentHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        }
    }, [isOpen, patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/patients/${patientId}/history`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            interface HistoryAPIResponse {
                success: boolean;
                data: AppointmentHistory[];
                error?: string;
            }

            const result: HistoryAPIResponse = await response.json();
            if (result.success) {
                setHistory(result.data);
            } else {
                setError("Failed to fetch history");
            }
        } catch (err) {
            console.error("Error fetching patient history:", err);
            setError("Error fetching patient history");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Appointment History</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Patient: {patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                            {error}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No previous appointments found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Time</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Reason</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Report</TableCell>
                                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((app) => (
                                        <TableRow key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(app.appointment_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {app.appointment_time}
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                {app.appointment_type}
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                                                <span title={app.reason}>{app.reason}</span>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-sm">
                                                {app.report_id ? (
                                                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Generated
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">No report</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-sm">
                                                <Badge
                                                    size="sm"
                                                    color={
                                                        app.status === 'completed' ? 'success' :
                                                            app.status === 'cancelled' ? 'error' : 'warning'
                                                    }
                                                >
                                                    {app.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
