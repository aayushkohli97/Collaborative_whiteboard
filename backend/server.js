const express = require("express");
const app = express();

const server = require("http").createServer(app);
const {Server } = require("socket.io");
const io = new Server(server)
// routes
app.get("/",(req,res)=>{
    res.send("This is mern realtime board sharing app ");
});
io.on("connection",(socket)=>{
    socket.on("userJoined",(data) =>{
        const {name,userId,roomId,host,presenter} = data;
        socket.join(roomId);  
        socket.emit("userIsJoined",{success:true});
    });
});

const port = process.env.PORT || 5000;
server.listen(port,()=> console.log("server is running on http://localhost:5000"))