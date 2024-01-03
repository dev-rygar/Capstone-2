const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../auth');

// User Registration
router.post('/register', userController.registerUser); 

// User Login
router.post('/login', auth.verify, userController.loginUser);

router.get('/all', auth.verify, auth.verifyAdmin, auth.isLoggedIn, userController.getAllUsers);

// Get User Profile
router.get("/details", auth.verify, auth.isLoggedIn, userController.getProfile);

router.put('/updateAdmin', auth.verify, auth.verifyAdmin, auth.isLoggedIn, userController.setUserAsAdmin);

router.post('/reset-password', auth.verify, auth.isLoggedIn, userController.resetPassword);

router.put('/update', auth.verify, auth.isLoggedIn, userController.updateUser);

router.delete('/:userId', auth.verify, auth.isLoggedIn, userController.deleteUser);

module.exports = router;

// Archived Code:

// router.post('/reset-password/:userId', auth.verify, userController.resetPassword);