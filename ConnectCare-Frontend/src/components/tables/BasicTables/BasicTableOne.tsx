import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { useProfileData } from "../../../hooks/useProfileData";
import PatientHistoryModal from "../../Appointments/PatientHistoryModal";

type PatientRow = {
  id: number | string;
  name: string;
  age?: number;
  dob?: string;
  gender?: string;
  condition?: string;
  contact?: string;
  status?: string;
};

const defaultTableData: PatientRow[] = [
  {
    id: 1,
    name: "Lindsey Curtis",
    age: 34,
    dob: "1989-12-03",
    gender: "Female",
    condition: "Hypertension",
    contact: "+1 (555) 123-4567",
    status: "Under Treatment",
  },
  {
    id: 2,
    name: "Kaiya George",
    age: 42,
    dob: "1982-06-21",
    gender: "Female",
    condition: "Type II Diabetes",
    contact: "+1 (555) 987-6543",
    status: "Admitted",
  },
];

export default function BasicTableOne() {
  const { profile } = useProfileData();
  const [rows, setRows] = useState<PatientRow[]>(defaultTableData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  const getAgeFromDOB = (dob?: string) => {
    if (!dob) return undefined;
    try {
      const d = new Date(dob);
      const diff = Date.now() - d.getTime();
      const ageDt = new Date(diff);
      return Math.abs(ageDt.getUTCFullYear() - 1970);
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    const fetchPatientsForDoctor = async () => {
      // Only fetch when logged in user is a doctor
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const role = userStr ? JSON.parse(userStr).role : null;

      if (!role || role.toLowerCase() !== "doctor") {
        // keep default data for non-doctor users
        return;
      }

      if (!token) {
        setError("No auth token found");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/patients`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed: ${res.status} ${text}`);
        }

        const data = await res.json();

        interface PatientAPI {
          id?: string;
          _id?: string;
          first_name?: string;
          firstName?: string;
          name?: string;
          last_name?: string;
          lastName?: string;
          date_of_birth?: string;
          dob?: string;
          dob_string?: string;
          dobString?: string;
          phone_number?: string;
          phone?: string;
          contact?: string;
          gender?: string;
          last_appointment_reason?: string;
          condition?: string;
          status?: string;
        }

        // Expecting { success: true, data: [patients...] } or an array
        const patients: PatientAPI[] = Array.isArray(data) ? data : data?.data ?? [];

        const mapped: PatientRow[] = patients.map((pt, idx) => {
          const first = pt.first_name ?? pt.firstName ?? pt.name ?? "Unknown";
          const last = pt.last_name ?? pt.lastName ?? "";
          const fullName = `${first}${last ? " " + last : ""}`;
          const dob = pt.date_of_birth ?? pt.dob ?? pt.dob_string ?? pt.dobString;

          const contact = pt.phone_number ?? pt.phone ?? pt.contact ?? "-";
          const gender = pt.gender ?? "-";
          const condition = pt.last_appointment_reason ?? pt.condition ?? "-";

          return {
            id: pt.id ?? pt._id ?? idx,
            name: fullName,
            age: getAgeFromDOB(dob),
            dob,
            gender,
            condition,
            contact,
            status: pt.status ?? "-",
          };
        });

        setRows(mapped.length ? mapped : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        console.error("Error fetching doctor patients:", msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsForDoctor();
  }, [profile]);

  const handleOpenHistory = (patient: PatientRow) => {
    setSelectedPatientId(patient.id);
    setSelectedPatientName(patient.name);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Patient
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  DOB
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Gender
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Contact
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <td colSpan={6} className="px-4 py-6 text-center">
                    Loading patients...
                  </td>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <td colSpan={6} className="px-4 py-6 text-center text-red-500">
                    {error}
                  </td>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="px-4 py-6 text-center">
                    No patients found.
                  </td>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-theme-xs font-bold text-brand-600 border border-gray-200 dark:border-gray-800">
                          {p.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {p.name}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {p.age ? `Age ${p.age}` : ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {p.dob ? new Date(p.dob).toLocaleDateString() : "-"}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {p.gender}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {p.contact}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={
                          p.status?.toLowerCase() === "active"
                            ? "success"
                            : "error"
                        }
                      >
                        {p.status || "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <button
                        onClick={() => handleOpenHistory(p)}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-900"
                      >
                        View History
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Patient History Modal */}
      <PatientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
      />
    </div>
  );
}
