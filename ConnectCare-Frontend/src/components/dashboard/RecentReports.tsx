import { useEffect, useState } from 'react';

interface Report {
    id: string;
    patient_first_name: string;
    patient_last_name: string;
    diagnosis: string;
    appointment_date: string;
    appointment_type: string;
    prescription: string;
    notes: string;
    sent_to_patient: boolean;
}

const RecentReports = () => {
    const [reports, setReports] = useState<Report[]>([]);
    // const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        diagnosis: '',
        prescription: '',
        notes: ''
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // Check if user is doctor
                // Check if user is doctor
                const userStr = localStorage.getItem('user');
                if (!userStr) return;
                // const user = JSON.parse(userStr);

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setReports(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                // setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleViewReport = (report: Report) => {
        setSelectedReport(report);
        setIsEditing(false);
        setEditForm({
            diagnosis: report.diagnosis,
            prescription: report.prescription || '',
            notes: report.notes
        });
    };

    const handleSaveReport = async () => {
        if (!selectedReport) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${selectedReport.id}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                // Update local list
                setReports(reports.map(r => r.id === selectedReport.id ? { ...r, ...editForm } : r));
                setSelectedReport({ ...selectedReport, ...editForm });
                setIsEditing(false);
                alert("Report saved successfully!");
            } else {
                alert("Failed to save report.");
            }
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Error saving report.");
        }
    };

    const handleSendToPatient = async (reportToSendMessage?: Report) => {
        const targetReport = reportToSendMessage || selectedReport;
        if (!targetReport) return;
        setSending(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${targetReport.id}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                // Update local list
                setReports(reports.map(r => r.id === targetReport.id ? { ...r, sent_to_patient: true } : r));
                if (selectedReport && selectedReport.id === targetReport.id) {
                    setSelectedReport({ ...selectedReport, sent_to_patient: true });
                }
                alert("Report sent to patient successfully!");
            } else {
                const data = await res.json();
                alert(`Failed to send report: ${data.error}`);
            }
        } catch (error) {
            console.error("Error sending report:", error);
            alert("Error sending report.");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                setReports(reports.filter(r => r.id !== reportId));
                if (selectedReport?.id === reportId) {
                    setSelectedReport(null);
                }
                alert("Report deleted successfully.");
            } else {
                const data = await res.json();
                alert(`Failed to delete report: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            alert("Error deleting report.");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Recent AI Reports
            </h4>

            <div className="flex flex-col">
                <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
                    <div className="p-2.5 xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Date</h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Patient</h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Diagnosis</h5>
                    </div>
                    <div className="hidden p-2.5 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Status</h5>
                    </div>
                    <div className="hidden p-2.5 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">Action</h5>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No reports generated yet.</div>
                ) : (
                    reports.slice(0, 5).map((report, key) => (
                        <div
                            className={`grid grid-cols-3 sm:grid-cols-5 ${key === reports.length - 1
                                ? ""
                                : "border-b border-stroke dark:border-strokedark"
                                }`}
                            key={key}
                        >
                            <div className="flex items-center gap-3 p-2.5 xl:p-5">
                                <p className="text-black dark:text-white">{formatDate(report.appointment_date)}</p>
                            </div>

                            <div className="flex items-center justify-center p-2.5 xl:p-5">
                                <p className="text-black dark:text-white">
                                    {report.patient_first_name} {report.patient_last_name}
                                </p>
                            </div>

                            <div className="flex items-center justify-center p-2.5 xl:p-5">
                                <p className="text-meta-3">{report.diagnosis}</p>
                            </div>

                            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                                {report.sent_to_patient ? (
                                    <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                                        Sent
                                    </span>
                                ) : (
                                    <span className="inline-flex rounded-full bg-warning bg-opacity-10 py-1 px-3 text-sm font-medium text-warning">
                                        Unsent
                                    </span>
                                )}
                            </div>

                            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5 gap-2">
                                <button
                                    onClick={() => handleViewReport(report)}
                                    className="hover:text-primary"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        handleViewReport(report);
                                        setIsEditing(true);
                                    }}
                                    className="hover:text-primary"
                                >
                                    Edit
                                </button>
                                {!report.sent_to_patient && (
                                    <button
                                        onClick={() => handleSendToPatient(report)}
                                        disabled={sending}
                                        className="text-primary hover:text-opacity-80 disabled:opacity-50"
                                    >
                                        {sending && selectedReport?.id === report.id ? '...' : 'Send'}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="text-danger hover:text-opacity-80"
                                    title="Delete Report"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for viewing report details */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-black dark:text-white">
                                {isEditing ? 'Edit Medical Report' : 'Medical Report'}
                            </h3>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-primary">Details</h4>
                                <p>Date: {formatDate(selectedReport.appointment_date)}</p>
                                <p>Patient: {selectedReport.patient_first_name} {selectedReport.patient_last_name}</p>
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white">Diagnosis</label>
                                        <input
                                            type="text"
                                            value={editForm.diagnosis}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white">Prescription / Treatment Plan</label>
                                        <textarea
                                            rows={4}
                                            value={editForm.prescription}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, prescription: e.target.value }))}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white">Detailed Notes</label>
                                        <textarea
                                            rows={6}
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-50 p-4 rounded dark:bg-meta-4">
                                        <h4 className="font-semibold text-primary mb-2">Diagnosis</h4>
                                        <p>{selectedReport.diagnosis}</p>
                                    </div>
                                    {selectedReport.prescription && (
                                        <div className="bg-blue-50 p-4 rounded dark:bg-blue-900/20">
                                            <h4 className="font-semibold text-primary mb-2">Prescription / Treatment Plan</h4>
                                            <p className="whitespace-pre-wrap">{selectedReport.prescription}</p>
                                        </div>
                                    )}

                                    {/* Try to parse structured notes if possible */}
                                    {(() => {
                                        try {
                                            const parsed = JSON.parse(selectedReport.notes);
                                            return (
                                                <div className="space-y-4">
                                                    {Object.entries(parsed).map(([key, value]) => {
                                                        if (key === 'diagnosis' || key === 'assessment' || key === 'treatment_plan') return null; // Already shown or shown below
                                                        const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                        return (
                                                            <div key={key}>
                                                                <h4 className="font-semibold text-primary">{title}</h4>
                                                                <p className="text-sm text-black dark:text-gray-300 whitespace-pre-wrap">{String(value)}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        } catch (e) {
                                            return (
                                                <div>
                                                    <h4 className="font-semibold text-primary">Notes</h4>
                                                    <p className="whitespace-pre-wrap text-black dark:text-gray-300">{selectedReport.notes}</p>
                                                </div>
                                            );
                                        }
                                    })()}
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            {!isEditing && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="rounded bg-meta-3 px-4 py-2 text-white hover:bg-opacity-90"
                                    >
                                        Edit
                                    </button>
                                    {!selectedReport.sent_to_patient && (
                                        <button
                                            onClick={() => handleSendToPatient()}
                                            disabled={sending}
                                            className="rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
                                        >
                                            {sending ? 'Sending...' : 'Send to Patient'}
                                        </button>
                                    )}
                                </>
                            )}

                            {isEditing && (
                                <button
                                    onClick={handleSaveReport}
                                    className="rounded bg-success px-4 py-2 text-white hover:bg-opacity-90 bg-green-600"
                                >
                                    Save Changes
                                </button>
                            )}

                            <button
                                onClick={() => setSelectedReport(null)}
                                className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-opacity-90"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark flex justify-start">
                            <button
                                onClick={() => {
                                    if (selectedReport) {
                                        handleDeleteReport(selectedReport.id);
                                    }
                                }}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Delete this report permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentReports;
