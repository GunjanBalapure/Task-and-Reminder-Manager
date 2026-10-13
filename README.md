# 📝 Task & Reminder Manager

A full-stack Node.js, Express, and MongoDB application for managing tasks with reliable real-time reminders, browser notifications, and in-app alerts.

## 🚀 Features

- **Task Management**: Create, view, mark Done/Undo, and delete tasks.
- **Scheduled & Daily Reminders**:
  - Set reminders for specific dates and times (`YYYY-MM-DD` at `HH:mm`).
  - Leave the date blank to create a recurring **Daily Reminder**.
- **Real-Time Pop-up Notifications**:
  - Browser Web Notifications (`Notification` API) with permission controls.
  - Visible in-app popup toast cards with a dismiss button.
  - Synthesized chime sound via Web Audio API.
  - 5-second polling interval with connection recovery and delivery acknowledgment.
- **Strict Past Date/Time Guard**:
  - Reminders cannot be set for past dates (e.g., year 2025 in 2026).
  - Reminders cannot be set for past times on the same day (e.g., 22:10 when it is 22:11).
  - Native HTML5 calendar input restrictions (`min="today"`).

## 🛠️ Tech Stack

- **Backend**: Node.js & Express
- **Database**: MongoDB with Mongoose
- **Frontend**: Vanilla JavaScript, CSS, HTML5

## 📦 Getting Started

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
