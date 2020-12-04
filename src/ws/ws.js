const Message=require('../models/message')

var webSocketServer= function(server) {
  var webSocketServer = new (require("ws").Server)({ server });
  var socketsList = {};
  webSocketServer.on("connection",async function (webSocket, req) {
    // Userid
    const userId = req.url.split("/")[1];
  
    socketsList[userId]=webSocket;
  
    webSocket.on("message", async (data) => {
      var formattedResponse=JSON.parse(data)
  
      // Storing Message in DB
      const message=new Message({userid:userId,toUserId:formattedResponse.touserid,message:formattedResponse.message})
      await message.save()
  
      var toUserWebSocket = socketsList[formattedResponse.touserid];
      // Invalid userid validation

      /// Should be checked with backend if user exists
      /// uncomment this
      // if(toUserWebSocket===undefined)return webSocket.send('invalid touserid')
  
      // if(userId!==formattedResponse.touserid){
      //   toUserWebSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:userId+" : "+formattedResponse.message}));
      //   webSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:'You : '+formattedResponse.message}))
      // }else{
      //   webSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:'You : '+formattedResponse.message}))
      // }
      /// This should be changed when when using real users(Uncomment above code and comment or remove the below code)
      if(toUserWebSocket===undefined){
        webSocket.send(JSON.stringify({userid:userId,touserid:formattedResponse.touserid,message:'You : '+formattedResponse.message}))
      }else if(userId!==formattedResponse.touserid){
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
}

module.exports=webSocketServer;
