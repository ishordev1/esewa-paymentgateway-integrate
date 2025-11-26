require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/database');
const passport = require('./config/passport');

// Import routes
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');

const app = express();

// Connect to database
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: false // set to true in production with HTTPS
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', shopRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/products', productRoutes);
app.use('/admin/customers', customerRoutes);
app.use('/admin/orders', orderRoutes);
app.use('/payment', paymentRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`Server is running on port ${PORT}`);
    console.log(`=================================`);
    console.log(`\nCustomer Site: http://localhost:${PORT}`);
    console.log(`Admin Panel:   http://localhost:${PORT}/admin/login`);
    console.log(`\nAdmin Credentials:`);
    console.log(`Email: admin@nursery.com`);
    console.log(`Password: admin123`);
    console.log(`\nMake sure to:`);
    console.log(`1. Update .env file with MongoDB URI`);
    console.log(`2. Run 'npm run seed' to create admin and sample products`);
    console.log(`=================================\n`);
});
