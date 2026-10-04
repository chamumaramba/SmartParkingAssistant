import React, { useContext } from "react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import AuthContext from "../Context/AuthProvider";  
import AvailableParkingSpot from "../Components/AvailableParkingSpot";
import ActiveReservation from "../Components/ActiveReservation"

export default function Home() {
    const { user } = useContext(AuthContext);

    const userName = user?.name || 'Guest'; 
    const userEmail = user?.email || 'Not available';

    return (
        <div className="container mx-auto w-full">
            <h1 className="text-2xl font-bold mb-4">Welcome to Smart Parking - {userName || userEmail}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl">Find Parking</h2>
                    </CardHeader>
                    <CardBody>
                        <AvailableParkingSpot />
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-xl">Your Reservations</h2>
                    </CardHeader>
                    <CardBody>
                        <ActiveReservation />
                    </CardBody>                
                </Card>
            </div>
        </div>
    );
}