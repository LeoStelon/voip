const ForgotPassword = require("../models/forgotpass");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

const User = require("../models/user");

// Send Reset Password Email
router.post("/forgotpassword", async (req, res) => {
	const email = req.body.email;
	try {
		const user = await User.findOne({ email });
		if (user) {
			const token = await user.generateForgotToken();
			sgMail.setApiKey(process.env.SENDGRID_API_KEY);
			const msg = {
				to: email,
				from: "leostelon17@gmail.com",
				subject: "Reset Password Link latest",
				text: "Please follow the link in the mail below to reset your password",
				html: `<strong>Please Click the link below to reset your password, the link is valid only for 1 hour!</strong><br><a href="https://teamfindercorp.herokuapp.com/forgotpassword.html?token=${token}">Reset Password<a/>`,
			};
			sgMail
				.send(msg)
				.then(() => {
					console.log("Email sent");
				})
				.catch((error) => {
					console.error(error);
				});
		}
		res.send({
			message:
				"Email has been sent to the associated mail address you provided if it exist in our database.",
		});
	} catch (e) {
		res.status(500).send({ message: e });
	}
});

router.post("/resetpassword", async (req, res) => {
	if (!req.body.token || !req.body.password) {
		return res.status(400).send({ message: "No password" });
	}
	try {
		const token = await ForgotPassword.findOne({ token: req.body.token });
		if (!token) {
			return res.status(403).send({ message: "Invalid password reset link!" });
		}

		const decoded = jwt.decode(token.token, process.env.JWT_SECRET);
		if (Date.now() >= decoded.exp * 1000) {
			// Deleting all tokens generated for reset password for this user
			await ForgotPassword.deleteMany({ userid: decoded._id });
			return res.status(403).send({ message: "Link has expired!" });
		} else {
			// Updating user password
			const user = await User.findOne({ _id: decoded._id });
			user.password = req.body.password;
			user.tokens = [];
			await user.save();
		}

		// Deleting all tokens generated for reset password for this user
		await ForgotPassword.deleteMany({ userid: decoded._id });
		res.send({ message: "Password reseted successfully" });
	} catch (e) {
		res.status(500).send({ message: e });
	}
});

module.exports = router;
