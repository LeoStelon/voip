const Message=require('../models/message')
var webSocketServer = new (require("ws").Server)({
	port: process.env.PORT || 8080,
});
var socketsList = {};

webSocketServer.on("connection",async function (webSocket, req) {
  // Userid
  const userId = req.url.split("/")[1];

  socketsList[userId]=webSocket;

	webSocket.on("message", async (response) => {
    var formattedResponse=JSON.parse(response)
    console.log(formattedResponse)

    // Storing Message in DB
    const message=new Message({userid:userId,toUserId:formattedResponse.touserid,message:formattedResponse.message})
    await message.save()

    var toUserWebSocket = socketsList[formattedResponse.touserid];
    // Invalid userid validation
    if(toUserWebSocket===undefined)return webSocket.send('invalid touserid')

    if(userId!==formattedResponse.touserid){
      toUserWebSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:userId+" : "+formattedResponse.message}));
      webSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:'You : '+formattedResponse.message}))
    }else{
      webSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:'You : '+formattedResponse.message}))
    }
	});

	webSocket.on("close", (message) => {
		console.log("connection closed");
	});
});
