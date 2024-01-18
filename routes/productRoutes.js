const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../auth');

router.post('/', auth.verify, auth.verifyAdmin, auth.isLoggedIn, productController.createProduct);

router.put('/edit/:id', auth.verify, auth.verifyAdmin, auth.isLoggedIn, productController.editProduct);

router.get('/all',auth.verify, auth.verifyAdmin, auth.isLoggedIn, productController.getAllProducts);

router.get("/", auth.verify, auth.isLoggedIn, productController.getAllActive);

router.get('/searchByPrice', auth.verify, auth.isLoggedIn, productController.searchProductsByPriceRange);

router.get('/:id', auth.verify, auth.isLoggedIn, productController.getProductById);

router.patch('/archive/:id', auth.verify, auth.verifyAdmin, auth.isLoggedIn, productController.archiveProduct);

router.patch('/activate/:id', auth.verify, auth.verifyAdmin, auth.isLoggedIn, productController.activateProduct);

router.get('/searchByName/:name', auth.verify, auth.isLoggedIn, productController.searchProductsByName);

// http://localhost:4000/products/searchByPrice?minPrice=100
// http://localhost:4000/products/searchByPrice?maxPrice=1000
// http://localhost:4000/products/searchByPrice?minPrice=100&maxPrice=500

router.get('/best-sellers', auth.verify, auth.isLoggedIn, productController.getBestSellers);

router.put('/adjust-sales-count', auth.verify, auth.verifyAdmin, auth.isLoggedIn, productController.adjustSalesCount);

module.exports = router;