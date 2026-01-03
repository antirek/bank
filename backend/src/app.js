import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import businessRoutes from './routes/businesses.js';
import subscriptionRoutes from './routes/subscriptions.js';

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api', subscriptionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
