const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../auth');

// User Registration
router.post('/register', userController.register);

// User Login
router.post('/login', userController.login);

// Get User Details
router.get('/details', auth.verify, userController.getUserDetails);

// Set User as Admin
router.put('/setAdmin/:userId', auth.verify, auth.verifyAdmin, userController.setAsAdmin);

// Update Password
router.put('/updatePassword', auth.verify, userController.updatePassword);

module.exports = router;