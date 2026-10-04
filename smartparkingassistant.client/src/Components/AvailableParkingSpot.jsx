import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Card, CardBody, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";

export default function AvailableParkingSpots() {
    const [availableSpots, setAvailableSpots] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchAvailableSpots();
    }, []);

    const fetchAvailableSpots = async () => {
        try {
            setLoading(true);
            const response = await api.get("/Booking/available-spots");
            const data = response.data;

            if (Array.isArray(data)) {
                console.log(`Fetched ${data.length} spot(s)`);
                setAvailableSpots(data.length);
            } else {
                console.warn("Expected an array, but got:", typeof data);
                setAvailableSpots(0);
                setError("Unable to load parking data");
            }
        } catch (error) {
            console.error("Error fetching available spots:", error);
            setError("Error connecting to server");
            setAvailableSpots(0);
        } finally {
            setLoading(false);
        }
    };

    const handleBookingNavigation = () => {
        navigate("/reservation"); 
    };

    return (
        <div className="text-center">
            {loading ? (
                <div className="flex justify-center p-4">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <div className="text-4xl font-bold text-blue-600">{availableSpots}</div>
                        <div className="text-gray-600 mt-1">Available Parking Spots</div>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-200"
                        onClick={handleBookingNavigation}
                        disabled={availableSpots === 0}
                    >
                        {availableSpots > 0 ? "Book a Spot" : "No Spots Available"}
                    </Button>

                    {error && (
                        <div className="mt-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}