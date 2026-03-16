import { useState, useEffect } from 'react';

// Manual average time in seconds: 8 minutes 28 seconds
// const MANUAL_AVERAGE_SECONDS = 8 * 60 + 28; // 508 seconds

function formatSeconds(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function TimeSaved() {
    const [stats, setStats] = useState<{
        last_generation_seconds: number | null;
        last_report_date: string | null;
        total_ai_reports: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/ai-time-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) setStats(data.data);
                }
            } catch (e) {
                console.error('Failed to fetch AI time stats', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const lastGenSec = stats?.last_generation_seconds ?? null;

    const hasData = !loading && lastGenSec !== null;
    const noData = !loading && lastGenSec === null;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">AI Generation Time</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">
                    Time taken by AI to generate reports
                </p>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Loading...</div>
            )}

            {noData && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No AI-generated reports yet.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Complete a consultation to see AI timing stats.</p>
                </div>
            )}

            {hasData && (
                <>
                    {/* Last Consultation Card */}
                    <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 border border-brand-200 dark:border-brand-700/30 p-4 mb-4">
                        <p className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-wide mb-2">Last Consultation</p>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                                    {formatSeconds(lastGenSec!)}
                                </p>
                                <p className="text-sm text-brand-600 dark:text-brand-400 mt-0.5">AI processing time</p>
                            </div>
                        </div>
                        {stats?.last_report_date && (
                            <p className="text-xs text-brand-400 dark:text-brand-500 mt-2">
                                From: {new Date(stats.last_report_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </p>
                        )}
                    </div>

                    {/* Total count footer */}
                    {(stats?.total_ai_reports ?? 0) > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {stats!.total_ai_reports} AI report{stats!.total_ai_reports !== 1 ? 's' : ''} generated in total
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
