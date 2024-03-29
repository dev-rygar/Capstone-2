const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Product price cannot be negative']
    },
    qty: { 
        type: Number,
        required: [true, 'Product quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    salesCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    image: { 
        type: String, 
        required: false 
    }
});

module.exports = mongoose.model('Product', productSchema);
