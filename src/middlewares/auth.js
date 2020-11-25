const User = require("../models/user");
const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		const decoded = jwt.decode(token, process.env.JWT_SECRET);
		const user = await User.findOne({
			_id: decoded._id,
			"tokens.token": token,
		});

		if (!user) {
			throw new Error();
		}
		req.user = user;
		req.token = token;
		next();
	} catch (e) {
		res.status(404).send("Please authenticate");
	}
}

module.exports = auth;
