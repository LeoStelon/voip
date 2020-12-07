const express = require("express");
const Message = require("../models/message");
const User = require("../models/user");
const router = express.Router();
var mongoose = require("mongoose");
const auth = require("../middlewares/auth");

// Get Message
router.get("/message/@:touserid", auth, async (req, res) => {
	const userid = req.user._id;
	const touserid = req.params.touserid;
	const limit = req.query.limit;
	try {
		const messages = await Message.find({
			$or: [
				{
					userid,
					touserid,
				},
				{ userid: touserid, touserid: userid },
			],
		})
			.populate({ path: "userid", select: "-tokens -password -channels" })
			.populate({ path: "touserid", select: "-tokens -password -channels" })
			.limit(parseInt(limit))
			.exec();
		res.send({ data: messages });
	} catch (e) {
		if (
			!mongoose.Types.ObjectId.isValid(userid) ||
			!mongoose.Types.ObjectId.isValid(touserid)
		) {
			return res.status(500).send({ message: "Provide proper id's" });
		}
		res.status(500).send({ message: e.message });
	}
});

// Get Chat
router.get("/message/chat", auth, async (req, res) => {
	try {
		let channels = await User.findById(req.user._id, "channels")
			.populate("channels.channel", "-tokens -password")
			.exec();
		res.send(channels);
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

module.exports = router;
