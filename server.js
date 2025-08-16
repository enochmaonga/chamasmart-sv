const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const tenantRegRoute = require('./routes/tenantRegRoute');
const dashboardRoutes = require('./routes/dashboardRoutes');



dotenv.config();

const app = express();
app.use(express.json());

// Middleware
app.use(cors({
  origin: ['http://localhost:3001',
  'http://localhost:3001'],
  credentials: true, // if you're sending cookies or headers
}));

// Routes
app.use('/api/', userRoutes);
app.use('/api', authRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tenants', tenantRegRoute);



// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
})
.catch((err) => console.error('MongoDB connection error:', err));
