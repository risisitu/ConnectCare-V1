import { useEffect, useState } from 'react';

interface Report {
    id: string;
    doctor_first_name: string;
    doctor_last_name: string;
    diagnosis: string;
    appointment_date: string;
    prescription: string;
    notes: string;
    patient_rating: number | null;
}

const PatientRecentReports = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState(false);

    const fetchReports = async () => {
        try {
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
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleRating = async (reportId: string, rating: number) => {
        setSubmittingRating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${reportId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ rating })
            });
            if (res.ok) {
                setRatingSuccess(true);
                // Update local report with new rating
                setReports(prev => prev.map(r => r.id === reportId ? { ...r, patient_rating: rating } : r));
                setSelectedReport(prev => prev ? { ...prev, patient_rating: rating } : prev);
                setTimeout(() => setRatingSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Failed to submit rating", error);
        } finally {
            setSubmittingRating(false);
        }
    };

    const StarRating = ({ reportId, currentRating }: { reportId: string; currentRating: number | null }) => {
        const alreadyRated = currentRating !== null;
        return (
            <div className="mt-6 border-t border-gray-100 pt-5 dark:border-strokedark">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {alreadyRated ? 'Your Rating' : 'Rate this Report'}
                </h4>
                {alreadyRated ? (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 ${star <= currentRating! ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        ))}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{currentRating}/5</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRating(reportId, star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    disabled={submittingRating}
                                    className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50"
                                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 transition-colors ${star <= (hoverRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Click a star to rate your experience</p>
                        {ratingSuccess && (
                            <p className="mt-2 text-sm text-success-600 font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Thank you for your feedback!
                            </p>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Recent Appointment Reports
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg dark:border-strokedark">
                        <p>No reports received yet.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div
                            key={report.id}
                            onClick={() => { setSelectedReport(report); setHoverRating(0); setRatingSuccess(false); }}
                            className="cursor-pointer group relative flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 dark:bg-meta-4 dark:border-strokedark dark:hover:border-primary"
                        >
                            <div className="mb-4 p-4 bg-blue-50 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <h5 className="font-semibold text-black dark:text-white mb-1">
                                Dr. {report.doctor_first_name} {report.doctor_last_name}
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {formatDate(report.appointment_date)}
                            </p>
                            <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                                Medical Report
                            </span>
                            {report.patient_rating !== null && (
                                <div className="flex items-center gap-0.5 mt-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <svg key={s} xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${s <= report.patient_rating! ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal for viewing report details */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
                            <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                Report Details
                            </h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4 dark:border-strokedark">
                                <div>
                                    <p className="text-sm text-gray-500">Doctor</p>
                                    <p className="font-semibold text-black dark:text-white">Dr. {selectedReport.doctor_first_name} {selectedReport.doctor_last_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-semibold text-black dark:text-white">{formatDate(selectedReport.appointment_date)}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-primary mb-2">Diagnosis</h4>
                                <div className="bg-gray-50 p-4 rounded dark:bg-meta-4">
                                    <p className="text-black dark:text-gray-300">{selectedReport.diagnosis}</p>
                                </div>
                            </div>

                            {selectedReport.prescription && (
                                <div>
                                    <h4 className="font-semibold text-primary mb-2">Prescription / Plan</h4>
                                    <div className="bg-blue-50 p-4 rounded dark:bg-blue-900/20">
                                        <p className="whitespace-pre-wrap text-black dark:text-gray-300">{selectedReport.prescription}</p>
                                    </div>
                                </div>
                            )}

                            {(() => {
                                try {
                                    const parsed = JSON.parse(selectedReport.notes);
                                    return (
                                        <div className="space-y-4">
                                            {Object.entries(parsed).map(([key, value]) => {
                                                if (key === 'diagnosis' || key === 'assessment' || key === 'treatment_plan') return null;
                                                const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                return (
                                                    <div key={key}>
                                                        <h4 className="font-semibold text-primary">{title}</h4>
                                                        <p className="text-sm text-black dark:text-gray-300">{String(value)}</p>
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

                            {/* Star Rating Section & Close Button next to it */}
                            <div className="flex items-end justify-between gap-4 mt-6 pt-2 border-t border-stroke dark:border-strokedark">
                                <div className="flex-1">
                                    <StarRating reportId={selectedReport.id} currentRating={selectedReport.patient_rating} />
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="mb-1 rounded-md bg-gray-200 hover:bg-gray-300 px-4 py-2 text-gray-700 dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 font-medium flex items-center gap-2"
                                >
                                    <span>Close</span>
                                    <span className="text-lg">✕</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default PatientRecentReports;
