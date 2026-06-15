# Anti-Gravity Photo Booth Booking Portal

A high-fidelity, full-stack booking system inspired by "Peek-A-Booth" designed specifically for an **Anti-Gravity Photo Booth** business. Guests can configure event details, check scheduling availability, select packages, choose add-ons, and proceed to a secure checkout experience.

---

## 🚀 Features

### 🌌 Frontend (React + Tailwind CSS + Framer Motion)
- **Multi-Step Wizard**:
  - **Step 1 (Event Info)**: Date, times (Start/End), event type, address, and lead contact inputs. Includes a real-time **Availability Checker** to prevent double-booking.
  - **Step 2 (Packages)**: Glowing cards listing base prices, durations, and details for **Anti-Gravity Standard** vs. **Anti-Gravity Premium**.
  - **Step 3 (Add-Ons Marketplace)**: Checkboxes for custom backdrops, digital kiosks, green screens, props, and slow-motion video boosts with live price accumulation.
  - **Step 4 (Review & Checkout)**: Billing breakdown showing Package Base, Add-ons subtotal, Tax (8.25%), and Grand Total. Includes a checkout launcher.
- **Visuals**: Deep-space gradients, glassmorphism, floating keyframe animations, and confetti bursts on successful booking.
- **Offline Fallback**: High-fidelity mock items and client-side calculations load automatically if the backend database goes offline.

### ⚙️ Backend (Node.js + Express + Mongoose)
- **Database Schemas**:
  - `User`: Handles details and hashed passwords.
  - `BoothPackage`: Models packages and their configurations.
  - `AddOn`: Stores additional service rates.
  - `Booking`: Tracks customer, timings, venue address, pricing details, and Stripe session links.
- **Performance Indexing**: Configured index rules on User `email` and Booking `eventDetails.date` for instant slot queries.
- **Controller Logic**:
  - `checkAvailability`: Verifies slot overlap queries against a maximum inventory limit (`total_booths = 3`).
  - `calculateTotalPricing`: Computes live totals with tax rates.
  - `createBookingSession`: Orchestrates Stripe checkout sessions. If Stripe is unconfigured, it activates a built-in **Mock Gateway** allowing testing of the complete flow without API keys.

---

## 🛠️ Project Structure

```
/bookingsystem-new/
  ├── backend/
  │    ├── config/          # Database configuration
  │    ├── controllers/     # Controller logic (availability, price, checkout)
  │    ├── models/          # Mongoose Schemas (User, Booking, Package, AddOn)
  │    ├── routes/          # Express API route endpoints
  │    ├── scripts/         # DB Seed script
  │    ├── .env             # Active environment settings
  │    └── server.js        # Express listener
  ├── frontend/
  │    ├── src/
  │    │    ├── components/ # Booking Wizard Step screens
  │    │    ├── App.jsx     # Main entry layout / Mock Stripe sandbox portal
  │    │    └── index.css   # Space-theme styling & glassmorphism utilities
  │    └── vite.config.js
  ├── package.json          # Root dev script orchestrator
  └── README.md
```

---

## ⚙️ Quick Start Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017` (or a MongoDB Atlas connection string).

### 1. Installation
Run the following orchestrator command from the root folder to install dependencies for the root, backend, and frontend folders:
```bash
npm run install-all
```

### 2. Configure Environment variables
Create a `.env` file in the `/backend` directory (a pre-configured one is already generated for you):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bookingsystem
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret_key_here  # Leave empty to use Sandbox Simulation Mode
```

### 3. Seed the Database
Run the seeder to populate the MongoDB database with standard Booth Packages and Add-Ons:
```bash
npm run seed
```

### 4. Start Development Servers
Launch both the Express backend and the Vite React frontend concurrently with one command:
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api/bookings](http://localhost:5000/api/bookings)

---

## 🛸 API Endpoint Specifications

### 1. Check Availability
- **Endpoint**: `POST /api/bookings/availability`
- **Request Body**:
  ```json
  {
    "date": "2026-06-20",
    "startTime": "18:00",
    "endTime": "20:00"
  }
  ```
- **Response (200 Success)**:
  ```json
  {
    "success": true,
    "available": true,
    "message": "Time slot is available!",
    "remainingBooths": 2
  }
  ```

### 2. Get Price Breakdown
- **Endpoint**: `POST /api/bookings/price-breakdown`
- **Request Body**:
  ```json
  {
    "packageId": "658f84...",
    "addOnIds": ["658f88...", "658f89..."]
  }
  ```
- **Response (200 Success)**:
  ```json
  {
    "success": true,
    "pricing": {
      "baseCost": 250,
      "addOnsTotalCost": 150,
      "tax": 33,
      "grandTotal": 433
    }
  }
  ```

### 3. Create Checkout Session
- **Endpoint**: `POST /api/bookings/checkout`
- **Request Body**:
  ```json
  {
    "customerDetails": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+15550199"
    },
    "eventDetails": {
      "date": "2026-06-20",
      "startTime": "18:00",
      "endTime": "20:00",
      "eventType": "Wedding",
      "venueAddress": "123 Starry Way, Cosmos City"
    },
    "packageId": "658f84...",
    "addOnIds": ["658f88..."]
  }
  ```
- **Response (200 Success)**:
  ```json
  {
    "success": true,
    "bookingId": "658fa9...",
    "checkoutUrl": "https://checkout.stripe.com/pay/...", // Or local mock checkout route
    "isMock": false
  }
  ```
