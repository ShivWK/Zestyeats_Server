import "dotenv/config"

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import Razorpay from 'razorpay';

import swiggyRouter from './routes/swiggyRouter.js';
import userRouter from './routes/userRouter.js';
import userActivityRouter from './routes/userActivityRouter.js';
import paymentRouter from './routes/paymentRouter.js';

const secret = process.env.COOKIE_SECRET;
const PORT = process.env.PORT || 5000;
const mongooseURI = process.env.MONGOOSE_URI;

const allowedOrigins = [
  'http://localhost:5173',
  'https://zestyeats-beige-gamma.vercel.app',
  'https://zestyeats.shivendra.site',
];

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser(secret));

mongoose
  .connect(mongooseURI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.log(`MongoDB connection error: ${err}`);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.status(200).send(`Swiggy Proxy API server is running.`);
});

app.get('/api/server/wake-up', (req, res) => {
  console.log('Wake up call');
  res.status(200).json({
    status: 'success',
    message: "I'm awake",
  });
});

app.use('/api/zestyeats', swiggyRouter);
app.use('/api/user', userRouter);
app.use('/api/userActivity', userActivityRouter);
app.use('/api/payments', paymentRouter);

// Catch All route middleware runs for endpoint which is not handled, no need to call next() because there is no middleware or route handler is present after it.

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`Proxy server running on ${PORT}`);
});

// Activity-based session extension: If a user is active near expiry, refresh the TTL (e.g., on certain routes).

// session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
// await session.save();
