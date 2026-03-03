import React, { useState, useEffect } from 'react';

export default function MonthlyTarget() {
    const [stats, setStats] = useState({
        currentMonth: 0,
        target: 100,
        percentage: 0
    });
    const [loading, setLoading] = useState(true);
    const [editingTarget, setEditingTarget] = useState(false);
    const [targetInput, setTargetInput] = useState(100);
    const [saving, setSaving] = useState(false);

    const fetchMonthlyStats = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) { setLoading(false); return; }

            // Fetch doctor stats for monthly_target
            const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/stats`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            let target = 100;
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) target = statsData.data.monthly_target ?? 100;
            }

            // Fetch appointments
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/appointments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    const appointments = result.data;
                    const now = new Date();
                    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const monthlyAppointments = appointments.filter((app: any) => {
                        const appDate = new Date(app.appointment_date);
                        return appDate >= currentMonthStart && appDate <= currentMonthEnd;
                    });
                    const count = monthlyAppointments.length;
                    const percentage = Math.min(Math.round((count / target) * 100), 100);
                    setStats({ currentMonth: count, target, percentage });
                    setTargetInput(target);
                }
            }
        } catch (error) {
            console.error("Error fetching monthly stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonthlyStats(); }, []);

    const handleSaveTarget = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/settings`, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ monthly_target: targetInput })
            });
            if (res.ok) {
                const newCount = stats.currentMonth;
                const newPercentage = Math.min(Math.round((newCount / targetInput) * 100), 100);
                setStats({ currentMonth: newCount, target: targetInput, percentage: newPercentage });
                setEditingTarget(false);
            }
        } catch (err) {
            console.error("Failed to save target:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">Monthly Target</h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Consultations this month</p>
                </div>
                <button
                    onClick={() => setEditingTarget(!editingTarget)}
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 p-1"
                    title="Edit target"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                </button>
            </div>

            {editingTarget ? (
                <div className="mb-4 p-3 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Set Monthly Target</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={1}
                            value={targetInput}
                            onChange={e => setTargetInput(parseInt(e.target.value) || 1)}
                            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                            onClick={handleSaveTarget}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-60 font-medium"
                        >
                            {saving ? "..." : "Save"}
                        </button>
                        <button
                            onClick={() => setEditingTarget(false)}
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-md"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-gray-800 dark:text-white">{stats.currentMonth}</span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">/ {stats.target}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stats.percentage}% of monthly goal</p>
                </div>
            )}

            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-brand-500 to-brand-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${stats.percentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">On Track</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {stats.percentage >= 50 ? 'Yes' : 'Behind'}
                    </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Remaining</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {Math.max(stats.target - stats.currentMonth, 0)}
                    </p>
                </div>
            </div>

            {!loading && stats.percentage >= 100 && (
                <div className="mt-4 rounded-lg bg-success-50 p-3 dark:bg-success-500/10">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-success-700 dark:text-success-400">Target achieved! 🎉</span>
                    </div>
                </div>
            )}
        </div>
    );
}
