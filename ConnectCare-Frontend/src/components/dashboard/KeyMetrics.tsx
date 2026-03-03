import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';

export default function KeyMetrics() {
    const [metrics, setMetrics] = useState({
        followUpRate: "—",
        satisfaction: "No ratings yet"
    });
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Fetch doctor stats (satisfaction, capacity, avg time)
            const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/stats`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            // Fetch appointments for follow-up calculation
            const apptRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/appointments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            let followUpRate = "0%";
            if (apptRes.ok) {
                const apptResult = await apptRes.json();
                if (apptResult.success && Array.isArray(apptResult.data)) {
                    const appointments: any[] = apptResult.data;
                    const patientCounts: Record<string, number> = {};
                    appointments.forEach(app => {
                        if (app.patient_id) {
                            patientCounts[app.patient_id] = (patientCounts[app.patient_id] || 0) + 1;
                        }
                    });
                    const uniquePatients = Object.keys(patientCounts).length;
                    const returningPatients = Object.values(patientCounts).filter(count => count > 1).length;
                    followUpRate = uniquePatients > 0 ? `${Math.round((returningPatients / uniquePatients) * 100)}%` : "0%";
                }
            }

            if (statsRes.ok) {
                const statsResult = await statsRes.json();
                if (statsResult.success) {
                    const s = statsResult.data;
                    const avgRating = s.avg_rating ? `${s.avg_rating}/5 ⭐` : "No ratings yet";

                    setMetrics({
                        satisfaction: avgRating,
                        followUpRate
                    });
                }
            } else {
                setMetrics(prev => ({ ...prev, followUpRate }));
            }
        } catch (error) {
            console.error("Error fetching metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMetrics(); }, []);


    return (
        <>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Key Metrics</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <MetricCard
                    title="Patient Satisfaction"
                    value={loading ? "Loading..." : metrics.satisfaction}
                    subtitle="Average from ratings"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    }
                />
                <MetricCard
                    title="Follow-up Rate"
                    value={loading ? "Loading..." : metrics.followUpRate}
                    subtitle="Returning patients"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    }
                />
            </div>

        </>
    );
}
