const express = require("express");
const router = express.Router();
const productController = require("../controllers/product")

const auth = require("../auth");
const {verify, verifyAdmin} = auth;

//Add a Product
router.post("/", verify, verifyAdmin, productController.addProduct)

// Retrieve all Products
router.get("/all", verify, verifyAdmin, productController.getAllProducts);

//Get a specific Product
router.get("/:productId", productController.getAllActive);

//Archiving a product
router.patch("/:productId/archive", verify, verifyAdmin, productController.archiveProduct);

//Activating an inactive Product
 router.patch("/:productId/activate", verify, verifyAdmin, productController.archiveProduct);







module.exports = router;