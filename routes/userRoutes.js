const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../auth');

// User Registration
router.post('/register', userController.registerUser); 

// User Login
router.post('/login', userController.loginUser);

// Get User Profile
router.get('/profile', auth.verify, userController.getProfile); // Assuming you meant getProfile

// Set User as Admin (method needs to be defined in userController.js)
// router.put('/setAdmin/:userId', auth.verify, auth.verifyAdmin, userController.setAsAdmin); 

// Update Password (method needs to be defined in userController.js)
// router.put('/updatePassword', auth.verify, userController.updatePassword); 

module.exports = router;
