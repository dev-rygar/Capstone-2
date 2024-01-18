const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../auth');

// router.get('/get-cart', auth.verify, cartController.getUserCart);
// router.post('/add-to-cart', auth.verify, auth.isLoggedIn, cartController.addToCart);
// router.delete('/:productId/remove-from-cart', auth.verify,  auth.isLoggedIn, cartController.removeProductFromCart);
// router.put('/clear-cart', auth.verify, auth.isLoggedIn, cartController.clearCart);
// router.put('/update-quantity', auth.verify, auth.isLoggedIn, cartController.updateProductQuantityInCart);

router.post('/add', auth.verify, cartController.addToCart);
router.put('/add-quantity', auth.verify, cartController.updateProductQuantityInCart);
router.put('/deduct-quantity', auth.verify, cartController.deductProductQuantityInCart);
router.delete('/remove/:productId', auth.verify, cartController.removeFromCart);
router.delete('/clear', auth.verify, cartController.clearCart);
router.get('/', auth.verify, cartController.getUserCart);

module.exports = router;