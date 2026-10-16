# 📝 Task & Reminder Manager

A full-stack Node.js, Express, and MongoDB application with an Android companion application for managing tasks with reliable real-time reminders, notifications, and alerts.

## 🚀 Features

- **Task Management**: Create, view, mark Done/Undo, and delete tasks.
- **Scheduled & Daily Reminders**:
  - Set reminders for specific dates and times (`YYYY-MM-DD` at `HH:mm`).
  - Leave the date blank to create a recurring **Daily Reminder**.
- **Real-Time Pop-up Notifications**:
  - Browser Web Notifications (`Notification` API) with permission controls.
  - Native Android status bar & heads-up notifications with vibration on mobile.
  - Visible in-app popup toast cards with a dismiss button.
  - Synthesized chime sound via Web Audio API.
  - 5-second polling interval with connection recovery and delivery acknowledgment.
- **Strict Past Date/Time Guard**:
  - Reminders cannot be set for past dates (e.g., year 2025 in 2026).
  - Reminders cannot be set for past times on the same day (e.g., 22:10 when it is 22:11).
  - Native HTML5 calendar input restrictions (`min="today"`).

---

## 📱 Android Application (APK)

A pre-built, signed release APK is included directly in this repository:

👉 **[Download Task-and-Reminder-Manager.apk](./Task-and-Reminder-Manager.apk)**

### Android Features:
- **Standalone Mobile Storage**: Works immediately out of the box on your Android phone without needing an active server connection.
- **Native Android Notifications**: Uses Android `NotificationManager` channels with vibration and sound.
- **Optional PC/Cloud Sync**: Tap *Server Sync (Optional)* in the app to connect directly to your Node.js/MongoDB server via Wi-Fi (`http://<PC-IP>:5000`) or cloud URL.

### How to Install on Android:
1. Transfer `Task-and-Reminder-Manager.apk` to your Android device (via USB, Google Drive, WhatsApp, or browser download from GitHub).
2. Tap the APK file on your device.
3. If prompted, allow *"Install unknown apps"* for your file manager or browser.
4. Tap **Install** and open **Task & Reminder Manager**!

### How to Rebuild the APK:
Run the automated build script in PowerShell on Windows:
```powershell
powershell -ExecutionPolicy Bypass -File android\build-apk.ps1
```

---

## 🛠️ Web App Tech Stack

- **Backend**: Node.js & Express
- **Database**: MongoDB with Mongoose
- **Frontend**: Vanilla JavaScript, CSS, HTML5

---

## 📦 Web App Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Installation & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node todo.js
   ```

3. Open in your browser:
   ```
   http://localhost:5000
   ```
