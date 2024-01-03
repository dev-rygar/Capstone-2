const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../auth');

router.get('/get-cart', auth.verify, auth.isLoggedIn, cartController.getUserCart);
router.post('/add-to-cart', auth.verify, auth.isLoggedIn, cartController.addToCart);
router.put('/update-cart-quantity', auth.verify, auth.isLoggedIn, cartController.updateCartItemQuantity);
router.delete('/:productId/remove-from-cart', auth.verify,  auth.isLoggedIn, cartController.removeProductFromCart);
router.put('/clear-cart', auth.verify, auth.isLoggedIn, cartController.clearCart);


module.exports = router;