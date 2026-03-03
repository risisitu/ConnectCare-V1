import PageMeta from "../../components/common/PageMeta";
import PatientAppointmentsTable from "../../components/Appointments/PatientAppointmentsTable";
import FindDoctorCard from "../../components/dashboard/FindDoctorCard";
import PatientRecentReports from "../../components/dashboard/PatientRecentReports";

export default function PatientDashboard() {
    return (
        <>
            <PageMeta
                title="Patient Dashboard | ConnectCare"
                description="Patient Dashboard for ConnectCare"
            />
            <div className="space-y-6">
                <div className="grid grid-cols-12 gap-4 md:gap-6">
                    {/* Main Content Column */}
                    <div className="col-span-12 xl:col-span-8 space-y-6">
                        {/* Appointments Table */}
                        <PatientAppointmentsTable />
                    </div>

                    {/* Sidebar Column */}
                    <div className="col-span-12 xl:col-span-4 space-y-6">
                        {/* Find Doctor Widget */}
                        <FindDoctorCard />
                    </div>

                    {/* Reports Section - Full Width or under Appointments */}
                    <div className="col-span-12 space-y-6">
                        <PatientRecentReports />
                    </div>
                </div>
            </div>
        </>
    );
}
