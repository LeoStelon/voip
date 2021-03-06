const mongoose = require("mongoose");
const User = require("./user");

const messageSchema = new mongoose.Schema(
	{
		userid: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: "User",
		},
		touserid: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: "User",
		},
		message: {
			type: String,
			default: "",
			trim: true,
		},
		attachments: [
			{
				type: mongoose.Types.ObjectId,
				required: true,
				ref: "Attachment",
			},
		],
		seen: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{ timestamps: true }
);

messageSchema.pre("save", async function (next) {
	const message = this;
	const users = await User.find({
		$or: [{ _id: message.userid }, { _id: message.touserid }],
	});

	await users.forEach(async (user) => {
		const channelList = user.channels.map((channel) => channel.private);
		if (user._id.equals(message.touserid)) {
			channelList.indexOf(message.userid) === -1
				? user.channels.push({ private: message.userid, group: message.userid })
				: null;
		} else {
			channelList.indexOf(message.touserid) === -1
				? user.channels.push({
						private: message.touserid,
						group: message.touserid,
				  })
				: null;
		}
		await user.save();
	});
	next();
});

const Message = new mongoose.model("Message", messageSchema);
module.exports = Message;
