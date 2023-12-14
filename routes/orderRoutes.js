const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../auth');

//http://localhost:4000/orders/create
router.post('/create', auth.verify, orderController.createOrder);

router.get('/all', auth.verify, auth.verifyAdmin, orderController.getAllOrders);

// Route to get the authenticated user's orders
router.get('/my-orders', auth.verify, orderController.getUserOrders);

module.exports = router;
