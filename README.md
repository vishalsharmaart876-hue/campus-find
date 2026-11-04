# CampusFind 🎒🔍
### Centralized College Lost & Found Management Platform

> **Tagline:** *"Lost Something? Find It. Found Something? Return It."*

CampusFind is a production-ready, full-stack Lost & Found management ecosystem tailored for university campuses. It streamlines the reporting of lost items, facilitates community returns, protects sensitive item details, enables real-time messaging, verifies ownership through dynamic questionnaires, provides QR-code collection passes, features an interactive Leaflet campus map, and leverages an OpenCV computer vision microservice for automated visual similarity matching.

---

## 🌟 Key Features

### 1. User Authentication & Role-Based Access Control
- **Student & Faculty Signup/Login** with college email verification.
- **Secure Password Hashing** using `bcryptjs` and session tokens with `jsonwebtoken`.
- **Role-based permissions**:
  - `student`: Report lost/found, file claims, earn Karma points.
  - `faculty`: Academic reports, direct safekeeping desk handoffs.
  - `admin`: Full moderation dashboard, user management, claim verification, landmark configuration.
- **1-Click Demo Account Switcher** on the login page for instantaneous review (`Student 1`, `Student 2`, `Faculty`, `Admin`).

### 2. Lost & Found Reporting with Smart Guardrails
- **Report Lost Item**: Item name, category, photographs, detailed description, campus building select, last seen spot, datetime, and contact preference.
- **Auto-Generated Unique Item ID**: Reporting a lost item automatically generates a unique tracking & return verification ID (e.g., `CF-LOST-849201`) shown with 1-click clipboard copy.
- **Report Found Item**: Found item name, photo upload, category, found location, custody status (in-app chat custody vs deposited at campus safekeeping desk).
- **Interactive OpenStreetMap Pin Picker**: Click directly on the college Leaflet map to tag the precise incident coordinates.
- **Duplicate Detection**: Real-time keyword & location matching alerts users before posting if a similar report was recently submitted.
- **Emergency Lost College ID Card Flow**: Dedicated 1-click broadcast option for student and faculty ID cards.
- **Sensitive Detail Concealment**: Finders can flag distinctive details as protected (e.g. engravings, wallpaper, secret marks) so they are only visible for claim validation.

### 3. Claim Verification, Return by Item ID & QR Pass System
- **Return by Item ID (Required)**: When someone finds and returns a lost item, submitting the owner's unique **Item ID** (`CF-LOST-XXXXXX`) is required to verify the return and complete the handover.
- **Global & Item Page Return Modals**: Dedicated return buttons in the navigation bar and on the lost item detail page allow quick verification, handover location tagging, and return confirmation.
- **Ownership Verification Questions**: Claimants must answer custom questions defined by the finder (e.g., *"What sticker is on the laptop lid?"*).
- **Proof Submission**: Claimants provide proof descriptions and optional receipts/photos.
- **Secure QR Code Pass**: Once approved, a unique pickup token (`CF-PICKUP-XXXX-XXXX`) is generated with SVG QR code.
- **Verified Handoff & Confetti**: Finder or campus desk scans or enters the Item ID or pickup token to mark the item as returned and trigger celebratory confetti.
- **Karma Reward Points**: Successfully returning an item awards **+50 Campus Karma Points** to the finder, advancing their leaderboard rank!

### 4. Modular AI-Based Image Matching (Python & OpenCV)
- A separate microservice running OpenCV and Flask compares uploaded images.
- Computes **HSV Color Histogram correlation** combined with **ORB (Oriented FAST and Rotated BRIEF) feature descriptors**.
- Generates visual similarity percentages (e.g., 77% match) with confidence ratings.
- **Resilient Fallback**: If the Python service is offline, the Node.js backend smoothly falls back to category and temporal heuristics without disrupting user experience.

### 5. Interactive Campus Map (Leaflet.js & OpenStreetMap)
- Color-coded pins:
  - 🔴 **Red Pins**: Active Lost items
  - 🟢 **Green Pins**: Active Found items
  - 🟣 **Indigo Pins**: Campus Landmarks and 24/7 Safekeeping Desks (Central Library Reception, Security HQ, SAC).
- Interactive popup cards showing item photos, categories, locations, and direct links to details.

### 6. Real-Time In-App Messaging & Notifications (Socket.IO)
- Private, anonymous real-time chat between finders and claimants.
- Personal phone numbers and emails are never exposed publicly.
- Conversation safety tools: Block/unblock options and campus safe-exchange recommendations.
- Instant notifications for claim submissions, approvals, status updates, and AI matches.

### 7. Digital Notice Board & Good Samaritan Leaderboard
- Real-time digital notice board on the homepage displaying recently found items and emergency lost ID alerts.
- Campus Karma Leaderboard showcasing top helpful students and faculty members.

### 8. Admin Moderation Dashboard
- Comprehensive KPI Analytics: Total users, total reports, recovery rate %, category distribution, incident hotspot locations.
- **User Management**: Search students/faculty, change roles, suspend/unban accounts.
- **Report Moderation**: Flag suspicious reports, archive, delete, or mark as resolved.
- **Claim Verification**: Central desk to inspect claimant answers and approve/reject claims.
- **Campus Landmark Management**: Configure campus buildings, coordinates, and safekeeping desks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet.js, React-Leaflet, Socket.IO Client, Axios, QRCode.react, Canvas-Confetti |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT, bcryptjs, Multer, Cloudinary (with local disk fallback), Helmet, Express Rate Limit |
| **AI Computer Vision** | Python 3, OpenCV (`opencv-python`), Flask, NumPy |
| **Database** | MongoDB Atlas / Local MongoDB (with automatic zero-config In-Memory MongoDB fallback) |

