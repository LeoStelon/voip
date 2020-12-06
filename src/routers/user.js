const express = require("express");
const User = require("../models/user");
const auth = require("../middlewares/auth");

// Multer Configuration
const multer = require("multer");
const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			cb(new Error("please upload only jpg,jpeg or png file format images"));
		}
		cb(undefined, true);
	},
	storage: multer.diskStorage({
		destination: "cdn/",
		filename: function (req, file, cb) {
			cb(null, Date.now() + "-" + file.fieldname + "-" + file.originalname);
		},
	}),
});

const router = express.Router();

// Create
router.post("/user", upload.single("displayimg"), async (req, res) => {
	const user = new User({
		...req.body,
		displayimg : req.file.path
	});
	try {
		await user.save();
		const token = await user.generateToken();
		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send({ message: e.message });
	}
});

// Login
router.post("/user/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.username,
			req.body.password
		);
		const token = await user.generateToken();
		res.send({ user, token });
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

// Logout
router.delete("/user/logout", auth, async (req, res) => {
	req.user.tokens = req.user.tokens.filter(
		(token) => token.token !== req.token
	);
	await req.user.save();
	res.send(req.user);
});

// Read
router.get("/user/me", auth, (req, res) => {
	res.send(req.user);
});

// Update
router.patch("/user", auth, upload.single("displayimg"), async (req, res) => {
	const updates = Object.keys(req.body);
	const availableUpdates = [
		"username",
		"email",
		"password",
		"phone",
		"displayimg",
	];
	const isValid = updates.every((update) => availableUpdates.includes(update));

	if (!isValid) {
		return res.status(400).send();
	}

	updates.forEach((update) => (req.user[update] = req.body[update]));
	if (req.file) {
		req.user.displayimg = req.file.path;
	}
	try {
		await req.user.save();
		res.send(req.user);
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

// Delete
router.delete("/user", auth, async (req, res) => {
	try {
		await req.user.remove();
		res.send(req.user);
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

module.exports = router;
