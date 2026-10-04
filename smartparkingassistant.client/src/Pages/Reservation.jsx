import React, { useState, useEffect, useContext } from "react";
import { Button, Card, Input, Select, SelectItem } from "@heroui/react";
import AuthContext from "../Context/AuthProvider";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Reservation() {
    const [availableSpots, setAvailableSpots] = useState([]);
    const [selectedSpot, setSelectedSpot] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAvailableSpots();
    }, []);

    const fetchAvailableSpots = async () => {
        try {
            const response = await api.get("/Booking/available-spots");
            const data = response.data;
            const spots = Array.isArray(data) ? data : [];
            setAvailableSpots(spots);
        } catch (error) {
            setMessage({
                text: "Error connecting to server. Please try again later.",
                type: "error"
            });
        }
    };

    const handleCreateReservation = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: "", type: "" });

        if (!selectedSpot) {
            setMessage({ text: "Please select a parking spot", type: "error" });
            setIsLoading(false);
            return;
        }

        const parkingSpotId = Number(selectedSpot);
        if (Number.isNaN(parkingSpotId) || parkingSpotId <= 0) {
            setMessage({ text: "Invalid parking spot selected", type: "error" });
            setIsLoading(false);
            return;
        }

        try {
            await api.post("/Booking/create", {
                userId: user?.userId,
                parkingSpotId,
                isActive: true
            });

            setMessage({ text: "Reservation created successfully!", type: "success" });
            setSelectedSpot("");
            fetchAvailableSpots();

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error("Error creating reservation:", error.response ?? error);
            // server may return `Message` or `message`
            const errorMessage =
                error.response?.data?.Message ??
                error.response?.data?.message ??
                error.message ??
                "Failed to create reservation";
            setMessage({ text: errorMessage, type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectedSpot("");
        setMessage({ text: "", type: "" });

        navigate('/');
    };

    const isValidSpot = (spot) => {
        return spot && typeof spot === 'object' && ('id' in spot || 'Id' in spot);
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <Card className="p-6 shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Create a Reservation</h2>

                {message.text && (
                    <div className={`mb-4 p-3 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleCreateReservation}>

                    <div className="mb-6">
                        <label htmlFor="parking-spot" className="block text-sm font-medium mb-1">Parking Spot</label>
                        <Select
                            id="parking-spot"
                            value={selectedSpot}
                            placeholder="Select a parking spot"
                            onChange={(valueOrEvent) => {
                                // @heroui/react Select may pass either an event or the selected value.
                                const v = valueOrEvent?.target?.value ?? valueOrEvent;
                                // normalize to string for controlled input
                                setSelectedSpot(v != null ? String(v) : "");
                            }}
                        >
                            {
                                Array.isArray(availableSpots) && availableSpots.length > 0 ? (
                                    availableSpots.filter(isValidSpot).map((spot) => {
                                        // tolerate both `id` and `Id`
                                        const id = spot.id ?? spot.Id;
                                        return (
                                            <SelectItem
                                                key={id}
                                                value={String(id)}
                                            >
                                                {`Spot #${id}`}
                                            </SelectItem>
                                        );
                                    })
                                ) : (
                                    <SelectItem key="no-spots" value="" disabled>
                                        No spots available
                                    </SelectItem>
                                )}
                        </Select>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            color="primary"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating..." : "Create Reservation"}
                        </Button>
                        <Button
                            type="button"
                            color="danger"
                            className="flex-1"
                            disabled={isLoading}
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}