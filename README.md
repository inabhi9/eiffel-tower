# Eiffel Tower LED


<p align="center">
  <img width="50%" src="assets/demo.gif">
</p>


A small hardware-plus-app project that turns a Paris souvenir into a scheduled, WiFi-enabled LED show. The repo contains firmware for an ESP32-C3-based relay controller and an Expo app for scheduling and manual control.

## What is here

- Hardware: ESP32-C3 Supermini driving a relay that toggles the tower's built-in LEDs.
- Firmware: Arduino sketch that keeps time via WiFi, schedules sparkles, and exposes a tiny HTTP API for control.
- App: Expo (React Native) client for viewing status, triggering sparkles, and adjusting the schedule. Built end-to-end with GPT-5.1-Codex-Max (Vibe-coded).

## Hardware

- Eiffel Tower souvenir with a built-in LED sparkle mode (3x AA, on/off switch).
- Components: [ESP32-C3 Supermini](https://de.aliexpress.com/item/1005007479144456.html) and [1-channel relay](https://de.aliexpress.com/item/1005002983784189.html).
- Circuit: [diagram](https://app.cirkitdesigner.com/project/8b2d8786-043a-4003-bc49-5281fa629f37) and build photo below.

<img src="assets/circuit_image.png" width=20%>

## Firmware (Arduino)

- Written with Arduino IDE on macOS (Intel).
- Features:
    - Hourly sparkle window from 18:00 to 22:00, 1-minute duration per trigger (adjustable).
    - WiFi time sync.
    - Minimal HTTP server to configure duration, time range, and mode (auto/manual), plus manual trigger.

## Mobile app (Expo)

<p>
        <img src="assets/app-welcome.jpg" width=20%>
        <img src="assets/app-main1.jpg" width=20%>
        <img src="assets/app-main2.jpg" width=20%>
        <img src="assets/app-config.jpg" width=20%>
</p>

- Stack: Expo React Native, developed inside a devcontainer from [react-native-expo-devcontainer](https://github.com/zketosis/react-native-expo-devcontainer-template).
- Purpose: View the current schedule, toggle modes, and trigger sparkles manually.

## Setup

1) Copy environment template:
     - Rename `.env.example` to `.env` and fill in values.
     - If you have a reachable HTTP proxy, set `EXPO_PACKAGER_PROXY_URL`; otherwise `REACT_NATIVE_PACKAGER_HOSTNAME` is usually sufficient.

2) Install dependencies and start Expo:
     - `npm install`
     - `npm start`
     - Scan the QR code in the Expo Go app on your phone.

## Build

- Android APK/AAB: `npm run build:android`

## iOS usage tip

Sideloading is not supported here, so host Expo and open from Expo Go:

```
export CI=1
export EXPO_PACKAGER_PROXY_URL="https://your-public-url.example.com"
npx expo start --no-dev --minify --offline
```

Then open `exp://your-public-url.example.com` from Expo Go.

## Reference

- https://stackoverflow.com/questions/49125697/host-expo-app-on-external-network
