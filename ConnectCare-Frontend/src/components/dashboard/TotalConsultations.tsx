import { useState, useEffect } from "react";


export default function TotalConsultations() {
    const [filter, setFilter] = useState("year"); // 'day', 'month', 'year'
    const [stats, setStats] = useState({
        total: 0,
        growth: "+0%",
        isPositive: true,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/appointments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const res = await response.json();
                    if (res.success && Array.isArray(res.data)) {
                        processData(res.data, filter);
                    }
                }
            } catch (e) {
                console.error("Error fetching stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [filter]);

    const processData = (appointments: any[], timeFilter: string) => {
        const now = new Date();
        let currentCount = 0;
        let previousCount = 0;

        appointments.forEach((apt) => {
            const aptDate = new Date(apt.appointment_date);

            if (timeFilter === "day") {
                // Compare today vs yesterday
                const isToday = aptDate.toDateString() === now.toDateString();
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const isYesterday = aptDate.toDateString() === yesterday.toDateString();

                if (isToday) currentCount++;
                if (isYesterday) previousCount++;

            } else if (timeFilter === "month") {
                // Compare this month vs last month
                const isThisMonth = aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
                const lastMonthDate = new Date(now);
                lastMonthDate.setMonth(now.getMonth() - 1);
                const isLastMonth = aptDate.getMonth() === lastMonthDate.getMonth() && aptDate.getFullYear() === lastMonthDate.getFullYear();

                if (isThisMonth) currentCount++;
                if (isLastMonth) previousCount++;

            } else if (timeFilter === "year") {
                // Compare this year vs last year
                const isThisYear = aptDate.getFullYear() === now.getFullYear();
                const isLastYear = aptDate.getFullYear() === now.getFullYear() - 1;

                if (isThisYear) currentCount++;
                if (isLastYear) previousCount++;
            }
        });

        // Calculate growth
        let growthPerc = 0;
        if (previousCount > 0) {
            growthPerc = Math.round(((currentCount - previousCount) / previousCount) * 100);
        } else if (currentCount > 0) {
            growthPerc = 100; // 100% growth if prev was 0
        }

        setStats({
            total: currentCount,
            growth: `${Math.abs(growthPerc)}%`,
            isPositive: growthPerc >= 0
        });
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 font-medium text-sm">Total Consultations</h3>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        {stats.total}
                    </h2>
                    <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${stats.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        <span>{stats.isPositive ? '+' : '-'}{stats.growth}</span>
                        <span className="text-gray-400 font-normal ml-1">
                            from last {filter}
                        </span>
                    </div>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
                    {['day', 'month', 'year'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${filter === f
                                ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Small trend chart could go here, for now just the stats */}
        </div>
    );
}
