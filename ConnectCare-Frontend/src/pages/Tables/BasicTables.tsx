import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Patient Details | Connect Care"
        description="List of patient details"
      />
      <PageBreadcrumb pageTitle="Patient Details" />
      <div className="space-y-6">
        <ComponentCard title="Patient Details">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
