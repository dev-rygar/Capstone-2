const Course = require("../models/Product");
const bcrypt = require("bcrypt");
const auth = require("../auth");


module.exports.addProduct = (req, res) => {
    //Validation - the product should be not existing before adding to database
    Product.findOne({name: req.body.name})
    .then(result => {
        if(result){
            return res.status(409).send({error: "Product already exist"})
        }
        else{
            let newProduct = new Product({
            name : req.body.name,
            description: req.body.description,
            price: req.body.price
            })
            return newProduct.save()
            .then(savedProduct => res.status(201).send({savedProduct}))
            .catch(err => {
                console.error("Error in adding product", err)
                return res.status(500).send({error: "Failed to add Product"})
            })
        }       
    })
}

module.exports.getAllProducts = (req, res) => {
    return Product.find({})
    .then(products => { res.status(200).send({courses})})
    .catch(err => res.status(500).send({error: 'Error retrieving all products'}));
}