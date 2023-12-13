const User = require("../models/User");
const bcrypt = require("bcrypt");
const auth = require("../auth");

module.exports.getAllUsers = (req, res) => {
  return User.find({})
    .then((result) => {
      res.status(200).send({ result });
    })
    .catch((error) => {
      res.status(500).send({ message: "Error retrieving users", error });
    });
};

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

module.exports.getProfile = (req, res) => {
  console.log(req.user.id);
  return User.findById(req.user.id)
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      } else {
        if (req.user.id === req.body._id) {
          user.password = "";
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