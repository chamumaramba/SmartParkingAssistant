import React, { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../Context/AuthProvider";

export default function ActiveReservation() {
    const { user } = useContext(AuthContext);
    const [activeReservations, setActiveReservations] = useState([]);
    const [availableSpot, setAvailableSpots] = useState(0);
    const [parkingSpot, setParkingSpot] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Extract the userId from the user object
    const userId = user?.userId || user?.id || 'Guest';

    useEffect(() => {
        if (user) {
            fetchActiveReservations();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchActiveReservations = async () => {
        try {
            setLoading(true);
            setError(""); 

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 

            const response = await api.get(
                `/Booking/reservation/${userId}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutId);

            const data = response.data;

            if (Array.isArray(data)) {
                setActiveReservations(data);
            } else {
                setActiveReservations([]);
                setError("Unable to load reservation data. Received non-array response.");
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                setError("Request timed out. Server may be unresponsive.");
            } else if (error.response) {
                setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            } else if (error.request) {
                setError("No response received from server. Check server status.");
            } else {
                setError(`Error: ${error.message}`);
            }
            setActiveReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = async (bookingCode, parkingSpotId) => {
        try {
          
            const response = await api.post(
                `/Booking/cancel-reservation/${bookingCode}?parkingSpotId=${parkingSpotId}`
            );

            fetchActiveReservations();
        } catch (error) {
            setError("Failed to cancel reservation. Please try again.");
        }
    };

    const handleBookingNavigation = () => {
        navigate("/reservation");
    };

    const formatDateTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Active Reservations: {activeReservations.length}</h3>
                <Button
                    className="bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200"
                    size="sm"
                    color="primary"
                    onPress={fetchActiveReservations}
                >
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-6">
                    <Spinner size="lg" color="primary" />
                </div>
            ) : activeReservations.length > 0 ? (
                <div className="space-y-4">
                    {activeReservations.map((reservation) => (
                        <Card key={reservation.bookingId} className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gray-50 flex justify-between items-center py-3">
                                <h4 className="text-md font-medium">Booking #{reservation.bookingId}</h4>
                                <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Active
                                </div>
                            </CardHeader>
                            <CardBody className="p-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-medium">Access Code</div>
                                    <div>#{reservation.accessCode}</div>
                                    <div className="font-medium">Parking Spot</div>
                                    <div>#{reservation.parkingSpotId}</div>

                                    <div className="font-medium">License Plate</div>
                                    <div>{reservation.licensePlate}</div>

                                    <div className="font-medium">Booked Time</div>
                                    <div>{formatDateTime(reservation.bookTime)}</div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <Button
                                        size="sm"
                                        color="danger"
                                        className="text-white"
                                        onPress={() => handleCancelReservation(reservation.bookingCode, reservation.parkingSpotId)}
                                    >
                                        Cancel Reservation
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardBody className="p-6 text-center">
                        <p className="text-gray-500 mb-4">You don't have any active reservations.</p>
                        <Button
                            color="primary"
                            onPress={handleBookingNavigation}
                        >
                            Book a parking spot
                        </Button>
                    </CardBody>
                </Card>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}