// Main Package
const express = require("express");
const mongoose = require("mongoose");

// Initialization of routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const port = process.env.PORT || 4000;

// Cross-Origin Resource Sharing
const cors = require("cors");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database connection
// add your mongodb connection here
mongoose.connect("", 
	{
		useNewUrlParser: true, // For parsing/reading connection string
		useUnifiedTopology: true	// Assures that our application uses mongodb latest servers when connecting with mongo database
	});
mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas'));


// Routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use('/orders', orderRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
