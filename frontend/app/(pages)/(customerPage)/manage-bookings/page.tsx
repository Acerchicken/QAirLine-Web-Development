'use client'
import style from "./manage-bookings.module.css";
import React, { useState, useEffect } from "react";
import "@/app/global/global.css";
import {useRouter} from "next/navigation";
import {format} from "date-fns";

interface Ticket {
    BookingID: number;
    BookingDate: string;
    BookingStatus: string;
    PaymentStatus: string;
    FlightID: number;
    AircraftTypeID: number;
    Departure: string;
    Arrival: string;
    DepartureTime: string;
    ArrivalTime: string;
    Price: string;
    SeatsAvailable: number;
    FlightStatus: string;
}

const ManageBookings = () => {
    const [ticketList, setTicketList] = useState<Ticket[]>([]);
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuthentication = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/home');
            }
        }
        const fetchBookings = async () => {
            if (localStorage.getItem('userid') !== null) {
                const userID = localStorage.getItem('userid');
                const token = localStorage.getItem('token');
                try {
                    const response = await fetch('http://localhost:3001/api/Flights/GetUserFlights', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : '',
                        },
                        body: JSON.stringify({ userID }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setTicketList(data);
                    } else {
                        console.error('Failed to fetch bookings:', data);
                    }
                } catch (error) {
                    console.error('Error fetching bookings:', error);
                }
            }
        };
        checkAuthentication()
        fetchBookings();
    }, []);

    const cancelBooking = async (bookingID: number) => {
        const userID = localStorage.getItem('userid');
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3001/api/Bookings/CancelBooking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({ bookingID, userID }),
            });
            const data = await response.json();
            if (response.ok) {
                setTicketList(ticketList.map(ticket =>
                    ticket.BookingID === bookingID ? { ...ticket, BookingStatus: 'cancelled' } : ticket
                ));
                alert('Booking cancelled!');
            } else {
                console.error('Failed to cancel booking:', data);
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    }

    const executeCheckin = (id: number, message: string) => {
        alert('Flight status: ' + message);
    }

    const executeCancel = (id: number) => {
        cancelBooking(id);
    }

    // Tính thời gian bay
    const calculateFlightDuration = (departureTime: string, arrivalTime: string) => {
        const departure = new Date(departureTime);
        const arrival = new Date(arrivalTime);
        const durationMs = arrival.getTime() - departure.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${durationHours}h ${durationMinutes}m`;
    };

    // Định dạng lại datetime
    const formatedDate = (datetime: string) => {
        return format(new Date(datetime), 'HH:mm dd/MM/yyyy');
    };

    return (
        <div className={style.container}>
            <h1 className={style.title}>My Booking</h1>
            <ul className={style.ticketlist}>
                {ticketList.map((ticket) => (
                    <li key={ticket.BookingID} className={style.ticketitem}>
                        <div className={style.column}>
                            <div><strong>Booking ID: {ticket.BookingID}</strong></div>
                            <div className={style.smalltext}>Booked at: {formatedDate(ticket.BookingDate)}</div>

                        </div>
                        <div className={style.column}>
                            <strong>{ticket.Departure}</strong> → <strong>{ticket.Arrival}</strong>
                            <div>
                                {formatedDate(ticket.DepartureTime)} → {formatedDate(ticket.ArrivalTime)}
                            </div>
                            <div className={style.smalltext}>
                                Flight duration: {calculateFlightDuration(ticket.DepartureTime, ticket.ArrivalTime)}
                            </div>
                            <div className={style.smalltext}>
                                Plane ID: {ticket.AircraftTypeID}
                            </div>
                        </div>
                        <div className={style.column}>
                            <div>
                                Booking Status
                            </div>
                            <div><strong>{ticket.BookingStatus}</strong></div>
                            <div>
                                Price: ${ticket.Price}
                            </div>
                        </div>
                        <div className={style.column}>
                            <div>
                                <button className={style.checkinbutton} onClick={() => executeCheckin(ticket.BookingID, ticket.FlightStatus)}>Check-in</button>
                            </div>
                            <div>
                                <button className={style.cancelbutton} onClick={() => executeCancel(ticket.BookingID)}>Cancel</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ManageBookings;