const express = require("express");
const Message = require("../models/message");
const User = require("../models/user");
const Attachment = require("../models/attachment");
const router = express.Router();
var mongoose = require("mongoose");
const auth = require("../middlewares/auth");

// Multer Configuration
const multer = require("multer");
const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	storage: multer.diskStorage({
		destination: "public/cdn/",
		filename: function (req, file, cb) {
			cb(null, Date.now() + "-" + file.fieldname + "-" + file.originalname);
		},
	}),
});

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
			.populate({ path: "attachments"})
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

// Post Media
router.post("/message", auth, upload.array("media", 5),async (req, res) => {
	try {
		let attachments=[];
		// Storing Attachments in DB
		for (const file of req.files) {
			const attachment= new Attachment({
				filename:file.originalname,
				type:file.mimetype,
				path:file.path,
				size:file.size
			})
			await attachment.save();
			attachments.push(attachment._id)
		}
		res.send(attachments);
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
},(error,req,res,next)=>{
	res.status(400).send({message:error.message});
});

module.exports = router;
