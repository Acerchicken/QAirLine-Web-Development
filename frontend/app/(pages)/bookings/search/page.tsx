'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {format} from 'date-fns';
import style from './search.module.css';
import SearchBar from '@/app/components/SearchBar';

interface Flight {
    FlightID: number;
    AircraftTypeID: number;
    Departure: string;
    Arrival: string;
    DepartureTime: string;
    ArrivalTime: string;
    Price: number;
    SeatsAvailable: number;
    Status: 'on-time' | 'delayed';
}

const FlightBooking: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [search, setSearch] = useState({
        startDestination: searchParams.get('startDestination') || '',
        arriveDestination: searchParams.get('arriveDestination') || '',
        startDate: searchParams.get('startDate') || '',
        arriveDate: searchParams.get('arriveDate') || '',
        startDestinationOptions: ['New York (JFK)', 'Chicago (ORD)', 'San Francisco (SFO)'], // Default options
        arriveDestinationOptions: ['New York (JFK)', 'Chicago (ORD)', 'San Francisco (SFO)'],
    });




    useEffect(() => {
        const fetchFlights = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/flights');
                const data = await response.json();

                if (response.ok && Array.isArray(data)) {
                    setFlights(data);
                    // Lấy danh sách các điểm đi và điểm đến từ api/flights
                    const uniqueStartDestinations = Array.from(new Set(data.map(flights => flights.Departure)));
                    const uniqueArriveDestinations = Array.from(new Set(data.map(flights => flights.Arrival)));

                    // Cập nhật danh sách các điểm đi và điểm đến vào search
                    setSearch(prev => ({
                        ...prev,
                        startDestinationOptions: uniqueStartDestinations,
                        arriveDestinationOptions: uniqueArriveDestinations,
                    }));
                } else {
                    console.error('Fetched data is not an array:', data);
                }
            } catch (error) {
                console.error('Error fetching flights:', error);
            }
        };
        fetchFlights();
    }, [search]);

    // Xử lý tìm kiếm khi có thay đổi search bar
    useEffect(() => {
        handleSearch()
    }, [search]);

    useEffect(() => {
        // Clear search params from URL
        router.replace('/bookings/search');
    }, []);

    // Lọc danh sách các chuyến bay theo điều kiện tìm kiếm
    const [filteredFlights, setFilteredFlights] = useState<Flight[]>(flights);

    const handleSearch = () => {
        // Trigger the search
        const filtered = flights.filter(
            (flight) =>
                (!search.startDestination || flight.Departure.toLowerCase().includes(search.startDestination.toLowerCase())) &&
                (!search.arriveDestination || flight.Arrival.toLowerCase().includes(search.arriveDestination.toLowerCase())) &&
                (!search.startDate || flight.DepartureTime.includes(search.startDate)) &&
                (!search.arriveDate || flight.ArrivalTime.includes(search.arriveDate))
        );
        setFilteredFlights(filtered);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
    };

    const toPaymentPage = (flight: Flight) => {
        router.push(`/bookings/payment?flightID=${flight.FlightID}&departure=${flight.Departure}&arrival=${flight.Arrival}&departureTime=${formatedDate(flight.DepartureTime)}&arrivalTime=${formatedDate(flight.ArrivalTime)}&duration=${calculateFlightDuration(flight.DepartureTime, flight.ArrivalTime)}&price=${flight.Price}&planeType=${flight.AircraftTypeID}`);    }

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
        return format(new Date(datetime), 'dd/MM/yyyy HH:mm');
    };

    return (
        <div className={style.container}>
            <h1 className={style.title}>Flight Booking</h1>
            <SearchBar search={search} handleInputChange={handleInputChange} handleSearch={handleSearch}
            />
            <ul className={style.flightlist}>
                {filteredFlights.map((flight) => (
                    <li key={flight.FlightID} className={style.flightitem}>
                        <div className={style.column}>
                            <strong>{flight.Departure}</strong> → <strong>{flight.Arrival}</strong>
                            <div>
                                {formatedDate(flight.DepartureTime)} → {formatedDate(flight.ArrivalTime)}
                            </div>
                        </div>
                        <div className={style.column}>
                            <div>
                                Flight duration: {calculateFlightDuration(flight.DepartureTime, flight.ArrivalTime)}
                            </div>
                            <div>
                                Plane: {flight.AircraftTypeID}
                            </div>
                        </div>
                        <div className={style.column}>
                            <button onClick={() => toPaymentPage(flight)}>Economy<br />${flight.Price}</button>
                            <button>Business<br />${flight.Price}</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FlightBooking;