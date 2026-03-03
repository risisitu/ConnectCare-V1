
import { useNavigate } from "react-router";

export default function FindDoctorCard() {
    const navigate = useNavigate();

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                Need to see a doctor?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                Find the right specialist for your needs and book an appointment today.
            </p>
            <button
                onClick={() => navigate("/doctors")}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
                Find a Doctor
            </button>
        </div>
    );
}
