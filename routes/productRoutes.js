const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../auth');

// Create a product
router.post('/create', auth.verify, auth.verifyAdmin, productController.createProduct);

router.put('/edit/:id', auth.verify, auth.verifyAdmin, productController.editProduct);

router.get('/all', auth.verify, productController.getAllProducts);

router.get('/:id', auth.verify, productController.getProductById);

router.patch('/archive/:id', auth.verify, auth.verifyAdmin, productController.archiveProduct);

router.patch('/activate/:id', auth.verify, auth.verifyAdmin, productController.activateProduct);

router.get('/search/name', productController.searchProductsByName);

router.get('/search/price-range', productController.searchProductsByPriceRange);


module.exports = router;