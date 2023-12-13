const Product = require("../models/Product");
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');

module.exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, qty } = req.body; 

        let newProduct = new Product({
            name,
            description,
            price,
            qty 
        });

        await newProduct.save();
        res.status(201).send({ message: "Product created successfully" });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, qty } = req.body;

        // Find the product and update its details
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { name, description, price, qty },
            { new: true, omitUndefined: true } // Returns the updated document and omits undefined fields
        );

        if (!updatedProduct) {
            return res.status(404).send({ message: 'Product not found' });
        }

        res.status(200).send({ message: 'Product updated successfully', updatedProduct });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.getAllProducts = (req, res) => {
    return Product.find({})
        .then((result) => {
            res.status(200).send({ result });
        })
        .catch((error) => {
            res.status(500).send({ message: "Error retrieving products", error }); 
        });
};

module.exports.getProductById = (req, res) => {
    const productId = req.params.id; // Assuming the product ID is passed as a URL parameter

    return Product.findById(productId)
        .then(product => {
            if (!product) {
                return res.status(404).send({ message: 'Product not found' });
            } else {
                return res.status(200).send({ product });
            }
        })
        .catch(error => {
            res.status(500).send({ message: 'Error retrieving product', error });
        });
};

module.exports.archiveProduct = (req, res) => {
    const productId = req.params.id; // Assuming the product ID is passed as a URL parameter
    const updateActiveField = { isActive: false };

    // Admin check is handled by middleware in the route
    return Product.findByIdAndUpdate(productId, updateActiveField, { new: true }) // 'new: true' to return the updated document
        .then(archivedProduct => {
            if (!archivedProduct) {
                return res.status(404).send({ message: 'Product not found' });
            }
            return res.status(200).send({ message: 'Product archived successfully', archivedProduct });
        })
        .catch(error => {
            console.error("Error in archiving a product: ", error);
            return res.status(500).send({ message: 'Failed to archive product' });
        });
};

module.exports.activateProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Assuming the product ID is passed as a URL parameter

        // Update the isActive field to true
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { isActive: true }, 
            { new: true } // 'new: true' to return the updated document
        );

        if (!updatedProduct) {
            return res.status(404).send({ message: 'Product not found' });
        }

        res.status(200).send({ message: 'Product activated successfully', updatedProduct });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.searchProductsByName = async (req, res) => {
    try {
        const { name } = req.query; // Assuming the name to search is passed as a query parameter

        const products = await Product.find({ 
            name: { $regex: name, $options: 'i' } // Case-insensitive search
        });

        res.status(200).send(products);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports.searchProductsByPriceRange = async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query; // Assuming min and max prices are passed as query parameters

        const products = await Product.find({ 
            price: { $gte: minPrice, $lte: maxPrice }
        });

        res.status(200).send(products);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};