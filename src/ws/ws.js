const Message=require('../models/message')
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
			});
			await message.save();

			var toUserWebSocket = socketsList[formattedResponse.touserid]
				? socketsList[formattedResponse.touserid].webSocket
				: undefined;

			// Invalid userid validation
			if (toUserWebSocket === undefined)
				return webSocket.send(JSON.stringify({userid: userId,touserid: formattedResponse.touserid,message: formattedResponse.message,}));

			if (userId !== formattedResponse.touserid) {
				toUserWebSocket.send(JSON.stringify({userid: userId,touserid: formattedResponse.touserid,message: formattedResponse.message,}));
				webSocket.send(JSON.stringify({userid: userId,touserid: formattedResponse.touserid,message: formattedResponse.message,}));
			} else {
				webSocket.send(JSON.stringify({userid: userId,touserid: formattedResponse.touserid,message: formattedResponse.message,}));
			}
		});
  
    webSocket.on("close", (message) => {
			webSocket.send("connection closed");
			console.log("connection closed");
		});
  });
}

module.exports=webSocketServer;
