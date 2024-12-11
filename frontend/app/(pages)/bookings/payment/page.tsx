'use client'
import React, {useEffect} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import style from './payment.module.css';

const PaymentPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const flightID = searchParams.get('flightID');
    const departure = searchParams.get('departure');
    const arrival = searchParams.get('arrival');
    const departureTime = searchParams.get('departureTime');
    const arrivalTime = searchParams.get('arrivalTime');
    const duration = searchParams.get('duration');
    const price = searchParams.get('price');
    const planeType = searchParams.get('planeType')

    const handlePurchase = () => {
        // Handle the purchase logic here
        alert('Purchase successful!');
        router.push('/bookings/search');
    };

    return (
        <div className={style.payment}>
            <h1>Payment</h1>
            <div>Flight infomation</div>
            <div className={style.flightInfo}>
                <div className={style.column}>
                    <div><strong>Departure: {departure}</strong> → <strong> Arrival: {arrival}</strong></div>
                    <div>
                        <strong>Time: </strong>{departureTime} → {arrivalTime}
                    </div>
                </div>
                <div className={style.column}>
                    <div>
                        <strong>Flight duration: </strong>{duration}
                    </div>
                    <div>
                        <strong>Plane: </strong>{planeType}
                    </div>
                </div>
                <div className={style.column}>
                    <strong>Price: ${price}</strong>
                </div>
            </div>
            <button onClick={handlePurchase} className={style.purchaseButton}>Purchase</button>
        </div>
    );
};

export default PaymentPage;