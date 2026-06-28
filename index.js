const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const matchRoutes = require('./routes/matchRoutes');
const authRoutes = require('./routes/authRoutes');
const path = require('path');

app.use(cors());
app.use(express.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);

app.get('/api', (req, res) => {
  res.send('Gully Cricket Scorer API is running...');
});

// Catch-all to serve index.html for React Router
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Database Connection & Seed Default User
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/criket')
  .then(async () => {
    console.log('MongoDB connected');
    try {
      const User = require('./models/User');
      const testPhone = '1234567890';
      const userExists = await User.findOne({ phoneNumber: testPhone });
      if (!userExists) {
        const defaultUser = new User({
          phoneNumber: testPhone,
          password: 'password123'
        });
        await defaultUser.save();
        console.log('Default user seeded successfully (1234567890 / password123)');
      } else {
        console.log('Default user already exists in database');
      }
    } catch (err) {
      console.error('Error seeding default user:', err);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
