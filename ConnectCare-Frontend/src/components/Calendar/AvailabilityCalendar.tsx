import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';

interface AvailabilityCalendarProps {
    doctorId: string;
}

export default function AvailabilityCalendar({ doctorId }: AvailabilityCalendarProps) {
    const [events, setEvents] = useState<EventInput[]>([]);
    const calendarRef = useRef<FullCalendar>(null);

    const fetchAvailability = async () => {
        try {
            const startStr = new Date().toISOString();
            const end = new Date();
            end.setDate(end.getDate() + 60); // Fetch 2 months
            const endStr = end.toISOString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/availability/${doctorId}?startDate=${startStr}&endDate=${endStr}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const res = await response.json();
            if (res.success) {
                const mappedEvents = res.data.map((slot: any) => ({
                    id: slot.id,
                    start: slot.start_time,
                    end: slot.end_time,
                    // Style matching Calendar.tsx
                    className: slot.isBooked ? 'bg-red-500 border-red-500' : 'bg-green-500 border-green-500',
                    title: slot.isBooked ? 'Booked' : 'Available',
                    extendedProps: {
                        isBooked: slot.isBooked,
                        type: slot.isBooked ? 'danger' : 'success'
                    }
                }));
                setEvents(mappedEvents);
            }
        } catch (error) {
            console.error("Failed to fetch availability", error);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, [doctorId]);

    const handleDateSelect = async (selectInfo: DateSelectArg) => {
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect();

        const start = new Date(selectInfo.startStr);
        const now = new Date();

        if (start < now) {
            alert("Cannot add availability in the past.");
            return;
        }

        const confirmAdd = window.confirm(`Mark available: \n${new Date(selectInfo.startStr).toLocaleString()} - ${new Date(selectInfo.endStr).toLocaleTimeString()}?`);

        if (confirmAdd) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/availability`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        startTime: selectInfo.startStr,
                        endTime: selectInfo.endStr
                    })
                });

                const res = await response.json();
                if (res.success) {
                    fetchAvailability();
                } else {
                    alert(res.message || "Failed to add slot");
                }
            } catch (error) {
                console.error("Error adding slot", error);
                alert("Error adding slot");
            }
        }
    };

    const handleEventClick = async (clickInfo: EventClickArg) => {
        if (clickInfo.event.extendedProps.isBooked) {
            alert("This slot is already booked by a patient.");
            return;
        }

        if (confirm(`Remove this availability slot?`)) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/availability/${clickInfo.event.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    clickInfo.event.remove();
                } else {
                    alert("Failed to remove slot");
                }
            } catch (error) {
                console.error("Error removing slot", error);
            }
        }
    };

    // Render event content similar to Calendar.tsx
    const renderEventContent = (eventInfo: any) => {
        return (
            <div className={`flex flex-col px-1 py-0.5 w-full h-full text-xs text-white rounded overflow-hidden ${eventInfo.event.extendedProps.isBooked ? 'bg-red-500' : 'bg-green-500'}`}>
                <div className="font-semibold">{eventInfo.timeText}</div>
                <div>{eventInfo.event.title}</div>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">Manage Weekly Availability</h2>
            <div className="custom-calendar">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'timeGridWeek,timeGridDay'
                    }}
                    initialView='timeGridWeek'
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={events}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height={"auto"}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    firstDay={1}
                />
            </div>
        </div>
    );
}
