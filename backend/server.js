const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true
}));

app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/patientportal')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// Patient Schema
const patientSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'patient' },
  appointments: [{
    doctor: String,
    date: Date,
    status: String
  }]
});

const Patient = mongoose.model('Patient', patientSchema);

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('👤 Login attempt for:', email); // DEBUG LOG
    
    let patient = await Patient.findOne({ email });
    
    if (!patient) {
      console.log('➕ Creating new patient:', email);
      patient = new Patient({
        name: 'Test Patient',
        email: email || 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'patient'
      });
      await patient.save();
    } else {
      console.log('👤 Existing patient found:', email);
    }

    // Generate JWT token
    const token = jwt.sign({ patientId: patient._id }, 'secretkey', { expiresIn: '1h' });
    
    console.log('✅ Login SUCCESS for:', email); // DEBUG LOG
    
    res.json({
      success: true,
      token,
      patient: {
        name: patient.name,
        email: patient.email,
        role: patient.role,
        appointments: patient.appointments || []
      }
    });
  } catch (error) {
    console.error('❌ Login ERROR:', error.message);
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const testPatient = await Patient.findOne({ email: 'test@example.com' });
    res.json(testPatient || { message: 'No test patient found' });
  } catch (error) {
    res.json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
