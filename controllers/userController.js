const User = require("../models/User");
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');


module.exports.registerUser = (req, res) => {
    User.findOne({ email: req.body.email })
        .then((existingUser) => {
            if (existingUser) {
                
                return res.status(400).send({
                    message: 'Registration failed: This email is already in use. Please try a different email.'
                });
            } else {
                
                let newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    locationType: req.body.locationType,
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, 10),
                    isAdmin: req.body.isAdmin || false, 
                    mobileNo: req.body.mobileNo,
                });

  
                newUser.save()
                    .then((user) => {
                        console.log("User saved to database", user);
                        res.status(201).send({ 
                            message: "Congratulations! Your account has been created successfully!" 
                        });
                    })
                    .catch((error) => {
                        console.error("Error saving user", error);
                        res.status(500).send({
                            message: 'Registration error: Something went wrong. Please try again later.', 
                            error
                        });
                    });
            }
        })
        .catch((error) => {
            console.error("Error in registration process", error);
            res.status(500).send({
                message: 'Registration error: Something went wrong. Please try again later.', 
                error
            });
        });
};

module.exports.loginUser = (req, res) => {
  return User.findOne({ email: req.body.email })
    .then((result) => {
      if (result == null) {
        return res.status(404).send({ error: 'Email not registered. Please check your email or sign up.' });
      } else {

        const isPasswordCorrect = bcrypt.compareSync(
          req.body.password,
          result.password
        ); 

        if (isPasswordCorrect == true) {
        const userData = {
            id: result._id,
            email: result.email,
            isAdmin: result.isAdmin
        };

        return res
            .status(200)
            .send({ message: 'Logged in successfully!', user: userData, access: auth.createAccessToken(result) });
        }
      }
    })
    .catch((error) => {
      res.status(500).send({ message: 'There was an issue with the login process. Please try again later.', error });
    });
};


module.exports.getAllUsers = (req, res) => {
  return User.find({})
    .then((result) => {
      res.status(200).send({message: 'List of all users retrieved successfully.', result });
    })
    .catch((error) => {
      res.status(500).send({ message: 'Unable to retrieve user list. Please try again later.', error }); 
    });
};

module.exports.getProfile = (req, res) => {
    const authenticatedUserId = req.user.id; 
    const isAdmin = req.user.isAdmin; 
    const requestedUserId = req.query.userId || authenticatedUserId;

    if (!isAdmin && requestedUserId !== authenticatedUserId) {
        return res.status(403).send({ error: 'Access denied. You are not authorized to view this profile.'});
    }

    User.findById(requestedUserId)
    .then(user => {
        if (!user) {
            return res.status(404).send({ error: 'Profile not found. Please check the user ID and try again.' });
        }
        user.password = undefined; 
        res.status(200).send({ user });
    })
    .catch(error => {
        res.status(500).send({ error: 'Sorry, there was a problem fetching the profile. Please try again later.' });
    });
};


exports.setUserAsAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: 'Please provide a valid user ID.' });
        }

        const userToUpdate = await User.findById(userId);

        if (!userToUpdate) {
            return res.status(404).send({ message: 'No matching user found. Please verify the user ID.'});
        }

        userToUpdate.isAdmin = true;
        await userToUpdate.save();

        const fullName = `${userToUpdate.firstName} ${userToUpdate.lastName}`;

        res.status(200).send({ message: `${fullName} is now set as an admin.` });
    } catch (error) {
        res.status(500).send({ message:'Sorry, there was a problem processing your request. Please try again later.', error: error.message });
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const authenticatedUserId = req.user.id;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(authenticatedUserId, { password: hashedPassword });

        res.status(200).send({ message: 'Your password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
        res.status(500).send({ message: 'Sorry, we encountered an issue resetting your password. Please try again later.', error: error.message });
    }
};

module.exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email } = req.body;

        const emailExists = await User.findOne({ email: email, _id: { $ne: userId } });
        if (emailExists) {
            return res.status(400).send({ message: 'This email is already linked to an account. Please use a different email or contact support for assistance.'});
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { firstName, lastName, email },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: 'No matching user found. Please check your information and try again.' });
        }

        updatedUser.password = undefined;

        res.status(200).send({ message: 'Profile updated! Your changes have been saved.', user: updatedUser });
    } catch (error) {
        res.status(500).send({ message: 'Oops! Something went wrong on our end. Please try again later.', error: error.message });
    }
};


module.exports.deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.userId;
        const requestingUserId = req.user.id;
        const requestingUserIsAdmin = req.user.isAdmin;

        // Check if the requesting user is the account owner or an admin
        if (requestingUserId !== userIdToDelete && !requestingUserIsAdmin) {
            return res.status(403).send({ message: 'You do not have permission to delete this account.' });
        }

        // Delete the user account
        const deletedUser = await User.findByIdAndDelete(userIdToDelete);
        if (!deletedUser) {
            return res.status(404).send({ message: 'Account deletion failed, user not found.' });
        }

        res.status(200).send({ message: "Account deleted successfully. We're sorry to see you go." });
    } catch (error) {
        res.status(500).send({ message: 'There was a problem deleting the account. Please try again later.', error: error.message });
    }
};


// Archived Section:

// module.exports.resetPassword = async (req, res) => {
//     try {
//         const { newPassword } = req.body;
//         const authenticatedUserId = req.user.id; 

//         if (authenticatedUserId !== req.params.userId) {
//             return res.status(403).send({ message: 'Unauthorized to reset password for this user' });
//         }

//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         await User.findByIdAndUpdate(authenticatedUserId, { password: hashedPassword });

//         res.status(200).send({ message: 'Password reset successfully' });
//     } catch (error) {
//         res.status(500).send({ message: 'Internal Server Error', error: error.message });
//     }
// };