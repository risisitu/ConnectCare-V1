import { useEffect, useState } from "react";
import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Home() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  if (!role) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  return (
    <>
      {role === "admin" ? <AdminDashboard /> : role === "doctor" ? <DoctorDashboard /> : <PatientDashboard />}
    </>
  );
}
