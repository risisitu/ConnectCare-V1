import { useEffect, useState } from "react";
import VideoCallModal from "../components/VideoCall/VideoCallModal";
import { useAuth } from "../components/auth/useAuth";
import { useNavigate } from "react-router";

type Appointment = {
  id?: string;
  patient_id?: string;
  doctor_id?: string;
  doctorId?: string;
  appointment_date?: string;
  appointmentDate?: string;
  appointment_time?: string;
  appointmentTime?: string;
  status?: string;
  appointment_type?: string;
  appointmentType?: string;
  video_call_link?: string;
  reason: string;
  created_at?: string;
  updated_at?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_specialization?: string;
  doctorName?: string;
  patient_first_name?: string;
  patient_last_name?: string;
};

export default function SidebarAppointments({
  showBookButton = true,
  showTable = true,
  showForm = false,
  inlineForm = false,
}: {
  showBookButton?: boolean;
  showTable?: boolean;
  showForm?: boolean;
  inlineForm?: boolean;
}) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  // Video Call State
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [callTarget, setCallTarget] = useState<{ id: string; name: string } | undefined>(undefined);
  const [callAppointmentId, setCallAppointmentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/patients/appointments`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        setAppointments(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setAppointments([]);
      }
    };

    fetchAppointments();
  }, []);

  const initiateCall = (appointment: Appointment) => {
    let targetId = "";
    let targetName = "";

    if (appointment.doctor_id || appointment.doctorId) {
      targetId = appointment.doctor_id || appointment.doctorId || "";
      targetName = appointment.doctor_first_name
        ? `${appointment.doctor_first_name} ${appointment.doctor_last_name || ""}`
        : appointment.doctorName || "Doctor";
    }

    if (user?.role === 'doctor' && appointment.patient_id) {
      targetId = appointment.patient_id;
      targetName = `${appointment.patient_first_name || "Patient"} ${appointment.patient_last_name || ""}`;
    }

    if (targetId) {
      setCallTarget({ id: targetId, name: targetName });
      setCallAppointmentId(appointment.id);
      setVideoCallOpen(true);

      const isPatient = user?.role === 'patient';
      if (isPatient || true) {
        const inviteDoctor = async () => {
          try {
            const token = localStorage.getItem("token");
            const link = `${window.location.origin}/video-call?targetId=${user?.id}&targetName=${user?.name || user?.email || 'Patient'}&appointmentId=${appointment.id}`;

            await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/video-call-invite`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                appointmentId: appointment.id,
                doctorId: targetId,
                doctorName: targetName,
                patientId: user?.id,
                patientName: user?.name || user?.email || "Patient",
                link: link
              })
            });
          } catch (err) {
            console.error("Failed to send video invite", err);
          }
        };
        inviteDoctor();
      }

    } else {
      alert("Could not call: Target user details missing");
    }
  };

  return (
    <div className={inlineForm ? "" : "px-2 py-4 border-t border-gray-100 dark:border-gray-800"}>
      {!inlineForm && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Appointments</h3>
          {showBookButton && (
            <button
              onClick={() => navigate('/doctors')}
              className="text-theme-sm bg-brand-600 text-white px-3 py-1 rounded-md hover:bg-brand-700"
            >
              Book New Appointment
            </button>
          )}
        </div>
      )}

      {inlineForm && showForm && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-4">Click below to find a doctor and book your consultation.</p>
          <button
            onClick={() => navigate('/doctors')}
            className="w-full text-theme-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Find Doctor & Book
          </button>
        </div>
      )}


      {/* Table */}
      {showTable ? (
        <div className="max-h-48 overflow-auto">
          {appointments.length === 0 ? (
            <div className="text-xs text-gray-400">No appointments yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Doctor</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, idx) => {
                  const date = a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : a.appointmentDate;
                  const time = a.appointment_time || a.appointmentTime;
                  const doctor = a.doctor_first_name ? `${a.doctor_first_name} ${a.doctor_last_name || ""}`.trim() : a.doctorName || "";
                  const status = a.status || "scheduled";
                  return (
                    <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-theme-sm">{date}</td>
                      <td className="py-2 text-theme-sm">{time}</td>
                      <td className="py-2 text-theme-sm">{doctor}</td>
                      <td className="py-2 text-theme-sm">{status}</td>
                      <td className="py-2 text-theme-sm">
                        {(() => {
                          const appDateStr = a.appointment_date || a.appointmentDate;
                          if (!appDateStr) return null;
                          const appDate = new Date(appDateStr);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const appDateOnly = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
                          const isPast = appDateOnly.getTime() < today.getTime();
                          const isCompleted = a.status === 'completed';

                          if (!isPast && !isCompleted) {
                            return (
                              <button
                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                                onClick={() => initiateCall(a)}
                              >
                                <span>📹</span> Call
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      <VideoCallModal
        isOpen={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        localUser={user ? { id: user.id || "unknown", name: user.name || user.email || "User" } : { id: "guest", name: "Guest" }}
        targetUser={callTarget}
        appointmentId={callAppointmentId}
      />
    </div>
  );
}
