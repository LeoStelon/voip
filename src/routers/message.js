const express = require("express");
const Message = require("../models/message");
const { route } = require("./user");
const router = express.Router();

// Get Message
router.get("/message/all/:userid/:toUserId", async (req, res) => {
	const messages = await Message.find({
		$or: [
			{
				userid: req.params.userid,
				toUserId: req.params.toUserId,
			},
			{ userid: req.params.toUserId, toUserId: req.params.userid },
		],
	});
	res.send({ data: messages });
});

// Get Chat
router.get('/message/chat/:userid',async (req,res)=>{
    const chat=await Message.find({userid:req.params.userid},"toUserId")
    res.send({data:chat})
})

module.exports = router;
