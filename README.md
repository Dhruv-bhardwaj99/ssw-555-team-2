Patient Portal Backend - README.md
🚀 Full-Stack Patient Portal Backend
Node.js + Express + MongoDB API for patient login and dashboard data.

Status: ✅ Production Ready - Connected to React Native frontend!

📋 Quick Setup (2 minutes)
# 1. Clone repo
git clone https://github.com/Dhruv-bhardwaj99/ssw-555-team-2.git
cd ssw-555-team-2/backend

# 2. Install dependencies
npm install

# 3. Create .env file
echo MONGO_URI=mongodb://localhost:27017/patientportal > .env
echo JWT_SECRET=secretkey >> .env

# 4. Start server
npm start
# OR
node server.js


Expected Output:
🚀 Backend running on http://localhost:5000
✅ MongoDB Connected

Login Flow:
Frontend → POST /api/login {email: "user@example.com"}
Backend → Find/create patient in MongoDB
Backend → Return patient data + JWT token
Frontend → Show dashboard with real data ✅


🔧 Environment Variables
Create backend/.env:
MONGO_URI=mongodb://localhost:27017/patientportal
JWT_SECRET=secretkey
PORT=5000


🗄 Database Schema
Patient {
  name: String,
  email: String (unique),
  password: String,
  role: "patient",
  appointments: [{
    doctor: String,
    date: Date,
    status: String
  }]
}


🔍 Backend Logs (Expected)
👤 Login attempt for: apothuri@stevens.edu
👤 Existing patient found: apothuri@stevens.edu
✅ Login SUCCESS for: apothuri@stevens.edu
POST /api/login 200 45ms - 245


Patient Portal Backend = 🚀 Production Ready!

Live Demo: Login → Dashboard → Real MongoDB data flow!

Repo: https://github.com/Dhruv-bhardwaj99/ssw-555-team-2/tree/master/backend


