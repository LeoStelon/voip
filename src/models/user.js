const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ForgotPassword = require("./forgotpass");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		trim: true,
		required: true,
	},
	displayimg: {
		type: String,
		default: "/assets/images/default-profile-icon.jpg",
		required: true,
	},
	phone: {
		type: Number,
		unique: true,
		trim: true,
		required: true,
		validate(value) {
			if (!validator.isMobilePhone(value.toString())) {
				throw new Error("phone number is invalid");
			}
		},
	},
	channels: [
		{
			private: {
				type: mongoose.Types.ObjectId,
				required: true,
				ref: "User",
			},
			group: {
				type: mongoose.Types.ObjectId,
				required: true,
				ref: "Group",
			},
		},
	],
	tokens: [
		{
			token: {
				type: String,
				required: true,
			},
		},
	],
});

userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;

	return userObject;
};

// Instance methods
userSchema.methods.generateToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id }, "secret");
	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

userSchema.methods.generateForgotToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id }, "secret", { expiresIn: "1h" });
	const forgotpassword = new ForgotPassword({ token, userid: user._id });
	await forgotpassword.save();
	console.log(forgotpassword);
	return token;
};

// Schema methods
userSchema.statics.findByCredentials = async function (phone) {
	const user = await User.findOne({ phone });
	if (!user) {
		throw new Error("Invalid phoneno");
	}
	return user;
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
