const Product = require('../models/Product');
const fs = require('fs').promises;
const path = require('path');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('admin/products', { 
            user: req.session.userName,
            products,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).send('Error loading products');
    }
};

// Show add product form
exports.getAddProduct = (req, res) => {
    res.render('admin/product-form', { 
        user: req.session.userName,
        product: null,
        error: null 
    });
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const { name, description, category, featured, variants } = req.body;
        
        // Parse variants (sent as JSON string from form)
        let parsedVariants = [];
        if (typeof variants === 'string') {
            parsedVariants = JSON.parse(variants);
        } else {
            parsedVariants = variants;
        }
        
        // Handle uploaded images
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        const product = new Product({
            name,
            description,
            category,
            images,
            variants: parsedVariants,
            featured: featured === 'on' || featured === true
        });
        
        await product.save();
        
        res.redirect('/admin/products?success=Product added successfully');
    } catch (error) {
        console.error('Create product error:', error);
        res.render('admin/product-form', { 
            user: req.session.userName,
            product: null,
            error: 'Error creating product: ' + error.message 
        });
    }
};

// Show edit product form
exports.getEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.redirect('/admin/products?error=Product not found');
        }
        
        res.render('admin/product-form', { 
            user: req.session.userName,
            product,
            error: null 
        });
    } catch (error) {
        console.error('Get edit product error:', error);
        res.redirect('/admin/products?error=Error loading product');
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, category, featured, variants, existingImages } = req.body;
        
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.redirect('/admin/products?error=Product not found');
        }
        
        // Parse variants
        let parsedVariants = [];
        if (typeof variants === 'string') {
            parsedVariants = JSON.parse(variants);
        } else {
            parsedVariants = variants;
        }
        
        // Handle images
        let images = [];
        if (existingImages) {
            images = Array.isArray(existingImages) ? existingImages : [existingImages];
        }
        
        // Add new uploaded images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            images = [...images, ...newImages];
        }
        
        product.name = name;
        product.description = description;
        product.category = category;
        product.images = images;
        product.variants = parsedVariants;
        product.featured = featured === 'on' || featured === true;
        
        await product.save();
        
        res.redirect('/admin/products?success=Product updated successfully');
    } catch (error) {
        console.error('Update product error:', error);
        res.redirect('/admin/products?error=Error updating product');
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.redirect('/admin/products?error=Product not found');
        }
        
        // Delete images from filesystem
        for (const imagePath of product.images) {
            try {
                const fullPath = path.join(__dirname, '..', 'public', imagePath);
                await fs.unlink(fullPath);
            } catch (err) {
                console.error('Error deleting image:', err);
            }
        }
        
        await Product.findByIdAndDelete(req.params.id);
        
        res.redirect('/admin/products?success=Product deleted successfully');
    } catch (error) {
        console.error('Delete product error:', error);
        res.redirect('/admin/products?error=Error deleting product');
    }
};
