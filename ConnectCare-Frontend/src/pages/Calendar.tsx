import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import AvailabilityCalendar from "../components/Calendar/AvailabilityCalendar";

const Calendar: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  // If user is not specific role, we might want to show different things, 
  // but for now let's show AvailabilityCalendar if they are a doctor.
  // If patient, we could show a read-only view or their appointments (future task).

  return (
    <>
      <PageMeta
        title="Calendar | ConnectCare"
        description="Manage your availability and view schedule."
      />
      {user.role === 'doctor' ? (
        <AvailabilityCalendar doctorId={user.id} />
      ) : (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-boxdark">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Calendar</h2>
          <p>Calendar view for patients is coming soon.</p>
        </div>
      )}
    </>
  );
};

export default Calendar;
