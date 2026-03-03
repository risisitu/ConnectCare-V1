import { useState, useEffect } from 'react';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor: {
        id: string;
        firstName: string;
        lastName: string;
        specialization: string;
    } | null;
}

interface Timeslot {
    id: string;
    start_time: string;
    end_time: string;
    isBooked?: boolean;
}

export default function BookingModal({ isOpen, onClose, doctor }: BookingModalProps) {
    const [availableSlots, setAvailableSlots] = useState<Timeslot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Timeslot | null>(null);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [bookingReason, setBookingReason] = useState("");

    useEffect(() => {
        if (isOpen && doctor) {
            fetchSlots();
        } else {
            setAvailableSlots([]);
            setSelectedSlot(null);
        }
    }, [isOpen, doctor]);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const start = new Date().toISOString();
            const end = new Date();
            end.setDate(end.getDate() + 14); // Next 2 weeks
            const endStr = end.toISOString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/availability/${doctor?.id}?startDate=${start}&endDate=${endStr}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const res = await response.json();
            if (res.success) {
                // Filter out booked slots + past slots (double check)
                const now = new Date();
                const validSlots = res.data.filter((slot: Timeslot) => !slot.isBooked && new Date(slot.start_time) > now);
                setAvailableSlots(validSlots);
            }
        } catch (error) {
            console.error("Error fetching slots", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSlot || !doctor) return;

        setBooking(true);
        try {
            // Retrieve patient ID from local storage or context (Assuming stored in user object)
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (!user) {
                alert("Please login to book");
                return;
            }

            // Convert stored timestamp to date and time for existing API
            const slotDate = new Date(selectedSlot.start_time);

            // Format YYYY-MM-DD
            const dateStr = slotDate.toISOString().split('T')[0];

            // Format HH:mm
            const timeStr = slotDate.toTimeString().substring(0, 5);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/createAppointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    doctorId: doctor.id,
                    appointmentDate: dateStr,
                    appointmentTime: timeStr,
                    appointmentType: 'video',
                    reason: bookingReason || 'General Consultation'
                })
            });

            const res = await response.json();
            if (res.success || res.id) { // appointment.model returns created row
                alert("Appointment booked successfully!");
                onClose();
            } else {
                alert(res.message || "Failed to book appointment");
            }

        } catch (error) {
            console.error("Error booking", error);
            alert("Error booking appointment");
        } finally {
            setBooking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Book Appointment with Dr. {doctor?.firstName} {doctor?.lastName}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6">
                    <h4 className="mb-3 font-semibold text-gray-700 dark:text-gray-300">Select an Available Time Slot</h4>

                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Loading slots...</div>
                    ) : availableSlots.length === 0 ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/10 dark:text-red-400">
                            This doctor is not free at the moment.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                            {availableSlots.map(slot => {
                                const start = new Date(slot.start_time);
                                const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                                const isSelected = selectedSlot?.id === slot.id;

                                return (
                                    <button
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`flex flex-col items-center justify-center rounded-lg border p-2 text-sm transition-all
                                            ${isSelected
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <span className="font-medium">{dateStr}</span>
                                        <span className="text-xs">{timeStr}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Reason for Visit
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Briefly describe your symptoms..."
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-brand-600 active:border-brand-600 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-600"
                        value={bookingReason}
                        onChange={(e) => setBookingReason(e.target.value)}
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBook}
                        disabled={!selectedSlot || booking}
                        className="rounded-lg bg-brand-600 py-2 px-6 font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {booking ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
}
