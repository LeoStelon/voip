const mongoose = require("mongoose");
const auth = require("../middlewares/auth");

const messageSchema = new mongoose.Schema({
	userid: {
		type: String,
		required: true,
	},
	toUserId: {
		type: String,
		required: true,
	},
	message: {
		type:String,
		required:true,
		trim:true,
	},
	seen:{
		type:Boolean,
		required:true,
		default:false,
	}
});

const Message = new mongoose.model("Message", messageSchema);
module.exports = Message;
