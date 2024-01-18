const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../auth');


router.post('/checkout', auth.verify, auth.isLoggedIn, orderController.createOrder);

router.get('/my-orders', auth.verify, auth.isLoggedIn, orderController.getUserOrders);

router.get('/all-orders', auth.verify, auth.verifyAdmin, auth.isLoggedIn, orderController.getAllOrders);

router.put('/complete/:orderId', auth.verify, auth.isLoggedIn, orderController.completeOrder);

router.put('/cancel/:orderId', auth.verify, auth.isLoggedIn, orderController.cancelOrder);

router.get('/invoice/:orderId', auth.verify, auth.isLoggedIn, orderController.generateInvoice);

module.exports = router;