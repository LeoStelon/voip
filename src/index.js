require('./database/mongoose')
const path=require("path")
var cors = require('cors')
const express=require('express')
const User=require('./routers/user')
const Message = require('./routers/message')

const port=process.env.PORT || 3000
const app=express()

const http = require('http');
const server = http.createServer(app);
//Websocket Server
require('./ws/ws')(server)

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath));

app.use(cors())
app.use(express.json())
app.use(User)
app.use(Message)

app.get('/test',(req,res)=>{
    res.send({message:'Server OK.'})
})

server.listen(port,()=>{
    console.log('Server listening on port '+port)
})