const Message=require('../models/message')
const Group = require('../models/group');
const User = require("../models/user");
const jwt = require("jsonwebtoken");

var webSocketServer= function(server) {
  var webSocketServer = new (require("ws").Server)({ server });
  var socketsList = {};

  // Check if token exist in DB or if it is valid
  async function validateToken(token){
    try{
      const decoded = jwt.decode(token, process.env.JWT_SECRET);
      if(!socketsList[decoded._id]){
        const user = await User.findOne({
          _id: decoded._id,
          "tokens.token": token,
        });

        return user;
      }
      return socketsList[decoded._id].user;
    }catch(e){
      return null
    }
  }

  // Send Message
  function send(webSocket,formattedResponse,userId,response){
	var toUserWebSocket = socketsList[formattedResponse.touserid]
			? socketsList[formattedResponse.touserid].webSocket
			: undefined;

	// If user is not currently connected to server
	if (toUserWebSocket === undefined)
		return webSocket.send(JSON.stringify(response));
	
	webSocket.send(JSON.stringify(response));
	if (userId !== formattedResponse.touserid) {
		toUserWebSocket.send(JSON.stringify(response));
	}
  }
  
  webSocketServer.on("connection",async function (webSocket, req) {
    // Token from websocket url
    const token = req.url.split("/")[1];
    // Userid
    let userId;
    // Check if user is verified already,if yes dont check again
    const user = await validateToken(token);
	if (user) {
		userId = user._id;
		socketsList[user._id] = { webSocket, user };
	} else {
		userId = null;
		webSocket.send(
			JSON.stringify({
				message: "Invalid token, please refresh your token!",
				token,
			})
		);
	}
    
  
    webSocket.on("message", async (data) => {
		// Check if response is JSON valid.
		try {
			var formattedResponse = JSON.parse(data);
		} catch (e) {
			return webSocket.send(
				JSON.stringify({
					message: "Invalid response recieved.",
				})
			);
		}

		if (userId === null) {
			return webSocket.send(
				JSON.stringify({
					userid: null,
					touserid: null,
					message: "Invalid token, please refresh your token",
				})
			);
		}

		// Storing Message in DB
		const message = new Message({
			userid: userId,
			touserid: formattedResponse.touserid,
			message: formattedResponse.message,
			attachments:formattedResponse.attachments,
		});
		const response=await message.save();
		await response
			.populate({ path: "userid", select: "-tokens -password -channels" })
			.populate({ path: "touserid", select: "-tokens -password -channels" })
			.populate({ path: "attachments" })
			.execPopulate();
		if (response.touserid === null) response.touserid = { _id: formattedResponse.touserid };
		// Group Messaging
		if(formattedResponse.type==='group'){
			const group=await Group.findById(formattedResponse.touserid);
			return group.participants.forEach(p=>{
				if (socketsList[p])
					socketsList[p].webSocket.send(JSON.stringify(response));
				// var toUserWebSocket = socketsList[formattedResponse.touserid]
				// 	? socketsList[formattedResponse.touserid].webSocket
				// 	: undefined;
				// // If user is not currently connected to server
				// if (toUserWebSocket === undefined)
				// return webSocket.send(JSON.stringify(response));

				// webSocket.send(JSON.stringify(response));
				// if (userId !== formattedResponse.touserid) {
				// 	toUserWebSocket.send(JSON.stringify(response));
				// }
			})
		}
		send(webSocket,formattedResponse,userId,response)

	});
  
    webSocket.on("close", (message) => {
			webSocket.send("connection closed");
			console.log("connection closed");
		});
  });
}

module.exports=webSocketServer;
