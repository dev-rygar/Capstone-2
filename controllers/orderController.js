const Order = require('../models/Order');
const Cart = require('../models/Cart');

module.exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId: userId });

        if (!cart || cart.items.length === 0) {
            return res.status(400).send({ message: 'Cart is empty' });
        }

        const orderItems = cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            subtotal: item.subtotal
        }));

        const order = new Order({
            userId: userId,
            productOrdered: orderItems,
            totalPrice: cart.totalPrice,
            status: 'pending' // Default status
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0 } }); // Clear the cart

        res.status(201).send({ message: 'Order created successfully', order });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.getAllOrders = async (req, res) => {
    try {
        // Assuming you have a way to check if the user is an admin
        if (!req.user.isAdmin) {
            return res.status(403).send({ message: 'Access denied' });
        }

        const orders = await Order.find({}).populate('userId', 'firstName lastName');
        res.status(200).send(orders);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ userId: userId });
        if (!orders) {
            return res.status(404).send({ message: 'No orders found for this user' });
        }

        res.status(200).send(orders);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};
