import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import BookingModal from "../../components/Appointments/BookingModal";

interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    experienceYears: number;
    clinicAddress: string;
    profileImage?: string;
}

export default function DoctorsList() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/getallDoctors`);
                const result = await response.json();

                if (result.success) {
                    const mappedDoctors = result.data.map((d: any) => ({
                        id: d.id,
                        firstName: d.first_name,
                        lastName: d.last_name,
                        specialization: d.specialization,
                        experienceYears: d.experience_years,
                        clinicAddress: d.clinic_address,
                        profileImage: d.profile_image
                    }));
                    setDoctors(mappedDoctors);
                } else {
                    setError("Failed to fetch doctors");
                }
            } catch (err) {
                console.error("Error fetching doctors:", err);
                setError("Error fetching doctors");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    if (loading) return <div className="p-6">Loading doctors...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <>
            <PageMeta
                title="Find a Doctor | ConnectCare"
                description="Browse doctors and book an appointment."
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Find a Doctor</h2>
                </div>

                {/* Horizontal Scrollable Container */}
                <div className="w-full overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                        {doctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                className="w-80 min-w-[320px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex flex-col gap-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-600 border border-blue-100">
                                            {doctor.firstName[0]}{doctor.lastName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                                                Dr. {doctor.firstName} {doctor.lastName}
                                            </h3>
                                            <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center justify-between">
                                        <span>Experience:</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{doctor.experienceYears} Years</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Clinic:</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={doctor.clinicAddress}>{doctor.clinicAddress}</span>
                                    </div>
                                </div>

                                <div className="pt-2 mt-auto">
                                    <button
                                        onClick={() => {
                                            setSelectedDoctor(doctor);
                                            setIsModalOpen(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                                    >
                                        Book Appointment <span>&rarr;</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {doctors.length === 0 && (
                            <div className="w-full text-center text-gray-500 py-10">No doctors available.</div>
                        )}
                    </div>
                </div>
            </div>
            {/* Modal */}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                doctor={selectedDoctor}
            />
        </>
    );
}
