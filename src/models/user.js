const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ForgotPassword = require("./forgotpass");
const path=require("path")

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		trim: true,
		required: true,
	},
	email: {
		type: String,
		unique: true,
		trim: true,
		required: true,
		validate(value) {
			if (!validator.isEmail(value)) {
				throw new Error("Email is invalid");
			}
		},
	},
	password: {
		type: String,
		trim: true,
		minlength: 6,
	},
	displayimg:{
		type:String,
		default:path.join(__dirname,'../public/assets/images/default-profile-icon.png'),
		required:true,
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
userSchema.statics.findByCredentials = async function (username, password) {
	const user = await User.findOne({ username });
	if (!user) {
		throw new Error("Invalid username or password");
	}
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error("Invalid username or password");
	}
	return user;
};

userSchema.pre("save", async function (next) {
	const user = this;
	if (user.isModified("password")) {
		user.password = await bcrypt.hash(user.password, 8);
	}
	next();
});

const User = new mongoose.model("User", userSchema);

module.exports = User;
