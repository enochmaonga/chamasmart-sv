const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const tenantRegRoute = require('./routes/tenantRegRoute');
const dashboardRoutes = require('./routes/dashboardRoutes');
const expenseRoute = require('./routes/expenseRoute');



dotenv.config();

const app = express();
app.use(express.json());

// Middleware
app.use(cors({
  origin: ['https://chamasmart.vercel.app',
  'http://localhost:3001'],
  credentials: true, // if you're sending cookies or headers
}));

// Routes
app.use('/api/', userRoutes);
app.use('/api', authRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tenants', tenantRegRoute);
app.use('/api/expense', expenseRoute);



// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${process.env.PORT}`);
});
})
.catch((err) => console.error('MongoDB connection error:', err));
