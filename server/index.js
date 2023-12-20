// // import { createServer } from "http";
// // import { Server } from "socket.io";
const express = require("express")
const http = require("http")
const {Server} = require('socket.io')

const app = express()

const httpServer = http.createServer(app)

app.get("/",(req,res)=>{
  res.send("hello from server")
})

const io = new Server(httpServer,{
  cors: {
    origin: "http://localhost:5173"
  }
})

var records = new Map();
const usersToUniquedID = new Map();
const uniqueIdTousers = new Map();

io.on("connection",(socket)=>{
  
  socket.on("joinRoom",(temp)=>{
    socket.join(Number(temp))
    records.set(socket.id,Number(temp))
    socket.emit("ack",`You have joined room ${temp}`)
  })

  socket.on("message",(temp)=>{
    const roomNum = records.get(socket.id)
    io.to(roomNum).emit("roomMsg",temp)
  })

  socket.on("details",(data)=>{
    var user = data.socketId
    var uniqueId = data.uniqueId

    usersToUniquedID.set(user,uniqueId)
    uniqueIdTousers.set(uniqueId,user)
    for (let [key, value] of usersToUniquedID) {
      console.log(key + " = " + value);
      }
  })

  socket.on("send-signal",(temp)=>{
    console.log(temp);
    var to = temp.to
    var socketOfPartner = uniqueIdTousers.get(to)
    io.to(socketOfPartner).emit("signaling",{
        from:temp.from,
        signalData:temp.signalData,
        to:temp.to
    })
    // io.emit("receive-signal",temp)
  })

  socket.on("accept-signal",(temp)=>{
    console.log(temp);
    var to = temp.to
    var socketOfPartner = uniqueIdTousers.get(to)
    console.log(socketOfPartner);
    io.to(socketOfPartner).emit("callAccepted",{
      signalData:temp.signalData,
      to:temp.to
  })
  })
})

httpServer.listen(8000,()=>{
  console.log("Listining on 8000");
})
