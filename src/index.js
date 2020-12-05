require('./database/mongoose')
const path=require("path")
var cors = require('cors')
const express=require('express')
const User=require('./routers/user')
const Message = require('./routers/message')
const ForgotPassword = require('./routers/forgotpass')

const port=process.env.PORT || 3000
const app=express()

const http = require('http');
const auth = require('./middlewares/auth')
const server = http.createServer(app);
//Websocket Server
// require('./ws/ws')(server)

const publicDirectoryPath = path.join(__dirname,'../public')
const cdnDirectoryPath = path.join(__dirname,'../cdn')

app.use(express.static(publicDirectoryPath));
app.use(express.static(cdnDirectoryPath));

app.use(cors())
app.use(express.json())
app.use(User)
app.use(Message)
app.use(ForgotPassword)

app.get('/test',(req,res)=>{
    res.send({message:'Server OK.'})
})

const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    ws.send(message)
  });

  ws.send('Connected');
});

const url = require('url');
server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
  
    if (pathname === '/test') {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    } else {
        // Websocket Server
        require('./ws/ws')(server)
    }
});

server.listen(port,()=>{
    console.log('Server listening on port '+port)
})