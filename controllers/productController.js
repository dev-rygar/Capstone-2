const express = require("express");
const router = express.Router();
const productController = require("../controllers/product")

const auth = require("../auth");
const {verify, verifyAdmin} = auth;

//Add a Product
router.post("/", verify, verifyAdmin, productController.addProduct)

// Retrieve all Products
router.get("/all", verify, verifyAdmin, productController.getAllProducts);

module.exports = router;































