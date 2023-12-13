require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

// Importing new routes
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product"); // Ensure this file exists
const cartRoutes = require("./routes/cart"); // Ensure this file exists

// Setup
const app = express();
const port = process.env.PORT || 4000;

// Passport configuration
require("./passport");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

// Routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);

// Starting the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
