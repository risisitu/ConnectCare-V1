import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import DashboardAppointmentsTable from "../../components/Appointments/DashboardAppointmentsTable";
// New components
import TotalConsultations from "../../components/dashboard/TotalConsultations";
import KeyMetrics from "../../components/dashboard/KeyMetrics";

import TimeSaved from "../../components/dashboard/TimeSaved";
import RecentReports from "../../components/dashboard/RecentReports";
import { useState, useEffect } from "react";

export default function DoctorDashboard() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    return (
        <>
            <PageMeta
                title="Doctor Dashboard | ConnectCare"
                description="Doctor Dashboard for ConnectCare"
            />

            {/* Manage Availability Moved to Sidebar -> Calendar */}

            <div className="space-y-6">
                {/* Key Metrics Row */}
                <KeyMetrics />

                <div className="grid grid-cols-12 gap-4 md:gap-6">
                    {/* Main Content Column */}
                    <div className="col-span-12 xl:col-span-8 space-y-6">
                        {/* Total Consultations & Other Stats */}
                        <TotalConsultations />

                        {/* Appointments Table */}
                        {/* Appointments Table */}
                        <DashboardAppointmentsTable />

                        {/* Recent Reports */}
                        <RecentReports />
                    </div>

                    {/* Sidebar Column */}
                    <div className="col-span-12 xl:col-span-4 space-y-6">
                        {/* Patient Demographics */}
                        <MonthlyTarget />

                        {/* Time Saved Widget */}
                        <TimeSaved />
                    </div>
                </div>
            </div>
            {/* Modal functionality moved to Calendar Page */}
        </>
    );
}
