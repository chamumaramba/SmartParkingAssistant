// Components/Layout.jsx
import React from "react";
import { useDisclosure } from "@heroui/react";
import { useLocation } from "react-router-dom";
import MainNavbar from "./Navbar";


export default function Layout({ children }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const location = useLocation();

    const showNavbar = location.pathname !== "/login";

    return (
        <div className="flex flex-col w-full h-screen bg-cyan-400">
            {showNavbar && (
                <header className="fixed top-0 left-0 right-0 z-50">
                    <MainNavbar onOpenDrawer={onOpen} />
                </header>
            )}
           
            <main className="flex-1 w-full pt-16 px-4 mt-10">
                {children}
            </main>
        </div>
    );
}