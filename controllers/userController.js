const User = require("../models/User");
const bcrypt = require("bcrypt");
const auth = require("../auth");


// Updated .Catch() w/ Status code.
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
          // bcrypt.hashSync is to hide the actual password
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
      // res.status(500).send(false);
    });
};

// Updated .Catch() w/ status code.
module.exports.loginUser = (req, res) => {
  return User.findOne({ email: req.body.email })
    .then((result) => {
      if (result == null) {
        return res.status(404).send({ error: "No Email Found" });
      } else {
        // verify password
        // Syntax: bcrypt.compareSync(userInput, bcryptedPasswordFromDatabase)
        const isPasswordCorrect = bcrypt.compareSync(
          req.body.password,
          result.password
        ); // true or false

        if (isPasswordCorrect == true) {
          // if the password matches, it will create/generate a token
          return res
            .status(200)
            .send({ access: auth.createAccessToken(result) });
        } else {
          // if the password does not match it should response that it does not match "Email and/or password do not match"
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

// Retrieve all users (for admin only)
// Updated .Catch() w/ Status code.
module.exports.getAllUsers = (req, res) => {
  return User.find({})
    .then((result) => {
      res.status(200).send({ result });
    })
    .catch((error) => {
      res.status(500).send({ message: "Error retrieving users", error }); // 500 Internal Server Error
    });
};

module.exports.getProfile = (req, res) => {
  // Debugging: Print the received user ID
  console.log(req.user.id);
  return User.findById(req.user.id)
    .then((user) => {
      if (!user) {
        // console.log('result not found in the database');
        return res.status(404).send({ message: "User not found" });
      } else {
        if (req.user.id === req.body._id) {
          user.password = "";
          // console.log('User found:', user);
          return res.status(200).send(user);
        } else {
          return res.send("Error invalid user and token");
        }
      }
    })
    .catch((error) => {
      console.error("Error while finding user:" + error);
      res.status(500).send({ message: "Find failed" + error });
    });
};
