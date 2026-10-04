import React, { useState, useRef, useEffect, useContext } from "react";
import { Card, CardBody, CardHeader, Button, Input, Form } from "@heroui/react";
import api from "../api/axios";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../Context/AuthProvider";

export function Login({ onLogin }) {
    const userRef = useRef();
    const errRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstname: "",
        lastname: "",
        licensePlate: ""
    });
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { email, password, confirmPassword, firstname, lastname, licensePlate } = formData;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        userRef.current?.focus();
    }, []);

    // FIXED: typo "fistname" → "firstname"
    useEffect(() => {
        setErrorMessage("");
    }, [email, password, confirmPassword, firstname, lastname, licensePlate, isLoginMode]);

    useEffect(() => {
        setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            firstname: "",
            lastname: "",
            licensePlate: ""
        });
        setErrorMessage("");
    }, [isLoginMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            if (isLoginMode) {
                // --- LOGIN ---
                const response = await api.post("/Auth/login", {
                    email,
                    password
                });

                console.log("Login successful:", response.data);

                const { firstname, lastname, userId } = response.data;

                login({ firstname, lastname, userId });
                navigate(location.state?.from?.pathname || "/", { replace: true });
            } else {
                // --- REGISTER ---
                await api.post("/Auth/register", {
                    email,
                    password,
                    confirmPassword,
                    firstname,
                    lastname,
                    licensePlate
                });

                setIsLoginMode(true);
            }

            // reset after successful login or signup
            setFormData({
                email: "",
                password: "",
                confirmPassword: "",
                firstname: "",
                lastname: "",
                licensePlate: ""
            });

        } catch (err) {
            console.error("Error:", err);

            if (!err.response) {
                setErrorMessage("No server response. Please check your connection.");
            } else if (err.response.status === 400) {
                setErrorMessage(err.response.data?.Message || "Missing required fields.");
            } else if (err.response.status === 401 && isLoginMode) {
                setErrorMessage(err.response.data?.Message || "Invalid email or password.");
            } else if (err.response.status === 409 && !isLoginMode) {
                setErrorMessage(err.response.data?.Message || "User already exists.");
            } else {
                const mode = isLoginMode ? "Login" : "Registration";
                setErrorMessage(`${mode} failed: ${err.response?.data?.Message || err.message}`);
            }

            errRef.current?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
            <Card className="max-w-[500px] mt-10 w-full p-8 rounded-2xl shadow-lg flex justify-center bg-gray-100">
                <CardHeader className="flex flex-col items-center mb-4 space-y-4 relative">
                    <h1 className="text-2xl font-bold">Your Gateway to Secure Parking</h1>

                    <div className="flex justify-center mb-4">
                        <h2 className="text-xl font-semibold">{isLoginMode ? "Login" : "Sign Up"}</h2>
                    </div>

                    <div className="relative flex h-12 mb-6 border border-gray-300 rounded-full overflow-hidden">
                        <div
                            className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r 
                            from-blue-700 via-cyan-600 to-cyan-200 transition-all duration-300
                            ${isLoginMode ? "left-0" : "left-1/2"}`}
                        />

                        <Button
                            radius="full"
                            variant="light"
                            className={`w-1/2 text-lg font-medium z-10
                            ${isLoginMode ? "text-white" : "text-black"}`}
                            onPress={() => setIsLoginMode(true)}>
                            Login
                        </Button>

                        <Button
                            radius="full"
                            variant="light"
                            className={`w-1/2 text-lg font-medium z-10
                            ${!isLoginMode ? "text-white" : "text-black"}`}
                            onPress={() => setIsLoginMode(false)}>
                            Sign Up
                        </Button>
                    </div>
                </CardHeader>

                <CardBody>
                    {errorMessage && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            <p ref={errRef} aria-live="assertive">{errorMessage}</p>
                        </div>
                    )}

                    <Form className="space-y-2" onSubmit={handleSubmit}>
                        {!isLoginMode && (
                            <>
                                <Input
                                    isRequired
                                    name="firstname"
                                    value={firstname}
                                    onChange={handleInputChange}
                                    label="Firstname"
                                    placeholder="Enter your firstname"
                                    variant="faded"
                                />

                                <Input
                                    isRequired
                                    name="lastname"
                                    value={lastname}
                                    onChange={handleInputChange}
                                    label="Lastname"
                                    placeholder="Enter your lastname"
                                    variant="faded"
                                />

                                <Input
                                    isRequired
                                    name="licensePlate"
                                    value={licensePlate}
                                    onChange={handleInputChange}
                                    label="Vehicle License Plate"
                                    placeholder="Enter your license plate"
                                    variant="faded"
                                />
                            </>
                        )}

                        <Input
                            isRequired
                            name="email"
                            value={email}
                            onChange={handleInputChange}
                            ref={userRef}
                            label="Email"
                            placeholder="Enter your email"
                            type="email"
                            variant="faded"
                        />

                        <Input
                            isRequired
                            name="password"
                            value={password}
                            onChange={handleInputChange}
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                            variant="faded"
                        />

                        {!isLoginMode && (
                            <Input
                                isRequired
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleInputChange}
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                type="password"
                                variant="faded"
                            />
                        )}

                        {isLoginMode && (
                            <div className="flex justify-end">
                                <p className="text-cyan-600 hover:underline cursor-pointer">
                                    Forgot password?
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full p-3 mt-2 bg-gradient-to-r 
                            from-blue-700 via-cyan-600 to-cyan-200 text-white rounded-full text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? "Please wait..." : isLoginMode ? "Login" : "Sign Up"}
                        </Button>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
}

export default Login;
