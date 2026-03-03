import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import SidebarAppointments from "../../layout/SidebarAppointments";

export default function AppointmentsPage() {
  return (
    <>
      <PageMeta
        title="Appointments | Connect Care"
        description="List of appointments"
      />
      <PageBreadcrumb pageTitle="Appointments" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Book Appointment">
            <SidebarAppointments showForm={true} showTable={false} inlineForm={true} />
          </ComponentCard>
        </div>
        <div className="space-y-6">
          <ComponentCard title="Your Appointments">
            <SidebarAppointments showForm={false} showTable={true} showBookButton={false} />
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