---

## 📂 Project Structure

```
campus_lost_found/
├── client/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Navbar, Footer, QRCodeModal, VerifyPickupModal
│   │   │   ├── items/               # ItemCard, ItemGrid
│   │   │   ├── claims/              # ClaimModal, QRCodeModal, VerifyPickupModal
│   │   │   └── map/                 # CampusMap, MapPicker
│   │   ├── context/                 # AuthContext, SocketContext, ThemeContext, LanguageContext
│   │   ├── pages/                   # LandingPage, BrowseItemsPage, ItemDetailsPage,
│   │   │                            # ReportLostPage, ReportFoundPage, StudentDashboardPage,
│   │   │                            # MyReportsPage, NotificationsPage, MessagingPage,
│   │   │                            # CampusMapPage, UserProfilePage, EmergencyIdPage,
│   │   │                            # LeaderboardPage, AboutContactPage, LoginPage, SignupPage
│   │   │   └── admin/               # AdminLayout, AdminOverviewPage, AdminUsersPage,
│   │   │                            # AdminReportsPage, AdminClaimsPage, AdminCampusLocationsPage
│   │   ├── i18n/                    # translations.js (English & Hindi)
│   │   ├── services/                # api.js (Axios instance with JWT interceptors)
│   │   ├── App.jsx                  # Main router and route definitions
│   │   ├── index.css                # Tailwind directives and Leaflet map styles
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js               # Dev server with proxy to Express backend
│   └── package.json
│
├── server/                          # Node.js + Express Backend
│   ├── config/                      # db.js (MongoDB Atlas & in-memory fallback)
│   ├── controllers/                 # authController, itemController, claimController,
│   │                                # chatController, notificationController, adminController,
│   │                                # campusController, rewardController
│   ├── middleware/                  # auth.js, upload.js (Cloudinary & local disk fallback)
│   ├── models/                      # User, Item, Claim, Conversation, Message,
│   │                                # Notification, CampusLocation, Reward
│   │── routes/                      # authRoutes, itemRoutes, claimRoutes, chatRoutes,
│   │                                # notificationRoutes, campusRoutes, rewardRoutes, adminRoutes
│   ├── services/                    # aiService.js, duplicateDetectionService.js
│   ├── utils/                       # seedData.js (Realistic demo data & accounts)
│   ├── uploads/                     # Local file upload directory
│   ├── server.js                    # Express + Socket.IO server setup
│   └── package.json
│
├── ai-service/                      # Python OpenCV Computer Vision Microservice
│   ├── matcher.py                   # Flask API for HSV histogram & ORB feature matching
│   ├── requirements.txt
│   └── README.md
│
├── package.json                     # Monorepo orchestration scripts
└── README.md                        # Documentation
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.10 or later
- **npm**: v9 or later

### Step 1: Install Dependencies
In the root directory, install the dependencies for root, server, and client:

```bash
# In campus_lost_found/
npm install --prefix server
npm install --prefix client
```

For the Python AI microservice:
```bash
python -m pip install -r ai-service/requirements.txt
```

---

### Step 2: Environment Configuration

Create a `.env` file in `server/` (a sample is provided as `server/.env`):

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=campusfind_super_secret_jwt_key_2026
JWT_EXPIRE=30d

# MongoDB connection string (Leave blank to use automatic in-memory MongoDB):
MONGODB_URI=

# AI Microservice URL:
AI_SERVICE_URL=http://localhost:5001

# Optional Cloudinary (If omitted, images are automatically stored on local disk in /uploads):
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

### Step 3: Run the Services

You can run the three services in separate terminals:

**Terminal 1: Node.js Backend Server**
```bash
cd server
npm start
# Server starts on http://localhost:5000 with automatic in-memory DB and demo seed
```

**Terminal 2: Python OpenCV AI Matcher**
```bash
cd ai-service
python matcher.py
# Microservice starts on http://localhost:5001
```

**Terminal 3: React Vite Client**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Pre-Seeded Demo Accounts

The application automatically seeds realistic university demo accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Administrator** | `admin@campus.edu` | `Admin@123` | Security & Admin Access, Moderation |
| **Student 1** | `aravind@campus.edu` | `Student@123` | CS Dept, 150 Karma Pts, Good Samaritan |
| **Student 2** | `priya@campus.edu` | `Student@123` | ECE Dept, 80 Karma Pts |
| **Faculty** | `prof.sharma@campus.edu` | `Faculty@123` | Mechanical Engineering Faculty |

> **Pro Tip:** On the `/login` page, you can click any of the **1-Click Demo Buttons** to sign in instantly without typing passwords!

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)
1. Push code to your GitHub repository.
2. In Vercel, import the project and set the **Root Directory** to `client`.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Add environment variable:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://campusfind-api.onrender.com`).

### Backend Deployment (Render)
1. In Render, create a new **Web Service** connected to your repository.
2. Set **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A long random secret string
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for persistent cloud media storage.

### AI Microservice Deployment (Render / Railway)
1. Create a Python Web Service pointing to `ai-service/`.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `python matcher.py`
4. In your backend environment, update `AI_SERVICE_URL` to point to the deployed Python service URL.

---

## 📄 License
This project is licensed under the MIT License. Built for university communities worldwide.
