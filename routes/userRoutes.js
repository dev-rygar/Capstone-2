const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../auth');

// User Registration
router.post('/register', userController.registerUser); 

// User Login
router.post('/login', userController.loginUser);

router.get('/all', auth.verify, auth.verifyAdmin, userController.getAllUsers);

// Get User Profile
router.get("/details", auth.verify, userController.getProfile);

router.put('/updateAdmin', auth.verify, auth.verifyAdmin, userController.setUserAsAdmin);

router.post('/reset-password', auth.verify, userController.resetPassword);



// Update Password (method needs to be defined in userController.js)
// router.put('/updatePassword', auth.verify, userController.updatePassword); 

module.exports = router;