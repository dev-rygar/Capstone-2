//[Section] Activity
		const mongoose = require('mongoose');

		const userSchema = new mongoose.Schema({
			
			firstName: {
				type: String,
				required: [true, 'First Name is Required']
			},
			lastName: {
				type: String,
				required: [true, 'Last Name is Required']
			},
			email: {
				type: String,
				required: [true, 'Email is Required'],
				validate: {
					validator: function(value) {
						// Use a regular expression to check if the email contains "@" symbol
						return /\@/.test(value);
					},
					message: 'Email must contain the @ symbol'
				}
			},
			password: {
				type: String,
				required: [true, 'Password is Required'],
				minlength: [8, 'Password must be at least 8 characters long']
				
			},
			isAdmin: {
				type: Boolean,
				default: false
			},
			mobileNo: {
				type: String,
				required: [true, 'Mobile Number is Required'],
				validate: {
					validator: function(value) {
						// Use a regular expression to check if the mobileNo is exactly 11 characters long
						return /^\d{11}$/.test(value);
					},
					message: 'Mobile Number must be exactly 11 digits long'
				}
			}
		});


		module.exports = mongoose.model('User', userSchema);