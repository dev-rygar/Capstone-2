const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../auth');

// Create a product
router.post('/create', auth.verify, auth.verifyAdmin, productController.createProduct);

router.get('/all', auth.verify, productController.getAllProducts);

router.get('/:id', auth.verify, productController.getProductById);

router.patch('/archive/:id', auth.verify, auth.verifyAdmin, productController.archiveProduct);

router.patch('/activate/:id', auth.verify, auth.verifyAdmin, productController.activateProduct);

module.exports = router;