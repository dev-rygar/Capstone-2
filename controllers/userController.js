const User = require("../models/User");
const bcrypt = require("bcrypt");
const auth = require("../auth");
const mongoose = require('mongoose');


module.exports.registerUser = (req, res) => {
  return User.findOne({ email: req.body.email })
    .then((result) => {
      if (result) {
        res.send("Duplicated user");
      } else {
        if (req.body.password.length < 8){
          return res.status(400).send({message: 'Password must be at least 8 characters long.'});
        }
        let newUser = new User({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10),
          isAdmin: req.body.isAdmin,
          mobileNo: req.body.mobileNo,
        });

        return newUser
          .save()
          .then((user) =>
            res.status(201).send({ message: "Registered Successfully" })
          );
      }
    })
    .catch((error) => {
      res.status(500).send({message: "" + error});
    });
};

// Updated .Catch() w/ status code.
module.exports.loginUser = (req, res) => {
  return User.findOne({ email: req.body.email })
    .then((result) => {
      if (result == null) {
        return res.status(404).send({ error: "No Email Found" });
      } else {

        const isPasswordCorrect = bcrypt.compareSync(
          req.body.password,
          result.password
        ); 

        if (isPasswordCorrect == true) {
          return res
            .status(200)
            .send({ access: auth.createAccessToken(result) });
        } else {

          return res
            .status(401)
            .send({ message: "Email and/or password do not match" });
        }
      }
    })
    .catch((error) => {
      res.status(500).send({ message: "Login process failed", error });
    });
};


module.exports.getAllUsers = (req, res) => {
  return User.find({})
    .then((result) => {
      res.status(200).send({ result });
    })
    .catch((error) => {
      res.status(500).send({ message: "Error retrieving users", error }); 
    });
};

module.exports.getProfile = (req, res) => {
	console.log("req.user display:");
	console.log(req.user);

	return User.findById(req.user.id)
	.then(result =>{
		// validation
		if(!result){
			return res.status(404).send({error: 'User not found'});
		}
		else{
			result.password = "*****";
			return res.status(200).send({result})
		}
	})	
}

exports.setUserAsAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: 'Invalid user ID' });
        }

        const userToUpdate = await User.findById(userId);

        if (!userToUpdate) {
            return res.status(404).send({ message: 'User not found' });
        }

        userToUpdate.isAdmin = true;
        await userToUpdate.save();

        const fullName = `${userToUpdate.firstName} ${userToUpdate.lastName}`;

        res.status(200).send({ message: `${fullName} has been updated as admin successfully` });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};


// Function to reset the password
module.exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { id } = req.user; 

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(id, { password: hashedPassword });

        res.status(200).send({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};
