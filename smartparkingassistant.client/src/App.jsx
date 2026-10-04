import React, { Suspense, useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Components/Layout";
import AuthContext from "./Context/AuthProvider";

const HomePage = React.lazy(() => import("./Pages/Home"));
const Login = React.lazy(() =>
    import("./Pages/Login").then((module) => ({ default: module.Login }))
);
const Reservation = React.lazy(() => import("./Pages/Reservation"));

function RequireAuth({ children }) {
    const { isAuthenticated } = useContext(AuthContext);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Suspense fallback={<div className="p-6 text-center">Loading page...</div>}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/reservation"
                            element={
                                <RequireAuth>
                                    <Reservation />
                                </RequireAuth>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </Layout>
        </BrowserRouter>
    );
}