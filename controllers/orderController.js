const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');


const SHIPPING_FEES = {
    'Metro Manila': 100, 
    'Province': 150
};

const VAT_RATE = 0.12; // 12% VAT in the Philippines


module.exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId: userId });

        if (!cart || cart.items.length === 0) {
            return res.status(400).send({ message: 'Cart is empty' });
        }

        const user = await User.findById(userId);
        if (!user || !user.locationType) {
            return res.status(404).send({ message: 'User not found or location type missing' });
        }

        const shippingFee = SHIPPING_FEES[user.locationType] || 0;

        for (let item of cart.items) {
            const product = await Product.findById(item.productId);
            if (item.quantity > product.qty) {
                return res.status(400).send({ message: `Not enough stock for product: ${product.name}` });
            }
        }

        const orderItems = [];
        for (let item of cart.items) {
            const product = await Product.findById(item.productId);
            await Product.findByIdAndUpdate(item.productId, { $inc: { qty: -item.quantity } });
            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                subtotal: item.subtotal
            });
        }

        const order = new Order({
            userId: userId,
            productOrdered: orderItems,
            totalPrice: cart.totalPrice + shippingFee, 
            status: 'pending'
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0 } });

        res.status(201).send({ 
            message: 'Order created successfully',
            order: {
                ...order._doc, 
                shippingFee: shippingFee 
            }
        });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.getAllOrders = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).send({ message: 'Access denied' });
        }

        const orders = await Order.find({})
                                  .populate('userId', 'firstName lastName')
                                  .select('-__v');
                                  
        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            user: `${order.userId.firstName} ${order.userId.lastName}`,
            totalPrice: order.totalPrice,
            status: order.status,
            orderedOn: order.orderedOn
            
        }));

        res.status(200).send({message: 'Here are the user orders, if no orders the result is empty array. ', formattedOrders});
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ userId: userId })
                                  .populate('userId', 'firstName lastName')
                                  .select('-__v'); 

        if (orders.length === 0) {
            return res.status(404).send({ message: 'No orders found for this user' });
        }

       
        const userOrders = orders.map(order => ({
            orderId: order._id,
            totalPrice: order.totalPrice,
            status: order.status,
            orderedOn: order.orderedOn
        }));

        res.status(200).send({message: 'Here are your orders! ',userOrders});
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.completeOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId }).populate('productOrdered.productId');

        if (!order) {
            return res.status(404).send({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).send({ message: 'Order is not in a state that can be completed' });
        }

        for (const item of order.productOrdered) {
            await Product.findByIdAndUpdate(item.productId._id, { 
                $inc: { salesCount: item.quantity }
            });
        }

        order.status = 'completed';
        await order.save();

        res.status(200).send({ message: 'Order marked as complete', order });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.status(404).send({ message: 'Order not found or access denied' });
        }

       
        if (order.status !== 'cancelled') {
            for (const item of order.productOrdered) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { qty: item.quantity } });
            }
        }

 
        order.status = 'cancelled';
        await order.save();

        res.status(200).send({ message: 'Order has been canceled', order });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId)
                                 .populate('userId', 'firstName lastName email locationType')
                                 .populate('productOrdered.productId');

        if (!order) {
            return res.status(404).send({ message: 'Order not found' });
        }

        if (order.status !== 'completed') {
            return res.status(400).send({ message: 'Invoice can only be generated for completed orders' });
        }

        const shippingFee = SHIPPING_FEES[order.userId.locationType] || 0;
        const subtotal = (order.totalPrice - shippingFee) / (1 + VAT_RATE);
        const vatAmount = order.totalPrice - subtotal - shippingFee;

        const invoice = {
            invoiceId: order._id.toString(),
            user: `${order.userId.firstName} ${order.userId.lastName}`,
            userEmail: order.userId.email,
            items: order.productOrdered.map(item => ({
                productName: item.productId.name,
                quantity: item.quantity,
                price: item.productId.price.toFixed(2),
                subtotal: item.subtotal.toFixed(2)
            })),
            subtotal: subtotal.toFixed(2),
            vatAmount: vatAmount.toFixed(2),
            shippingFee: shippingFee.toFixed(2),
            total: order.totalPrice.toFixed(2),
            date: order.orderedOn.toDateString()
        };

        res.status(200).send({ invoice });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};