const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
});

        
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Razorpay Configuration
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// Booking Schema
const bookingSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    car: String,
    date: String,
    address: String,
    amount: Number,
    status: String,
    payment_id: String,
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// API Routes

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // Convert to paise
            currency: 'INR',
            receipt: 'receipt_' + Math.random().toString(36).substring(2, 7)
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    const generated_signature = crypto.createHmac('sha256', razorpay.key_secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

    if (generated_signature === razorpay_signature) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// Save Booking
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).send(booking);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get All Bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.send(bookings);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Start Server
connectDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
