import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from "@heroui/react"
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./Context/AuthProvider"; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HeroUIProvider>
        <AuthProvider>
            <main className="light text-foreground bg-background">
                <App />
            </main>
        </AuthProvider>
    </HeroUIProvider>
  </StrictMode>
)
