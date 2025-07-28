const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Improved MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://rahulbanoth:rahul1661@rahul7.g2y3a30.mongodb.net/carwash', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      retryWrites: true,
      w: 'majority'
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Booking Schema
const bookingSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  car: String,
  date: String,
  address: String,
  amount: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// API Routes
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});






const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY',
  key_secret: 'YOUR_RAZORPAY_SECRET'
});

app.post('/api/create-order', async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Razorpay expects paise
      currency: 'INR'
    };
    const order = await razorpay.orders.create(options);
    res.send(order);
  } catch (err) {
    res.status(500).send(err);
  }
});













// Initialize server after DB connection
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});