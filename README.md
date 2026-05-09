# Library Resource & Book Management System (LRBMS)

A full-stack web application for managing library resources, automating borrowing, tracking inventory, and handling user transactions.

## 🚀 Overview

LRBMS-Master includes:
- Member, Staff, and Admin dashboards
- Book catalog with image upload support
- Borrowing, returns, and fine management
- Real-time updates using Socket.io
- Background cron jobs for overdue tracking
- Stripe fine payment simulation
- Audit logging for system actions

## 💻 Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Zustand
- React Router DOM
- Axios
- Socket.io Client
- Framer Motion
- Recharts
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- bcryptjs password hashing
- Multer + Cloudinary uploads
- Socket.io
- Node-cron
- Stripe
- Helmet, CORS, rate limiting, compression

### Database
- MongoDB (local or Atlas)
- Mongoose ODM

### External Services
- Cloudinary for file storage
- Stripe for payment processing

## 📁 Project Structure

```
LRBMS-Master/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## 🛠️ Prerequisites

- Node.js v18 or higher
- MongoDB (local or Atlas)
- Cloudinary account
- Stripe account

## 🔧 Installation

### 1. Clone repository

```bash
git clone <repository-url>
cd LRBMS-Master
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

> Important: the backend uses `MONGO_URI`.

Run backend:

```bash
npm run dev
```

For production:

```bash
npm start
```

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
```

(Optional) Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Lint frontend:

```bash
npm run lint
```

## 🧪 Scripts

### Backend
- `npm run dev` — start backend with nodemon
- `npm start` — start backend with node

### Frontend
- `npm run dev` — start Vite development server
- `npm run build` — build production bundle
- `npm run preview` — preview production bundle
- `npm run lint` — run ESLint

## 🌐 API Endpoints

- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login user
- `GET /api/auth/verify` — verify session
- `GET /api/books` — list books
- `POST /api/transactions` — create a transaction
- `POST /api/payments/create-checkout-session` — process fine payment
- `GET /api/system` — get audit logs

## ✅ Usage

1. Run the backend server.
2. Run the frontend.
3. Open the Vite URL shown in terminal (usually `http://localhost:5173`).
4. Register or log in.
5. Use catalog, borrow/return flows, and payment features.

## 🔐 Notes

- Backend uses JWT cookies for authentication.
- Socket.io provides realtime dashboard updates.
- Cron jobs automatically handle overdue checks and penalties.
- Cloudinary stores book images.
- Stripe simulates payment processing.

## 📄 License

ISC


## Accounts

--mongo db link  https://account.mongodb.com/account/login?signedOut=true

google account
username  aceheisengerg01@gmail.com
password ; 12345librarysystem

mongo db account (database)
-username : aceheisenberg01@gmail.com
-password : 12345library

Admin 
username : vitali@gmail.com
password : 12345lol

Student/Borrowers
username : aeron@gmail.com
password : 12345lol