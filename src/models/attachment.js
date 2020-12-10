const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
	filename: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
		required: true,
	},
	path: {
		type: String,
		required: true,
		trim: true,
	},
	type: {
		type: String,
		required: true,
		trim: true,
	},
});

const Attachment = new mongoose.model("Attachment", attachmentSchema);

module.exports = Attachment;
