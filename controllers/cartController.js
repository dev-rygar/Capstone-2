const Cart = require("../models/Cart");
const Product = require('../models/Product');
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');

module.exports.getUserCart = (req, res) => {
    const userId = req.user.id; // Assuming the user ID is extracted from the token

    return Cart.findOne({ userId: userId }).populate('items.productId')
        .then(cart => {
            if (!cart) {
                return res.status(404).send({ message: 'Cart not found' });
            } else {
                return res.status(200).send(cart);
            }
        })
        .catch(error => {
            res.status(500).send({ message: 'Error retrieving cart', error });
        });
};

module.exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        // Retrieve the product to get its price
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Calculate subtotal for the added item
        const subtotal = product.price * quantity;

        // Find the user's cart or create a new one if it doesn't exist
        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            { 
                $push: { 
                    items: { productId, quantity, subtotal } 
                },
                $inc: { totalPrice: subtotal } // Increment total price
            },
            { new: true, upsert: true } // Create a new cart if it doesn't exist
        );

        res.status(200).send({ message: "Product added to cart successfully", cart });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};