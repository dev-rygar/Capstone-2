const Cart = require("../models/Cart");
const Product = require('../models/Product');
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');

module.exports.getUserCart = (req, res) => {
    const userId = req.user.id; 

    return Cart.findOne({ userId: userId })
        .populate({
            path: 'items.productId',
            select: 'name description qty' 
        })
        .populate({
            path: 'userId',
            select: 'firstName lastName' 
        })
        .select('-_id -__v -createdAt -updatedAt') 
        .then(cart => {
            if (!cart) {
                return res.status(404).send({ message: 'Cart not found' });
            } else {
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

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        if (product.qty < quantity) {
            return res.status(400).send({ message: 'Insufficient stock available' });
        }

        const subtotal = product.price * quantity;

        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            {
                $push: { items: { productId, quantity, subtotal } },
                $inc: { totalPrice: subtotal }
            },
            { new: true, upsert: true }
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
        const { productId, quantity } = req.body; 

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        if (product.qty < quantity) {
            return res.status(400).send({ message: 'Insufficient stock available' });
        }

        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        let itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).send({ message: 'Item not found in cart' });
        }

        cart.items[itemIndex].quantity = quantity; 
        cart.items[itemIndex].subtotal = product.price * quantity; 

        cart.totalPrice = cart.items.reduce((total, item) => total + item.subtotal, 0);

        await cart.save();

        const updatedCart = await Cart.findOne({ userId: userId })
            .populate('items.productId', 'name description qty')
            .populate('userId', 'firstName lastName');

        if (!updatedCart) {
            return res.status(404).send({ message: 'Cart not found after update' });
        }

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
        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: `Product with ID ${productId} not found` });
        }

        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).send({ message: `Cart not found for user with ID ${userId}` });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).send({ message: `${product.name} not found in cart` });
        }

    
        const removedItem = cart.items.splice(itemIndex, 1)[0];
        cart.totalPrice -= removedItem.subtotal;

        await cart.save();
        res.status(200).send({ message: `${product.name} removed from cart successfully` });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

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