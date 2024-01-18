const Product = require("../models/Product");
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');

module.exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, qty, image } = req.body; 

        let newProduct = new Product({
            name,
            description,
            price,
            qty,
            image: image || '' 
        });

        await newProduct.save();
        res.status(201).send({ message: 'New product added successfully! Ready for sale.' });
    } catch (error) {
        res.status(500).send({ message: 'Unable to create product at this moment. Please try again later.', error: error.message });
    }
};



module.exports.editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, qty } = req.body;

       
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { name, description, price, qty },
            { new: true, omitUndefined: true } 
        );

        if (!updatedProduct) {
            return res.status(404).send({ message: 'Update failed: Specified product not found in the catalog.' });
        }

        res.status(200).send({updatedProduct });
    } catch (error) {
        res.status(500).send({ message: 'There was a problem updating the product. Please try again later.', error: error.message });
    }
};


module.exports.getAllProducts = (req, res) => {
    return Product.find({})
        .then((result) => {
            res.status(200).send(result);
        })
        .catch((error) => {
            res.status(500).send({ message: 'Unable to retrieve products at this time. Please try again later.', error }); 
        });
};

module.exports.getProductById = (req, res) => {
    const productId = req.params.id; 

    return Product.findById(productId)
        .then(product => {
            if (!product) {
                return res.status(404).send({ message: 'No product found with the provided ID. Please check and try again.' });
            } else {
                return res.status(200).send({message: 'Product details retrieved successfully.', product });
            }
        })
        .catch(error => {
            res.status(500).send({ message: 'There was an issue retrieving the product details. Please try again later.', error });
        });
};

module.exports.archiveProduct = (req, res) => {
    const productId = req.params.id; 
    const updateActiveField = { isActive: false };

    
    return Product.findByIdAndUpdate(productId, updateActiveField, { new: true }) 
        .then(archivedProduct => {
            if (!archivedProduct) {
                return res.status(404).send({ message: 'Archiving failed: No product found with the provided ID.' });
            }
            return res.status(200).send({archivedProduct });
        })
        .catch(error => {
            return res.status(500).send({ message: 'Unable to archive the product at this moment. Please try again later.' });
        });
};

module.exports.activateProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { isActive: true }, 
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).send({ message: 'Activation failed: No product found with the provided ID.' });
        }

        res.status(200).send({updatedProduct });
    } catch (error) {
        res.status(500).send({ message: 'Unable to activate the product at this moment. Please try again later.', error: error.message });
    }
};

module.exports.searchProductsByName = async (req, res) => {
    try {
        const name = req.params.name;

        const products = await Product.find({ 
            name: { $regex: name, $options: 'i' }
        });

        if (products.length === 0) {
            // No matching products found
            res.status(404).send({ message: 'No products found matching specified name.' });
        } else {
            // Products found
            res.status(200).send(products);
        }
    } catch (error) {
        res.status(500).send({ message: 'Failed to search for products by name. Please try again later.' });
    }
};


module.exports.searchProductsByPriceRange = async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.query;

        let query = {};
        if (minPrice) {
            query.price = { ...query.price, $gte: minPrice };
        }
        if (maxPrice) {
            query.price = { ...query.price, $lte: maxPrice };
        }

        const products = await Product.find(query);

        res.status(200).send(products);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.getAllActive = (req, res) => {
    return Product.find({isActive: true})
        .then(result => {
            if (result.length > 0) {
                return res.status(200).send({result});
            } else {
                return res.status(200).send({ message: 'No active products found.' });
            }
            })
        .catch(err => res.status(500).send({ error: 'Internal Server Error: An unexpected issue occurred while searching for products by price range.' }));
};

module.exports.getBestSellers = async (req, res) => {
    try {
        const potentialBestSellers = await Product.find({ salesCount: { $gte: 5 } })
                                                  .sort({ updatedAt: -1 }); 

        let bestSellers;
        if (potentialBestSellers.length >= 5) {
            bestSellers = potentialBestSellers.sort((a, b) => b.salesCount - a.salesCount).slice(0, 3);
        } else {
            bestSellers = potentialBestSellers.slice(0, 3);
        }

        const bestSellerIds = bestSellers.map(product => product._id);

        res.status(200).send(bestSellerIds);
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


module.exports.adjustSalesCount = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).send({ message: 'Access denied' });
        }

        const { productId, newSalesCount } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { salesCount: newSalesCount },
            { new: true } 
        );

        if (!updatedProduct) {
            return res.status(404).send({ message: 'Product not found' });
        }

        res.status(200).send({ message: 'Sales count updated successfully', updatedProduct });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};