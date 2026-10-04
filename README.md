# Smart Parking Assistant

Smart Parking Assistant is a parking reservation application with a web client, an ASP.NET Core API, and an ESP32 simulation. The web client uses the API to manage accounts, list available parking spots, and create reservations. The ESP32 simulation uses MQTT to validate entry and exit access codes and control a simulated gate.

## Project layout

```text
SmartParkingAssistant/
├── SmartParkingAssistant/          # ASP.NET Core 8 API and SQLite database
├── smartparkingassistant.client/   # React, Vite, and HeroUI web client
├── SmartParkigSimulation/          # ESP32 Arduino firmware and Wokwi diagram
└── SmartParkingAssistant.sln       # Visual Studio solution
```

## What it does

- Lets users register and sign in.
- Shows available parking spots and lets a signed-in user reserve one.
- Stores user, parking spot, and booking data in SQLite.
- Publishes booking events and processes vehicle entry and exit requests using MQTT.
- Simulates an ESP32 parking gate with a keypad, 20x4 LCD, LEDs, and servo in Wokwi.

The current database context seeds 20 parking spots as available. A booking is associated with the signed-in user and a parking spot.

## Requirements

- Windows, macOS, or Linux.
- .NET 8 SDK.
- Node.js and npm (a current LTS release is recommended).
- An MQTT broker and credentials if using MQTT-dependent API or simulator features.
- For the embedded simulation:
  - PlatformIO Core or the PlatformIO IDE extension for VS Code.
  - The Wokwi VS Code extension to run the diagram simulation.

## Configuration before running

### API and MQTT

The API's launch profiles are in `SmartParkingAssistant/Properties/launchSettings.json`:

- HTTP profile: `http://localhost:5073`
- HTTPS profile: `https://localhost:7201` and `http://localhost:5073`

The web client is configured to use the HTTP API at `http://localhost:5073/api`.

The API's MQTT broker settings are currently configured in `SmartParkingAssistant/Program.cs`; the firmware's broker settings are in `SmartParkigSimulation/src/main.cpp`. Before using the project with your own broker, configure both sides to use the same broker, port, TLS setting, and credentials. Do not commit real broker credentials. If credentials have already been committed to a shared repository, rotate them.

The ESP32 simulation currently connects to the `Wokwi-GUEST` Wi-Fi network, which is intended for Wokwi. A physical ESP32 needs its own Wi-Fi configuration.

### SQLite

The default SQLite connection string is in `SmartParkingAssistant/appsettings.json`. It currently points inside the API project folder. If your checkout is in a different location, update the connection string or provide an appropriate local override. Keep database files and private configuration out of source control unless they are intentionally shared.

## Run the web application

Start the API in a PowerShell terminal:

```powershell
cd .\SmartParkingAssistant
dotnet restore
dotnet run --launch-profile http
```

The API listens at `http://localhost:5073`. In Development, Swagger is available at:

```text
http://localhost:5073/swagger
```

In another terminal, install the client dependencies and start Vite:

```powershell
cd .\smartparkingassistant.client
npm ci
npm run dev
```

Open the local URL printed by Vite (the project currently uses port `58778`). Go to `/login` to sign in or create an account. Keep both the API and client terminals running while using the application.

To create a production client build:

```powershell
cd .\smartparkingassistant.client
npm run build
```

## Build and run the ESP32 simulation

From the repository root, build the firmware with PlatformIO:

```powershell
cd .\SmartParkigSimulation
pio run -e esp32doit-devkit-v1
```

The build creates `firmware.bin` and `firmware.elf` under:

```text
.pio/build/esp32doit-devkit-v1/
```

These paths are referenced by `SmartParkigSimulation/wokwi.toml`. Open the simulation folder in VS Code and use **Wokwi: Start Simulator** to launch the diagram.

On the simulated keypad:

- Press `1` for vehicle entry or `2` for exit.
- Enter the six-digit access code.
- Press `#` to submit, `*` to clear, or `D` to return to the menu.

The ESP32 must be connected to the same MQTT broker as the API. If its display reports that it is offline, check the broker configuration, credentials, network connection, and API logs.

## Useful API endpoints

- `POST /api/Auth/register` — register a user.
- `POST /api/Auth/login` — sign in.
- `GET /api/Booking/available-spots` — list available parking spots.
- `POST /api/Booking/create` — create a booking for a signed-in user.
- `GET /api/Booking/reservation/{userId}` — list a user's active bookings.
- MQTT subscriptions for the API include `smart_parking/entry`, `smart_parking/exit`, and `smart_parking/available`.

## Troubleshooting

- **Client cannot connect to the API:** Start the API with `dotnet run --launch-profile http` and confirm it is listening on port `5073`. The client API base URL must match the API scheme and port.
- **Swagger opens instead of the client:** Swagger is the API documentation page. Start Vite separately and open the Vite URL.
- **Booking returns HTTP 400:** Sign in first, ensure the request has the signed-in user's ID, and confirm the selected parking spot is still available.
- **Wokwi cannot find firmware:** Build the firmware with PlatformIO and verify the `.pio/build/esp32doit-devkit-v1/firmware.bin` and `.elf` files exist.
- **ESP32 shows offline:** Check Wi-Fi in Wokwi and ensure the firmware and API use matching MQTT broker settings.
- **Database errors:** Check that the configured SQLite database path is writable and that the database schema has been initialized for this project.
