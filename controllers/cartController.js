const Cart = require("../models/Cart");
const Product = require('../models/Product');
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');

module.exports.getUserCart = (req, res) => {
    const userId = req.user.id; 

    return Cart.findOne({ userId: userId })
        .populate({
            path: 'items.productId',
            select: 'name description qty image price' 
        })
        .populate({
            path: 'userId',
            select: 'firstName lastName' 
        })
        .select('-_id -__v -createdAt -updatedAt') 
        .then(cart => {
            if (!cart) {
                return res.status(404).send({ message: 'Cart not found' });
            } else {
                
                const updatedItems = cart.items.map(item => {
                    const subtotal = item.quantity * item.productId.price; 
                    return {
                        productId: item.productId._id, 
                        product: item.productId.name,
                        description: item.productId.description,
                        quantity: item.quantity,
                        subtotal: subtotal, 
                        stockQuantity: item.productId.qty,
                        imageSrc: item.productId.image
                    };
                });

            
                const totalPrice = updatedItems.reduce((acc, item) => acc + item.subtotal, 0);

                const formattedCart = {
                    user: `${cart.userId.firstName} ${cart.userId.lastName}`,
                    items: updatedItems,
                    totalPrice: totalPrice 
                };
                return res.status(200).send(formattedCart);
            }
        })
        .catch(error => {
            res.status(500).send({ message: 'Error retrieving cart', error });
        });
};



// module.exports.addToCart = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { productId, quantity } = req.body;

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).send({ message: 'Product not found' });
//         }

//         if (product.qty < quantity) {
//             return res.status(400).send({ message: 'Insufficient stock available' });
//         }

//         const subtotal = product.price * quantity;

//         const cart = await Cart.findOneAndUpdate(
//             { userId: userId },
//             {
//                 $push: { items: { productId, quantity, subtotal } },
//                 $inc: { totalPrice: subtotal }
//             },
//             { new: true, upsert: true }
//         );

//         res.status(200).send({ 
//             message: `${product.name} has been added to your cart, with a quantity of ${quantity}.`
//         });
//     } catch (error) {
//         res.status(500).send({ message: 'Internal Server Error', error: error.message });
//     }
// };

// module.exports.removeProductFromCart = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { productId } = req.body;

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).send({ message: `Product with ID ${productId} not found` });
//         }

//         const cart = await Cart.findOne({ userId: userId });
//         if (!cart) {
//             return res.status(404).send({ message: `Cart not found for user with ID ${userId}` });
//         }

//         const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
//         if (itemIndex === -1) {
//             return res.status(404).send({ message: `${product.name} not found in cart` });
//         }

    
//         const removedItem = cart.items.splice(itemIndex, 1)[0];
//         cart.totalPrice -= removedItem.subtotal;

//         await cart.save();
//         res.status(200).send({ message: `${product.name} removed from cart successfully` });
//     } catch (error) {
//         res.status(500).send({ message: 'Internal Server Error', error: error.message });
//     }
// };


module.exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalPrice: 0 } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        res.status(200).send({ message: 'Cart cleared successfully', cart });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};



exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ userId });

    // Find the product to get its price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    const price = product.price;

    if (!cart) {
      const subtotal = quantity * price;
      cart = new Cart({ userId, items: [{ productId, quantity, subtotal }] });
    } else {
      const index = cart.items.findIndex(item => item.productId.equals(productId));

      if (index > -1) {
        cart.items[index].quantity += quantity;
        cart.items[index].subtotal = cart.items[index].quantity * price;
      } else {
        const subtotal = quantity * price;
        cart.items.push({ productId, quantity, subtotal });
      }
    }
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    cart.items = cart.items.filter(item => !item.productId.equals(productId));

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.updateProductQuantityInCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { productId, additionalQuantity } = req.body;
    
    let cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      await session.abortTransaction();
      return res.status(404).send("Cart not found");
    }

    const productIndex = cart.items.findIndex(item => item.productId.equals(productId));
    if (productIndex === -1) {
      await session.abortTransaction();
      return res.status(404).send("Product not found in cart");
    }

    cart.items[productIndex].quantity += additionalQuantity;

    const product = await Product.findById(productId).session(session);
    if (product) {
      cart.items[productIndex].subtotal = cart.items[productIndex].quantity * product.price;
    } else {
      await session.abortTransaction();
      return res.status(404).send("Product details not found");
    }

    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(cart);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send(error.message);
  }
};

exports.deductProductQuantityInCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { productId, quantityToDeduct } = req.body;
    
    let cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      await session.abortTransaction();
      return res.status(404).send("Cart not found");
    }

    const productIndex = cart.items.findIndex(item => item.productId.equals(productId));
    if (productIndex === -1) {
      await session.abortTransaction();
      return res.status(404).send("Product not found in cart");
    }

    cart.items[productIndex].quantity -= quantityToDeduct;

    if (cart.items[productIndex].quantity < 0) {
      await session.abortTransaction();
      return res.status(400).send("Cannot deduct more than current quantity");
    }

    const product = await Product.findById(productId).session(session);
    if (product) {
      cart.items[productIndex].subtotal = cart.items[productIndex].quantity * product.price;
    } else {
      await session.abortTransaction();
      return res.status(404).send("Product details not found");
    }

    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(cart);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send(error.message);
  }
};