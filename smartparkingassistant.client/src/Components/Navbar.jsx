    import React, { useContext } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    Link,
    Button
} from "@heroui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthContext from "../Context/AuthProvider";
import smartParkLogo from '../assets/smartParking_logo.png';

export const SmartParkingLogo = () => {
    return (
        <img src={smartParkLogo} alt="Smart Parking Logo" width="36" height="36" />
    );
};

export default function MainNavbar({ onOpenBookingModal }) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const menuItems = [
        { name: "Parking Spots", path: "/" },
        { name: "Reservations", path: "/reservation" },
        { name: "Customers", path: "#" }
    ];

    const handleLogout = () => {
        // use the provided logout function from context
        if (typeof logout === "function") {
            logout();
        } else {
            // fallback in case context shape differs
            try { localStorage.removeItem('user'); } catch {}
        }

        // clear local storage user entry if present
        try { localStorage.removeItem('user'); } catch {}

        setIsMenuOpen(false);
        navigate('/');
    };

    return (
        <Navbar
            className="bg-blue-200 px-4 py-3"
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
        >
            <NavbarContent>
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
                <NavbarBrand>
                    <SmartParkingLogo />
                    <p className="font-bold text-inherit ml-2">Smart Parking</p>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <RouterLink to="/" className="text-foreground hover:text-primary">
                        Parking Spots
                    </RouterLink>
                </NavbarItem>
                <NavbarItem>
                    <RouterLink to="/reservation" className="text-foreground hover:text-primary">
                        Reservations
                    </RouterLink>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#" className="hover:text-primary">
                        Customers
                    </Link>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end">
                {!user ? (
                    <>
                        <NavbarItem className="hidden lg:flex">
                            <Link href="#" className="hover:text-primary">Login</Link>
                        </NavbarItem>
                        <NavbarItem>
                            <Button as={Link} color="primary" href="#" variant="flat" size="sm">
                                Sign Up
                            </Button>
                        </NavbarItem>
                    </>
                ) : (
                    <>
                        <NavbarItem className="hidden lg:flex">
                            <span className="text-foreground">Welcome, {user.name || user.username || user.email}</span>
                        </NavbarItem>
                        <NavbarItem>
                            <Button color="danger" variant="flat" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                        </NavbarItem>
                    </>
                )}
            </NavbarContent>

            <NavbarMenu className="bg-blue-50 pt-6">
                {menuItems.map((item, index) => (
                    <NavbarMenuItem key={`${item.name}-${index}`}>
                        <RouterLink
                            to={item.path}
                            className="w-full text-foreground text-lg py-2 hover:text-primary"
                            onPress={() => setIsMenuOpen(false)}
                        >
                            {item.name}
                        </RouterLink>
                    </NavbarMenuItem>
                ))}
                <NavbarMenuItem>
                    <Link href="#" className="w-full text-foreground text-lg py-2 hover:text-primary">
                        Login
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem>
                    <Button as={Link} color="primary" href="#" variant="flat" className="w-full mt-2">
                        Sign Up
                    </Button>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}