const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../auth');

router.get('/', auth.verify, cartController.getUserCart);
router.post('/add', auth.verify, cartController.addToCart);

module.exports = router;