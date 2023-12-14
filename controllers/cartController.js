const Cart = require("../models/Cart");
const Product = require('../models/Product');
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');

module.exports.getUserCart = (req, res) => {
    const userId = req.user.id; // Assuming the user ID is extracted from the token

    return Cart.findOne({ userId: userId })
        .populate({
            path: 'items.productId',
            select: 'name description qty' // Exclude the product _id
        })
        .populate({
            path: 'userId',
            select: 'firstName lastName' // Exclude the user _id
        })
        .select('-_id -__v -createdAt -updatedAt') // Exclude certain fields
        .then(cart => {
            if (!cart) {
                return res.status(404).send({ message: 'Cart not found' });
            } else {
                // Format the response to make it better looking
                const formattedCart = {
                    user: `${cart.userId.firstName} ${cart.userId.lastName}`,
                    items: cart.items.map(item => ({
                        product: item.productId.name,
                        description: item.productId.description,
                        quantity: item.quantity,
                        subtotal: item.subtotal,
                        stockQuantity: item.productId.qty
                    })),
                    totalPrice: cart.totalPrice
                };
                return res.status(200).send(formattedCart);
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

        // Retrieve the product to get its details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Check if the requested quantity is available
        if (product.qty < quantity) {
            return res.status(400).send({ message: 'Insufficient stock available' });
        }

        // Calculate subtotal for the added item
        const subtotal = product.price * quantity;

        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            {
                $push: { items: { productId, quantity, subtotal } },
                $inc: { totalPrice: subtotal }
            },
            { new: true, upsert: true } // Create a new cart if it doesn't exist
        );

        res.status(200).send({ 
            message: `${product.name} has been added to your cart, with a quantity of ${quantity}.`
        });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.updateCartItemQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, newQuantity } = req.body;

        // Retrieve the product to check available quantity
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Check if requested quantity is available
        if (product.qty < newQuantity) {
            return res.status(400).send({ message: 'Insufficient stock available' });
        }

        // Find the user's cart
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        // Update the quantity and subtotal of the specified item
        let itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).send({ message: 'Item not found in cart' });
        }
        
        cart.items[itemIndex].quantity = newQuantity;
        cart.items[itemIndex].subtotal = product.price * newQuantity;

        // Recalculate the total price of the cart
        cart.totalPrice = cart.items.reduce((total, item) => total + item.subtotal, 0);

        // Save the updated cart
               await cart.save();

        // Reload the cart with the updated information and populate required fields
        const updatedCart = await Cart.findOne({ userId: userId })
            .populate('items.productId', 'name description qty')
            .populate('userId', 'firstName lastName');

        // Check if cart is found after update
        if (!updatedCart) {
            return res.status(404).send({ message: 'Cart not found after update' });
        }

        // Format the response
        const formattedCart = {
            message: 'Updated Cart',
            user: `${updatedCart.userId.firstName} ${updatedCart.userId.lastName}`,
            items: updatedCart.items.map(item => ({
                product: item.productId.name,
                description: item.productId.description,
                quantity: item.quantity,
                subtotal: item.subtotal,
                stockQuantity: item.productId.qty
            })),
            totalPrice: updatedCart.totalPrice
        };

        res.status(200).send(formattedCart);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.removeProductFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body; // Assuming the product ID to be removed is passed in the body

        // Find the user's cart
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        // Check if the product exists in the cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).send({ message: 'Item not found in cart' });
        }

        // Remove the item from the cart and recalculate the total price
        const itemSubtotal = cart.items[itemIndex].subtotal;
        cart.items.splice(itemIndex, 1);
        cart.totalPrice -= itemSubtotal;

        // Save the updated cart
        await cart.save();

        // Format the response (optional: you can reuse the formatting logic from 'getUserCart')
        res.status(200).send({ message: 'Product removed from cart successfully', cart });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user's cart and clear its contents
        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalPrice: 0 } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        res.status(200).send({ message: 'Cart cleared successfully', cart });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};