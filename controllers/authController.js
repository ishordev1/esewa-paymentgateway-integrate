const User = require('../models/User');
const Order = require('../models/Order');

// Show signup page
exports.getSignup = (req, res) => {
    res.render('auth/signup', { error: null, success: null });
};

// Handle signup
exports.postSignup = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone, street, city, state, zipCode } = req.body;
        
        // Validation
        if (password !== confirmPassword) {
            return res.render('auth/signup', { 
                error: 'Passwords do not match',
                success: null 
            });
        }
        
        if (password.length < 6) {
            return res.render('auth/signup', { 
                error: 'Password must be at least 6 characters long',
                success: null 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/signup', { 
                error: 'Email already registered',
                success: null 
            });
        }
        
        // Create new user
        const user = new User({
            name,
            email,
            password,
            role: 'customer',
            phone,
            address: {
                street,
                city,
                state,
                zipCode
            }
        });
        
        await user.save();
        
        res.render('auth/login', { 
            error: null,
            success: 'Account created successfully! Please login.' 
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.render('auth/signup', { 
            error: 'An error occurred. Please try again.',
            success: null 
        });
    }
};

// Show login page
exports.getLogin = (req, res) => {
    res.render('auth/login', { error: null, success: null });
};

// Handle login
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('auth/login', { 
                error: 'Invalid email or password',
                success: null 
            });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.render('auth/login', { 
                error: 'Invalid email or password',
                success: null 
            });
        }
        
        // Set session
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;
        
        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', { 
            error: 'An error occurred. Please try again.',
            success: null 
        });
    }
};

// Google OAuth callback
exports.googleCallback = (req, res) => {
    try {
        // User is authenticated via Passport
        const user = req.user;
        
        // Set session
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;
        
        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/');
        }
        
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect('/login');
    }
};

// Handle logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
};

// Show user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.redirect('/login');
        }
        
        // Get user's recent orders
        const orders = await Order.find({ 'customer.email': user.email })
            .populate('items.product')
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.render('auth/profile', { 
            user,
            orders,
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).send('Error loading profile');
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, street, city, state, zipCode, currentPassword, newPassword, confirmNewPassword } = req.body;
        
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.redirect('/login');
        }
        
        // Update basic info
        user.name = name;
        user.phone = phone;
        user.address = {
            street,
            city,
            state,
            zipCode
        };
        
        // Update password if provided
        if (currentPassword && newPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            
            if (!isMatch) {
                return res.render('auth/profile', { 
                    user,
                    error: 'Current password is incorrect',
                    success: null
                });
            }
            
            if (newPassword !== confirmNewPassword) {
                return res.render('auth/profile', { 
                    user,
                    error: 'New passwords do not match',
                    success: null
                });
            }
            
            if (newPassword.length < 6) {
                return res.render('auth/profile', { 
                    user,
                    error: 'Password must be at least 6 characters long',
                    success: null
                });
            }
            
            user.password = newPassword;
        }
        
        await user.save();
        
        // Update session name
        req.session.userName = user.name;
        
        res.render('auth/profile', { 
            user,
            error: null,
            success: 'Profile updated successfully!'
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        const user = await User.findById(req.session.userId);
        res.render('auth/profile', { 
            user,
            orders: [],
            error: 'An error occurred. Please try again.',
            success: null
        });
    }
};

// Get order history
exports.getOrderHistory = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.redirect('/login');
        }
        
        // Get all orders for this user
        const orders = await Order.find({ 'customer.email': user.email })
            .populate('items.product')
            .sort({ createdAt: -1 });
        
        res.render('auth/order-history', {
            title: 'My Orders',
            user,
            orders,
            userName: user.name
        });
        
    } catch (error) {
        console.error('Order history error:', error);
        res.status(500).send('Error loading orders');
    }
};

// Get single order detail
exports.getOrderDetail = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.redirect('/login');
        }
        
        const order = await Order.findById(req.params.id)
            .populate('items.product');
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        
        // Verify order belongs to user
        if (order.customer.email !== user.email) {
            return res.status(403).send('Access denied');
        }
        
        res.render('auth/order-detail', {
            title: 'Order Details',
            user,
            order,
            userName: user.name
        });
        
    } catch (error) {
        console.error('Order detail error:', error);
        res.status(500).send('Error loading order');
    }
};
