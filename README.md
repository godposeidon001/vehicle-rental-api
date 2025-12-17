# 🚗 Vehicle Rental System API

A RESTful backend API for managing vehicle rentals with role-based access control.
Built using Node.js, TypeScript, Express, PostgreSQL (NeonDB), and JWT authentication.

## 🌐 Live URL
[Live URL](https://syed-vehicle-rental.vercel.app/)

## 📦 Features
- User authentication (JWT)
- Role-based access (Admin / Customer)
- Vehicle management
- Booking management with date overlap checks
- Automatic price calculation
- PostgreSQL (NeonDB) integration
- Clean architecture (Controller → Service → DB)

## 🛠 Tech Stack
- Node.js
- TypeScript
- Express.js
- PostgreSQL (NeonDB)
- pg (Pool)
- JWT
- bcrypt

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/vehicle-rental-api.git
cd vehicle-rental-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
```env
PORT=5000
DATABASE_URL=
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=
JWT_EXPIRES_IN=7d
```

### 4. Database Setup
```bash
npm run dev
```

### 5. API Base URL
```bash
/api/v1
```

### 📌 Example Endpoints
- POST /auth/sgnup  
- POST /auth/signin  
- GET /vehicles  
- POST /bookings

### 👨‍🎓 Author
Syed Sowad Ephraim Ali  
godposeidon001@gmail.com